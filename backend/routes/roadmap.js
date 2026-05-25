// routes/roadmap.js
// Mounts at: /api/roadmap

const express = require("express");
const { generateRoadmapTopics, generateCheatSheet } = require("../controllers/roadmapController");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

// POST /api/roadmap/generate - Requires user to be signed in
router.post("/generate", authenticate, generateRoadmapTopics);

// POST /api/roadmap/cheat-sheet - Generates markdown study notes
router.post("/cheat-sheet", authenticate, generateCheatSheet);

module.exports = router;
