// controllers/authController.js
// Handles: POST /api/auth/register
//          POST /api/auth/login
//          POST /api/auth/logout
//          GET  /api/auth/me

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const prisma = require("../config/db");
const { signToken, attachCookie, clearCookie } = require("../config/jwt");
const { sendMail } = require("../services/mailService");

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────

/** Update login streak and last active timestamp. */
async function updateStreakAndLastActive(user) {
  const now = new Date();
  const lastActive = user.lastActiveAt;
  let newStreak = user.currentStreak;

  if (lastActive) {
    const diffDays = Math.floor(
      (now - new Date(lastActive)) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) newStreak += 1;           // consecutive day
    else if (diffDays > 1) newStreak = 1;          // streak broken
  } else {
    newStreak = 1; // first ever login
  }

  const longestStreak = Math.max(newStreak, user.longestStreak);

  return await prisma.user.update({
    where: { id: user.id },
    data: {
      lastActiveAt: now,
      currentStreak: newStreak,
      longestStreak,
    },
  });
}

/** Strip the password hash before sending user data to client. */
function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

/** Build a safe user response payload with token attached via cookie. */
function respondWithToken(res, user, statusCode = 200) {
  const token = signToken({ id: user.id, email: user.email });
  attachCookie(res, token);

  return res.status(statusCode).json({
    success: true,
    user: sanitizeUser(user),
  });
}

// ─────────────────────────────────────────────────────────
//  REGISTER  — POST /api/auth/register
// ─────────────────────────────────────────────────────────
async function register(req, res) {
  // 1. Validate input (rules defined in routes/auth.js)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // 2. Duplicate email check
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "An account with this email already exists." });
    }

    // 3. Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Create user
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    // 5. Respond with JWT cookie
    return respondWithToken(res, user, 201);
  } catch (err) {
    console.error("[register]", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
}

// ─────────────────────────────────────────────────────────
//  LOGIN  — POST /api/auth/login
// ─────────────────────────────────────────────────────────
async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // 1. Look up user — include passwordHash for comparison
    const user = await prisma.user.findUnique({ where: { email } });

    // 2. Generic error message prevents user-enumeration attacks
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    // 4. Update last active timestamp & streak
    const updatedUser = await updateStreakAndLastActive(user);

    return respondWithToken(res, updatedUser);
  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
}

// ─────────────────────────────────────────────────────────
//  LOGOUT  — POST /api/auth/logout
// ─────────────────────────────────────────────────────────
function logout(req, res) {
  clearCookie(res);
  return res.status(200).json({ success: true, message: "Logged out successfully." });
}

// ─────────────────────────────────────────────────────────
//  GET ME  — GET /api/auth/me  (protected)
// ─────────────────────────────────────────────────────────
async function getMe(req, res) {
  // req.user is already populated by authenticate middleware
  return res.status(200).json({ success: true, user: req.user });
}

// ─────────────────────────────────────────────────────────
//  GOOGLE OAUTH Redirect & Callback
// ─────────────────────────────────────────────────────────

async function googleRedirect(req, res) {
  try {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      client_id: process.env.GOOGLE_CLIENT_ID,
      access_type: "offline",
      response_type: "code",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
    };
    const qs = new URLSearchParams(options);
    return res.redirect(`${rootUrl}?${qs.toString()}`);
  } catch (err) {
    console.error("[googleRedirect]", err);
    return res.status(500).json({ success: false, message: "Google redirection failed." });
  }
}

async function googleCallback(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=Google auth code missing`);
  }

  try {
    // 1. Exchange code for access & ID tokens
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const values = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      grant_type: "authorization_code",
    };
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(values),
    });
    const tokens = await response.json();

    if (!tokens.access_token) {
      console.error("[googleCallback] Failed to get tokens:", tokens);
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=Failed to retrieve Google tokens`);
    }

    // 2. Retrieve profile using access token
    const profileRes = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?alt=json&access_token=${tokens.access_token}`);
    const profile = await profileRes.json();

    if (!profile.email) {
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=Google profile email missing`);
    }

    // 3. Find or create the user in the database
    let user = await prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      const randomPassword = require("crypto").randomBytes(16).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 12);
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name || profile.email.split("@")[0],
          passwordHash,
        },
      });
    }

    // 4. Update login streak & last active timestamp
    const updatedUser = await updateStreakAndLastActive(user);

    // 5. Sign token & attach to cookie
    const token = signToken({ id: updatedUser.id, email: updatedUser.email });
    attachCookie(res, token);

    // 6. Redirect back to frontend dashboard
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard`);
  } catch (err) {
    console.error("[googleCallback]", err);
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=Google authentication failed`);
  }
}

// ─────────────────────────────────────────────────────────
//  PASSWORD RESET Flow
// ─────────────────────────────────────────────────────────

