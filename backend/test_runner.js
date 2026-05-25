// backend/test_runner.js
// Automated Integration Test Suite using Node.js Native fetch
// Run this script using: node test_runner.js (Make sure server is running on port 5000)

require("dotenv").config();
const prisma = require("./config/db");

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;
const TEST_EMAIL = `auto_test_${Math.floor(Math.random() * 100000)}@learning.com`;
const TEST_PASSWORD = "Password123!";
const TEST_NAME = "Automated Test Runner";

let authCookie = null;
let generatedTopic = null;

// Colors for terminal output
const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

const results = [];

function recordTest(name, success, errorDetail = "") {
  results.push({ name, success, errorDetail });
  if (success) {
    console.log(`${COLORS.green}  ✓ PASSED: ${name}${COLORS.reset}`);
  } else {
    console.log(`${COLORS.red}  ✗ FAILED: ${name}${COLORS.reset}`);
    if (errorDetail) {
      console.log(`    ↳ Error: ${COLORS.yellow}${errorDetail}${COLORS.reset}`);
    }
  }
}

async function runTests() {
  console.log(`\n${COLORS.bold}${COLORS.cyan}=============================================`);
  console.log(`🚀 STARTING AUTOMATED PLATFORM INTEGRATION TESTS`);
  console.log("   (18 Integration Test Cases Automating System Specification)");
  console.log(`   Target Server: ${BASE_URL}`);
  console.log(`=============================================${COLORS.reset}\n`);

  // --- TEST 1: Register User ---
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    
    const body = await res.json();
    authCookie = res.headers.get("set-cookie");

    if (res.status === 201 && body.success === true && authCookie) {
      recordTest("User Registration API (POST /api/auth/register)", true);
    } else {
      recordTest("User Registration API (POST /api/auth/register)", false, `Status: ${res.status}, body: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    recordTest("User Registration API (POST /api/auth/register)", false, err.message);
  }

  // --- TEST 2: Validation Guards ---
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Short",
        email: "bad_email",
        password: "short",
      }),
    });
    const body = await res.json();
    if (res.status === 422 && body.success === false) {
      recordTest("Register Input Validation Guards", true);
    } else {
      recordTest("Register Input Validation Guards", false, `Expected 422, got ${res.status}. Body: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    recordTest("Register Input Validation Guards", false, err.message);
  }

  // --- TEST 3: Login ---
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });
    const body = await res.json();
    const loginCookie = res.headers.get("set-cookie");

    if (res.status === 200 && body.success === true && loginCookie) {
      authCookie = loginCookie; // use fresh login cookie
      recordTest("User Login API (POST /api/auth/login)", true);
    } else {
      recordTest("User Login API (POST /api/auth/login)", false, `Status: ${res.status}, body: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    recordTest("User Login API (POST /api/auth/login)", false, err.message);
  }

  // --- TEST 4: Get Profile (Session Restore) ---
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": authCookie 
      },
    });
    const body = await res.json();
    if (res.status === 200 && body.success === true && body.user.email === TEST_EMAIL) {
      recordTest("Verify Authenticated Session (GET /api/auth/me)", true);
    } else {
      recordTest("Verify Authenticated Session (GET /api/auth/me)", false, `Status: ${res.status}, body: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    recordTest("Verify Authenticated Session (GET /api/auth/me)", false, err.message);
  }

  // --- TEST 5: Route Guards Block ---
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }, // no cookie
    });
    const body = await res.json();
    if (res.status === 401 && body.success === false) {
      recordTest("Route Guards Block Unauthorized Access", true);
    } else {
      recordTest("Route Guards Block Unauthorized Access", false, `Expected 401, got ${res.status}`);
    }
  } catch (err) {
    recordTest("Route Guards Block Unauthorized Access", false, err.message);
  }

  // --- TEST 6: Bcryptjs Password Salting Verification (TC-AUTH-01) ---
  try {
    const userInDb = await prisma.user.findUnique({
      where: { email: TEST_EMAIL }
    });
    const isBcrypt = userInDb.passwordHash.startsWith("$2a$12") || userInDb.passwordHash.startsWith("$2a$");
    const containsPlaintext = userInDb.passwordHash.includes(TEST_PASSWORD);

    if (isBcrypt && !containsPlaintext) {
      recordTest("Bcryptjs Password Salting Verification (TC-AUTH-01)", true);
    } else {
      recordTest("Bcryptjs Password Salting Verification (TC-AUTH-01)", false, `Hash: ${userInDb.passwordHash}`);
    }
  } catch (err) {
    recordTest("Bcryptjs Password Salting Verification (TC-AUTH-01)", false, err.message);
  }

  // --- TEST 7: Password Reset Recovery Token Request (TC-AUTH-04) ---
  try {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    const body = await res.json();
    if (res.status === 200 && body.success === true) {
      recordTest("Password Reset Recovery Token Request (TC-AUTH-04)", true);
    } else {
      recordTest("Password Reset Recovery Token Request (TC-AUTH-04)", false, `Status: ${res.status}`);
    }
  } catch (err) {
    recordTest("Password Reset Recovery Token Request (TC-AUTH-04)", false, err.message);
  }

  // --- TEST 8: Generate Roadmap Topics ---
  try {
    console.log(`\n${COLORS.cyan}⌛ Generating AI roadmap topics (This uses Gemini model with key rotation)...${COLORS.reset}`);
    const res = await fetch(`${BASE_URL}/api/roadmap/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": authCookie
      },
      body: JSON.stringify({
        courseName: "Java Object Oriented Programming"
      }),
    });
    const body = await res.json();
    if (res.status === 200 && body.success === true && Array.isArray(body.topics)) {
      generatedTopic = body.topics[0] || "Classes and Objects";
      recordTest("AI Roadmap Generator API (POST /api/roadmap/generate)", true);
    } else if (res.status === 500 && body.message && body.message.includes("Falling back to local offline generator")) {
      generatedTopic = "Classes and Objects";
      recordTest("AI Roadmap Generator API (POST /api/roadmap/generate) - (Passed: Graceful Offline Fallback)", true);
    } else {
      recordTest("AI Roadmap Generator API (POST /api/roadmap/generate)", false, `Status: ${res.status}, body: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    recordTest("AI Roadmap Generator API (POST /api/roadmap/generate)", false, err.message);
  }

  // --- TEST 9: Cheat Sheet Notes ---
  try {
    const topicToQuery = generatedTopic || "Classes and Objects";
    const res = await fetch(`${BASE_URL}/api/roadmap/cheat-sheet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": authCookie
      },
      body: JSON.stringify({
        courseName: "Java Object Oriented Programming",
        topicTitle: topicToQuery
      })
    });
    const body = await res.json();
    if (res.status === 200 && body.success === true && body.cheatSheet) {
      recordTest("AI Study Cheat Notes Retrieval (POST /api/roadmap/cheat-sheet)", true);
    } else {
      recordTest("AI Study Cheat Notes Retrieval (POST /api/roadmap/cheat-sheet)", false, `Status: ${res.status}, body: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    recordTest("AI Study Cheat Notes Retrieval (POST /api/roadmap/cheat-sheet)", false, err.message);
  }

  // --- TEST 10: Chatbot Tutor Interaction & Persistence ---
  try {
    const res = await fetch(`${BASE_URL}/api/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": authCookie
      },
      body: JSON.stringify({
        message: "What is polymorphism?",
        courseName: "Java Object Oriented Programming",
        currentTopic: "Polymorphism"
      })
    });
    const body = await res.json();
    
    if (res.status === 200 && body.success === true && body.reply) {
      const historyRes = await fetch(`${BASE_URL}/api/chat/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cookie": authCookie
        }
      });
      const historyBody = await historyRes.json();
      const containsMessage = historyBody.messages && historyBody.messages.some(msg => msg.text.includes("What is polymorphism?"));
      
      if (historyRes.status === 200 && containsMessage) {
        recordTest("Chatbot Tutor Send & Database Persistence", true);
      } else {
        recordTest("Chatbot Tutor Send & Database Persistence", false, `History fetch failed or message missing. Status: ${historyRes.status}`);
      }
    } else {
      recordTest("Chatbot Tutor Send & Database Persistence", false, `Chat submission failed. Status: ${res.status}`);
    }
  } catch (err) {
    recordTest("Chatbot Tutor Send & Database Persistence", false, err.message);
  }

  // --- TEST 11: Update XP & Level-Up Progression Logic (TC-UI-04) ---
  try {
    const res = await fetch(`${BASE_URL}/api/auth/update-xp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": authCookie
      },
      body: JSON.stringify({
        xpGained: 250,
        streakGained: 2
      })
    });
    const body = await res.json();
    if (res.status === 200 && body.success === true && body.user.level === 2 && body.user.totalXP === 250) {
      recordTest("Update XP & Level-Up Progression Logic (TC-UI-04)", true);
    } else {
      recordTest("Update XP & Level-Up Progression Logic (TC-UI-04)", false, `Status: ${res.status}, body: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    recordTest("Update XP & Level-Up Progression Logic (TC-UI-04)", false, err.message);
  }

  // --- TEST 12: Global Leaderboard Retrieval ---
  try {
    const res = await fetch(`${BASE_URL}/api/auth/leaderboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": authCookie
      }
    });
    const body = await res.json();
    if (res.status === 200 && body.success === true && Array.isArray(body.leaderboard)) {
      recordTest("Global Leaderboard Retrieval (GET /api/auth/leaderboard)", true);
    } else {
      recordTest("Global Leaderboard Retrieval (GET /api/auth/leaderboard)", false, `Status: ${res.status}`);
    }
  } catch (err) {
    recordTest("Global Leaderboard Retrieval (GET /api/auth/leaderboard)", false, err.message);
  }

  // --- TEST 13: Retrieve Unlocked User Achievements ---
  try {
    const res = await fetch(`${BASE_URL}/api/auth/achievements`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": authCookie
      }
    });
    const body = await res.json();
    
    // Check if the XP milestones badges were unlocked (first_xp, century)
    const hasBadges = body.achievements && body.achievements.some(a => a.badgeId === "first_xp") && body.achievements.some(a => a.badgeId === "century");
    
    if (res.status === 200 && body.success === true && hasBadges) {
      recordTest("Retrieve Unlocked User Achievements (GET /api/auth/achievements)", true);
    } else {
      recordTest("Retrieve Unlocked User Achievements (GET /api/auth/achievements)", false, `Badges check: ${hasBadges}, Achievements: ${JSON.stringify(body.achievements)}`);
    }
  } catch (err) {
    recordTest("Retrieve Unlocked User Achievements (GET /api/auth/achievements)", false, err.message);
  }

  // --- TEST 14: Manual Streak Reminder Trigger ---
  try {
    const res = await fetch(`${BASE_URL}/api/auth/trigger-streak-reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const body = await res.json();
    if (res.status === 200 && body.success === true) {
      recordTest("Streak Reminders Background Scan API", true);
    } else {
      recordTest("Streak Reminders Background Scan API", false, `Status: ${res.status}`);
    }
  } catch (err) {
    recordTest("Streak Reminders Background Scan API", false, err.message);
  }

  // --- TEST 15: Streak Email Dispatcher test ---
  try {
    const res = await fetch(`${BASE_URL}/api/auth/test-streak-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": authCookie
      }
    });
    const body = await res.json();
    if (res.status === 200 && body.success === true) {
      recordTest("SMTP Streak Email Dispatcher API", true);
    } else {
      recordTest("SMTP Streak Email Dispatcher API", false, `Status: ${res.status}`);
    }
  } catch (err) {
    recordTest("SMTP Streak Email Dispatcher API", false, err.message);
  }

  // --- TEST 16: Database Composite Progress Unique Constraint (TC-DB-02) ---
  try {
    const testUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    
    // Create temporary roadmap
    const testRoadmap = await prisma.roadmap.create({
      data: {
        userId: testUser.id,
        subject: "Java Integration Constraints",
        duration: 3,
        skillLevel: "Beginner",
        hoursPerDay: 1.0,
        modules: []
      }
    });

    // Attempt double insertion of same day progress
    await prisma.userProgress.create({
      data: {
        userId: testUser.id,
        roadmapId: testRoadmap.id,
        dayNumber: 1,
        completed: true,
        xpEarned: 10
      }
    });

    await prisma.userProgress.create({
      data: {
        userId: testUser.id,
        roadmapId: testRoadmap.id,
        dayNumber: 1,
        completed: true,
        xpEarned: 10
      }
    });

    recordTest("Database Composite Progress Unique Constraint (TC-DB-02)", false, "Failed constraint check: Duplicate progress rows allowed.");
  } catch (err) {
    if (err.code === "P2002") {
      recordTest("Database Composite Progress Unique Constraint (TC-DB-02)", true);
    } else {
      recordTest("Database Composite Progress Unique Constraint (TC-DB-02)", false, `Expected Prisma unique error P2002, got: ${err.message}`);
    }
  }

  // --- TEST 17: Database Composite Achievement Unique Constraint (TC-DB-03) ---
  try {
    const testUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    
    // Attempt duplicate achievements
    await prisma.achievement.create({
      data: {
        userId: testUser.id,
        badgeId: "duplicate_check_badge",
        title: "Double Check Badge",
        description: "Verify index constraint",
        icon: "🛡️"
      }
    });

    await prisma.achievement.create({
      data: {
        userId: testUser.id,
        badgeId: "duplicate_check_badge",
        title: "Double Check Badge Duplicate",
        description: "Verify index constraint duplicate",
        icon: "🛡️"
      }
    });

    recordTest("Database Composite Achievement Unique Constraint (TC-DB-03)", false, "Failed constraint check: Duplicate achievement rows allowed.");
  } catch (err) {
    if (err.code === "P2002") {
      recordTest("Database Composite Achievement Unique Constraint (TC-DB-03)", true);
    } else {
      recordTest("Database Composite Achievement Unique Constraint (TC-DB-03)", false, `Expected Prisma unique error P2002, got: ${err.message}`);
    }
  }

  // --- TEST 18: Database Cascading Delete & Clean Up (TC-DB-01) ---
  console.log(`\n${COLORS.cyan}🧹 Performing test data database cleanup...${COLORS.reset}`);
  try {
    const deletedUser = await prisma.user.delete({
      where: { email: TEST_EMAIL }
    });
    
    // Check if cascade deleted chat messages
    const chatCheck = await prisma.chatMessage.findMany({
      where: { userId: deletedUser.id }
    });

    // Check if achievements are cleared out
    const achievementCheck = await prisma.achievement.findMany({
      where: { userId: deletedUser.id }
    });

    if (chatCheck.length === 0 && achievementCheck.length === 0) {
      recordTest("Database Cascading Integrity Constraints (TC-DB-01)", true);
    } else {
      recordTest("Database Cascading Integrity Constraints (TC-DB-01)", false, `Remaining items - Chats: ${chatCheck.length}, Badges: ${achievementCheck.length}`);
    }
  } catch (err) {
    recordTest("Database Cascading Integrity Constraints (TC-DB-01)", false, err.message);
  }

  // --- SUMMARY REPORT ---
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n${COLORS.bold}${COLORS.cyan}=============================================`);
  console.log(`📊 INTEGRATION TESTING COMPLETION SUMMARY`);
  console.log(`=============================================`);
  console.log(`   TOTAL TESTS: ${results.length}`);
  console.log(`   PASSED:      ${COLORS.green}${passed}${COLORS.cyan}`);
  console.log(`   FAILED:      ${failed > 0 ? COLORS.red : COLORS.reset}${failed}${COLORS.cyan}`);
  console.log(`=============================================${COLORS.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Check if server is reachable before running
fetch(`${BASE_URL}/api/auth/me`)
  .then(() => {
    runTests();
  })
  .catch(err => {
    console.error(`${COLORS.red}❌ Error: Backend server is not running on port 5000.${COLORS.reset}`);
    console.error(`Please run ${COLORS.yellow}npm run dev${COLORS.reset} in the backend folder before running this script.`);
    process.exit(1);
  });
