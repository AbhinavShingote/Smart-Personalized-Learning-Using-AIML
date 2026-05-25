// server.js
// Entry point for the Smart Learning Platform backend.

require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const roadmapRoutes = require("./routes/roadmap");
const chatRoutes = require("./routes/chat");
const prisma = require("./config/db");
const { initScheduler } = require("./services/scheduler");

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────
//  Global Middleware
// ─────────────────────────────────────────────────────────

app.set("trust proxy", 1); // Trust first proxy (Render/Railway)

// CORS — allow the React dev server to send cookies cross-origin
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "https://smart-personalized-learning-ai.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        // Pass the exact origin string instead of `true` to prevent header formatting errors
        callback(null, origin || "*");
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());           // parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());           // parse cookie header → req.cookies

// ─────────────────────────────────────────────────────────
//  Rate Limiting
// ─────────────────────────────────────────────────────────

// Strict limit on auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 20 : 1000, // 20 in production, 1000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again in 15 minutes.",
  },
});

// General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─────────────────────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────────────────────

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/roadmap", apiLimiter, roadmapRoutes);
app.use("/api/chat", apiLimiter, chatRoutes);

// Health check — useful for deployment platforms (Railway, Render, etc.)
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running 🚀", env: process.env.NODE_ENV });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[GlobalError]", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong on the server.",
  });
});

// ─────────────────────────────────────────────────────────
//  Start Server
// ─────────────────────────────────────────────────────────

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected via Prisma");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      
      // Initialize cron jobs
      initScheduler();
    });
  } catch (err) {
    console.error("❌ Failed to connect to database:", err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing DB connection...");
  await prisma.$disconnect();
  process.exit(0);
});
