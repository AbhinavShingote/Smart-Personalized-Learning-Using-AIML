// routes/auth.js
// Mounts at: /api/auth

const express = require("express");
const { body } = require("express-validator");
const { register, login, logout, getMe, googleRedirect, googleCallback, forgotPassword, resetPassword, updateXP, getLeaderboard, getAchievements } = require("../controllers/authController");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

// ─── Validation rule sets ────────────────────────────────

const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required.")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters."),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email.")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/).withMessage("Password must contain at least one number."),
];

const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email.")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required."),
];

const forgotPasswordRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Please provide a valid email.")
    .normalizeEmail(),
];

const resetPasswordRules = [
  body("password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
    .matches(/[0-9]/).withMessage("Password must contain at least one number."),
];

// ─── Routes ─────────────────────────────────────────────

// POST /api/auth/register
router.post("/register", registerRules, register);

// POST /api/auth/login
router.post("/login", loginRules, login);

// POST /api/auth/logout
router.post("/logout", logout);

// GET /api/auth/google
router.get("/google", googleRedirect);

// GET /api/auth/google/callback
router.get("/google/callback", googleCallback);

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPasswordRules, forgotPassword);

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", resetPasswordRules, resetPassword);

// GET /api/auth/me  ← protected
router.get("/me", authenticate, getMe);

// POST /api/auth/trigger-streak-reminders (triggers DB-wide scan manually)
router.post("/trigger-streak-reminders", async (req, res) => {
  const { sendStreakReminders } = require("../services/scheduler");
  try {
    await sendStreakReminders();
    return res.json({ success: true, message: "Streak reminders check executed manually." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/test-streak-email (sends a mock reminder to the logged-in user)
router.post("/test-streak-email", authenticate, async (req, res) => {
  const { sendMail } = require("../services/mailService");
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  try {
    const user = req.user;
    const currentStreak = user.currentStreak || 3; // mock a 3-day streak if currently 0 for testing

    const emailSent = await sendMail({
      to: user.email,
      subject: `🔥 Don't lose your ${currentStreak}-day learning streak, ${user.name}!`,
      text: `Keep your ${currentStreak}-day streak going! Log in to Smart Personalized Learning to complete today's goal: ${clientUrl}/dashboard`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; color: #1e293b; text-align: center; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fafafa; margin: 0 auto;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔥</div>
          <h2 style="color: #4f46e5; margin-bottom: 8px; font-family: sans-serif;">Keep the fire burning, ${user.name}!</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; font-family: sans-serif;">
            You have an active <strong>${currentStreak}-day</strong> learning streak. Don't let it reset to 0!
          </p>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 24px; font-family: sans-serif;">
            Log in to your dashboard now, resume your custom roadmaps, and complete your learning topics for today to keep your streak alive.
          </p>
          <div style="margin: 28px 0;">
            <a href="${clientUrl}/dashboard" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; font-family: sans-serif;">
              Resume Learning & Keep Streak →
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; font-family: sans-serif;">
            If you already completed your learning for today, you can safely ignore this reminder. Keep up the amazing work!
          </p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: emailSent
        ? "Streak reminder test email sent to your inbox."
        : "Streak reminder email generated. (Logged to backend terminal for local testing)"
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/leaderboard - Fetch top 10 users ranked by XP
router.get("/leaderboard", authenticate, getLeaderboard);

// GET /api/auth/achievements - Fetch current user's unlocked achievements
router.get("/achievements", authenticate, getAchievements);

// POST /api/auth/update-xp - Increment user XP and check level/badges
router.post("/update-xp", authenticate, updateXP);

module.exports = router;
