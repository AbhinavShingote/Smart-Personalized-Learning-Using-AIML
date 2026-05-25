// controllers/authController.js
// Handles: POST /api/auth/register
//          POST /api/auth/login
//          POST /api/auth/logout
//          GET  /api/auth/me

const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const prisma = require("../config/db");
const { signToken, attachCookie, clearCookie } = require("../config/jwt");

// ─────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────

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
    const now = new Date();
    const lastActive = user.lastActiveAt;
    let newStreak = user.currentStreak;

    if (lastActive) {
      const diffDays = Math.floor(
        (now - new Date(lastActive)) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) newStreak += 1;           // consecutive day
      else if (diffDays > 1) newStreak = 1;          // streak broken
      // diffDays === 0 means same day login, keep streak unchanged
    } else {
      newStreak = 1; // first ever login
    }

    const longestStreak = Math.max(newStreak, user.longestStreak);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: now,
        currentStreak: newStreak,
        longestStreak,
      },
    });

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

module.exports = { register, login, logout, getMe };
