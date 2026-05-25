// config/jwt.js
// Centralised JWT helpers used by auth controller & middleware.

const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

/**
 * Sign a new JWT containing the user's id and email.
 * @param {Object} payload  - { id, email }
 * @returns {string}        - signed token string
 */
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verify and decode a JWT.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 * @param {string} token
 * @returns {Object} decoded payload
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

/**
 * Attach the JWT as an HTTP-only cookie on the response.
 * HTTP-only prevents JS access → protects against XSS.
 * @param {Response} res
 * @param {string}   token
 */
function attachCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,               // not accessible via document.cookie
    secure: isProduction,         // HTTPS only in prod
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
}

/**
 * Clear the auth cookie (used on logout).
 */
function clearCookie(res) {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
}

module.exports = { signToken, verifyToken, attachCookie, clearCookie };
