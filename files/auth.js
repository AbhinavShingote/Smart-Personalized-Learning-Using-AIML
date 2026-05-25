// routes/auth.js
// Mounts at: /api/auth

const express = require("express");
const { body } = require("express-validator");
const { register, login, logout, getMe } = require("../controllers/authController");
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

// ─── Routes ─────────────────────────────────────────────

// POST /api/auth/register
router.post("/register", registerRules, register);

// POST /api/auth/login
router.post("/login", loginRules, login);

// POST /api/auth/logout
router.post("/logout", logout);

// GET /api/auth/me  ← protected
router.get("/me", authenticate, getMe);

module.exports = router;
