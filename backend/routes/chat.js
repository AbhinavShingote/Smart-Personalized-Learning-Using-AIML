// routes/chat.js
// Mounts at: /api/chat

const express = require("express");
const { handleChatMessage, getChatHistory } = require("../controllers/chatController");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

// POST /api/chat/message - Requires user to be signed in
router.post("/message", authenticate, handleChatMessage);

// GET /api/chat/history - Fetch persistent history
router.get("/history", authenticate, getChatHistory);

module.exports = router;