async function forgotPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    // For security, do not expose whether the user exists or not
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email is registered, a password reset link has been sent.",
      });
    }

    // Generate token valid for 15 minutes, signed using user-specific secret (JWT_SECRET + user.passwordHash)
    const resetSecret = (process.env.JWT_SECRET || "fallback_secret") + user.passwordHash;
    const token = jwt.sign({ id: user.id }, resetSecret, { expiresIn: "15m" });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetLink = `${clientUrl}/reset-password/${token}`;

    const emailSent = await sendMail({
      to: user.email,
      subject: "Reset your password — Smart Personalized Learning",
      text: `Reset your password at: ${resetLink}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; color: #1e293b;">
          <h2 style="color: #4f46e5;">Reset Your Password</h2>
          <p>You requested to reset your password for <strong>Smart Personalized Learning</strong>.</p>
          <p>Please click the button below to set a new password. This link is valid for 15 minutes:</p>
          <div style="margin: 24px 0;">
            <a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4f46e5;">${resetLink}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    // Always log the link to the console for easy local testing
    console.log("\n🔑 [PASSWORD RESET LINK]:", resetLink, "\n");

    return res.status(200).json({
      success: true,
      message: emailSent
        ? "Password reset link has been sent to your email."
        : "Password reset link generated. (Logged to backend terminal for local testing)",
    });
  } catch (err) {
    console.error("[forgotPassword]", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
}

async function resetPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { token } = req.params;
  const { password } = req.body;

  try {
    // 1. Decode token to extract user ID without checking signature first
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      return res.status(400).json({ success: false, message: "Invalid or malformed reset link." });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // 2. Verify token signature using JWT_SECRET + user.passwordHash
    const resetSecret = (process.env.JWT_SECRET || "fallback_secret") + user.passwordHash;
    try {
      jwt.verify(token, resetSecret);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Password reset link has expired or is invalid." });
    }

    // 3. Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Save and update password hash (which changes resetSecret, invalidating this token immediately)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return res.status(200).json({ success: true, message: "Password has been reset successfully. You can now log in." });
  } catch (err) {
    console.error("[resetPassword]", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
}

/**
 * Updates user XP and Streak in database, leveling up and checking achievements.
 * POST /api/auth/update-xp
 */
async function updateXP(req, res) {
  const { xpGained, streakGained } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const currentXP = user.totalXP + (xpGained || 0);
    const currentStreak = streakGained !== undefined ? streakGained : user.currentStreak;
    const newLevel = Math.floor(currentXP / 200) + 1;
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        totalXP: currentXP,
        currentStreak: currentStreak,
        level: newLevel,
        lastActiveAt: new Date(),
      },
    });

    // Check and award achievements
    const achievementsToAward = [];
    
    if (currentXP >= 10) {
      achievementsToAward.push({
        badgeId: "first_xp",
        title: "First Spark",
        description: "Earned your first 10 XP!",
        icon: "⚡",
      });
    }
    if (currentXP >= 100) {
      achievementsToAward.push({
        badgeId: "century",
        title: "Knowledge Century",
        description: "Reached 100 XP milestones!",
        icon: "💯",
      });
    }
    if (currentXP >= 500) {
      achievementsToAward.push({
        badgeId: "grandmaster",
        title: "Grandmaster",
        description: "Reached 500 XP level!",
        icon: "👑",
      });
    }
    if (currentStreak >= 3) {
      achievementsToAward.push({
        badgeId: "streak_3",
        title: "Triple Streak",
        description: "Maintained a 3-day learning streak!",
        icon: "🔥",
      });
    }
    if (currentStreak >= 7) {
      achievementsToAward.push({
        badgeId: "streak_7",
        title: "Weekly Warrior",
        description: "Maintained a 7-day learning streak!",
        icon: "☀️",
      });
    }

    // Save new achievements (ignore duplicates via catch)
    for (const ach of achievementsToAward) {
      try {
        await prisma.achievement.create({
          data: {
            userId: user.id,
            badgeId: ach.badgeId,
            title: ach.title,
            description: ach.description,
            icon: ach.icon,
          },
        });
      } catch (e) {
        // Already unlocked
      }
    }

    const unlockedAchievements = await prisma.achievement.findMany({
      where: { userId: user.id },
    });

    return res.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        level: updatedUser.level,
        totalXP: updatedUser.totalXP,
        currentStreak: updatedUser.currentStreak,
      },
      achievements: unlockedAchievements,
    });
  } catch (err) {
    console.error("❌ Error updating user XP:", err);
    return res.status(500).json({ success: false, message: "Failed to update progress." });
  }
}

/**
 * Fetches the global top 10 users ranked by total XP.
 * GET /api/auth/leaderboard
 */
async function getLeaderboard(req, res) {
  try {
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        level: true,
        totalXP: true,
        currentStreak: true,
      },
      orderBy: { totalXP: "desc" },
      take: 10,
    });
    return res.json({ success: true, leaderboard: topUsers });
  } catch (err) {
    console.error("❌ Error fetching leaderboard:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch leaderboard." });
  }
}

/**
 * Fetches all unlocked achievements for the logged-in user.
 * GET /api/auth/achievements
 */
async function getAchievements(req, res) {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { userId: req.user.id },
      orderBy: { unlockedAt: "desc" },
    });
    return res.json({ success: true, achievements });
  } catch (err) {
    console.error("❌ Error fetching achievements:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch achievements." });
  }
}

module.exports = { 
  register, 
  login, 
  logout, 
  getMe, 
  googleRedirect, 
  googleCallback, 
  forgotPassword, 
  resetPassword,
  updateXP,
  getLeaderboard,
  getAchievements
};
