// middleware/authenticate.js
// Protects any route that requires a logged-in user.
// Reads the JWT from the HTTP-only cookie, verifies it,
// and attaches the decoded user to req.user.

const { verifyToken } = require("../config/jwt");
const prisma = require("../config/db");

async function authenticate(req, res, next) {
  try {
    // 1. Pull token from cookie (primary) or Authorization header (fallback for
    //    API clients / mobile apps that can't use cookies easily)
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in.",
      });
    }

    // 2. Verify signature & expiry
    const decoded = verifyToken(token);

    // 3. Confirm the user still exists in DB (handles deleted accounts)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        level: true,
        totalXP: true,
        currentStreak: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    // 4. Attach to request — available in all downstream route handlers
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    });
  }
}

module.exports = authenticate;
