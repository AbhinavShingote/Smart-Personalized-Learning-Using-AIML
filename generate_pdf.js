const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Initialize PDF Document
const doc = new PDFDocument({
  margin: 50,
  bufferPages: true, // Enables header/footer computation at the end
});

const outputPath = path.join(__dirname, 'Project_Documentation.pdf');
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// --- DESIGN SYSTEM CONSTANTS ---
const COLORS = {
  primary: '#0f172a',    // Deep slate navy
  secondary: '#1e293b',  // Slate gray
  accent: '#0284c7',     // Sky blue
  darkText: '#334155',   // Charcoal body text
  lightBg: '#f8fafc',    // Off-white card background
  border: '#e2e8f0',     // Light gray borders
  white: '#ffffff',
};

// --- HELPER FUNCTIONS ---
function drawHeader(title) {
  doc.save();
  doc.fontSize(8)
     .fillColor(COLORS.accent)
     .font('Helvetica-Bold')
     .text('SMART PERSONALIZED AI LEARNING PLATFORM', 50, 25, { align: 'left', width: 250 })
     .fillColor('#64748b')
     .font('Helvetica')
     .text(title.toUpperCase(), 300, 25, { align: 'right', width: 250 });
  
  doc.moveTo(50, 36)
     .lineTo(562, 36)
     .lineWidth(0.5)
     .strokeColor(COLORS.border)
     .stroke();
  doc.restore();
}

function drawFooter(pageNumber, totalPages) {
  doc.save();
  doc.moveTo(50, 750)
     .lineTo(562, 750)
     .lineWidth(0.5)
     .strokeColor(COLORS.border)
     .stroke();

  doc.fontSize(8)
     .fillColor('#64748b')
     .font('Helvetica')
     .text(`System Architecture & Documentation Report`, 50, 758, { align: 'left' })
     .text(`Page ${pageNumber} of ${totalPages}`, 500, 758, { align: 'right' });
  doc.restore();
}

// Layout helper helpers
function addTitle(title) {
  doc.fontSize(20)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(title);
  doc.moveDown(0.5);
}

function addHeading(heading) {
  doc.fontSize(14)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(heading);
  doc.moveDown(0.5);
}

function addSubHeading(subheading) {
  doc.fontSize(11)
     .fillColor(COLORS.accent)
     .font('Helvetica-Bold')
     .text(subheading);
  doc.moveDown(0.3);
}

function addParagraph(text) {
  doc.fontSize(10)
     .fillColor(COLORS.darkText)
     .font('Helvetica')
     .text(text, { align: 'justify', lineGap: 3 });
  doc.moveDown(0.8);
}

function addBullet(title, desc) {
  doc.fontSize(10)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(` •  ${title}: `, { continued: true })
     .fillColor(COLORS.darkText)
     .font('Helvetica')
     .text(desc, { lineGap: 2 });
  doc.moveDown(0.4);
}

function addCodeBlock(code) {
  const padding = 10;
  const startX = doc.x;
  const startY = doc.y;
  
  doc.save();
  doc.fontSize(8.5).font('Courier');
  const height = doc.heightOfString(code, { width: 500 });
  
  doc.rect(startX - 5, startY - 5, 512, height + 10)
     .fill(COLORS.lightBg);
  
  doc.rect(startX - 5, startY - 5, 512, height + 10)
     .lineWidth(0.5)
     .strokeColor(COLORS.border)
     .stroke();
  
  doc.fillColor('#0f172a')
     .text(code, startX, startY, { width: 500 });
     
  doc.restore();
  doc.y = startY + height + 15;
}

// ==========================================
// PAGE 1: COVER PAGE
// ==========================================
doc.rect(0, 0, 612, 792).fill(COLORS.primary);
doc.rect(0, 750, 612, 42).fill(COLORS.accent);
doc.circle(550, 80, 100).fill(COLORS.secondary);
doc.circle(50, 700, 150).fill(COLORS.secondary);

doc.fillColor(COLORS.white)
   .font('Helvetica-Bold')
   .fontSize(28)
   .text('SMART PERSONALIZED AI\nLEARNING PLATFORM', 60, 200, { lineGap: 8 });

doc.fillColor(COLORS.accent)
   .font('Helvetica')
   .fontSize(14)
   .text('Full System Architecture & Technical Documentation Blueprint', 60, 280);

doc.moveTo(60, 310)
   .lineTo(350, 310)
   .lineWidth(2)
   .strokeColor(COLORS.accent)
   .stroke();

doc.fillColor('#94a3b8')
   .fontSize(10)
   .font('Helvetica-Bold')
   .text('PREPARED FOR:', 60, 440)
   .fillColor(COLORS.white)
   .font('Helvetica')
   .text('Abhinav Shingote', 60, 455)
   .moveDown(1.2);

doc.fillColor('#94a3b8')
   .font('Helvetica-Bold')
   .text('TECHNICAL SCOPE:', 60, 490)
   .fillColor(COLORS.white)
   .font('Helvetica')
   .text('Authentication & Google OAuth 2.0 Login Flow,\nNodemailer SMTP Transporter & Password Recovery,\nYouTube API v3 video matching, multi-key Gemini rotation,\nStreak cron-scheduler checks, PostgreSQL data schemas.', 60, 505)
   .moveDown(1.2);

doc.fillColor('#94a3b8')
   .font('Helvetica-Bold')
   .text('PLATFORM STACK & SECURITY:', 60, 580)
   .fillColor(COLORS.white)
   .font('Helvetica')
   .text('React 18, Express, Prisma ORM, PostgreSQL,\nBcryptjs (12 rounds) credentials hashing,\nNode-cron, Google Accounts, YouTube v3 Data APIs.', 60, 595);

// ==========================================
// PAGE 2: TABLE OF CONTENTS & PROBLEM STATEMENT
// ==========================================
doc.addPage();
addTitle('Table of Contents');

const tocItems = [
  { s: '1', title: 'Problem Statement & Solutions', page: 2 },
  { s: '2', title: 'System Architecture & Tech Stack', page: 3 },
  { s: '3', title: 'Core Features & Integration Mechanisms', page: 4 },
  { s: '4', title: 'YouTube API v3 & Gemini Key Rotation Details', page: 5 },
  { s: '5', title: 'End-to-End OAuth, SMTP & Password Encryption Flow', page: 6 },
  { s: '6', title: 'Database Schema & Table Schematics (Part 1)', page: 7 },
  { s: '7', title: 'Database Schema & Table Schematics (Part 2)', page: 8 },
];

tocItems.forEach(item => {
  doc.fontSize(10)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(`${item.s}. ${item.title}`, 60, doc.y, { continued: true })
     .fillColor('#94a3b8')
     .text(' ' + '.'.repeat(70 - item.title.length * 1.2) + ' ', { continued: true })
     .fillColor(COLORS.accent)
     .text(item.page.toString(), { align: 'right' });
  doc.moveDown(0.6);
});

doc.moveDown(1.5);
doc.moveTo(50, doc.y).lineTo(562, doc.y).lineWidth(0.5).strokeColor(COLORS.border).stroke();
doc.moveDown(1.5);

addHeading('1. Problem Statement & Solution');
addSubHeading('THE PROBLEM');
addParagraph(
  'Traditional digital education platforms rely on uniform, static syllabus configurations. They fail to adapt to a user\'s immediate background knowledge level, learning speed, and time constraints. In addition, integration of Large Language Model (LLM) APIs into student-facing apps presents severe challenges:'
);
addBullet('API Rate Limiting (429)', 'Free tier endpoints quickly hit limits under load. If not handled, this freezes loading animations and locks the client app.');
addBullet('Lack of Session History', 'Standard LLM chat sessions lose tutor context upon page reload, forcing users to repeatedly restate the topic and their goals.');
addBullet('Retention Churn', 'A lack of progress representation (such as streaks, badges, or ranks) leads to drop-offs in student learning consistency.');

doc.moveDown(0.5);
addSubHeading('THE SOLUTION');
addParagraph(
  'We have engineered a highly personal, stateful learning dashboard with: (1) stateful JSON roadmaps; (2) Postgres DB-backed chat messaging history; (3) context-aware cheat sheets; and (4) a gamified streak/achievement layer. To ensure high availability, a custom LLM scheduler automatically manages multi-key rotation and initiates fast context-aware fallbacks in milliseconds.'
);

// ==========================================
// PAGE 3: TECH STACK & SYSTEM ARCHITECTURE
// ==========================================
doc.addPage();
addHeading('2. System Architecture & Tech Stack');
addParagraph(
  'The platform is built on an end-to-end decoupled client-server architecture. React manages state, router guards, and interactive graphics, while the Express API interacts with a PostgreSQL database via Prisma ORM. Key components include:'
);

addSubHeading('FRONTEND ARCHITECTURE (SPA)');
addBullet('Core Framework', 'React v18.2.0 for component isolation, local state management, and lifecycle hooks.');
addBullet('Routing & Views', 'React Router DOM v6.3.0 for client-side routing, protected dashboards, and redirect flows.');
addBullet('Visual Polish & Graphs', 'Framer Motion v7.2.1 for premium micro-animations; Chart.js and React-Chartjs-2 for user statistics.');
addBullet('Styling Design System', 'TailwindCSS v3.1.8 with a deep slate/glassmorphism design pattern.');

doc.moveDown(0.3);
addSubHeading('BACKEND API & DATA');
addBullet('Server Core', 'Express.js v4.19.2 handles routing, request validation, cookie management, and JWT extraction.');
addBullet('Database Engine', 'PostgreSQL hosted database representing users, active roadmaps, completed nodes, and achievements.');
addBullet('ORM Interface', 'Prisma client v5.14.0 for connection pooling, type-safe migrations, and cascading deletions.');

doc.moveDown(0.3);
addSubHeading('AI INTEGRATIONS, YOUTUBE & EMAILS');
addBullet('LangChain Core', '@langchain/core (v1.1.48) and @langchain/google-genai (v2.1.31) for LLM prompts and message wrappers.');
addBullet('API Models', 'Primary Model: gemini-2.5-flash / gemini-1.5-flash. Configured with temperature=0.7 and zero retries for instant rotation.');
addBullet('YouTube API v3', 'Utilizes googleapis endpoints to dynamically match search parameters for video tutorials based on topics.');
addBullet('Nodemailer SMTP', 'Transporter client configured with secure ports for SMTP servers to trigger password resets and daily streaks reminders.');

// ==========================================
// PAGE 4: CORE FEATURES & INTEGRATIONS
// ==========================================
doc.addPage();
addHeading('3. Core Features & Integration Mechanisms');

addSubHeading('FEATURE 1: STATEFUL AI ROADMAP GENERATOR');
addParagraph(
  'Users enter a subject, skill level, and hours/day availability. The backend prompts Gemini to return a structured JSON syllabus. The JSON is persisted in the database. Client renders daily breakdowns, topic lists, progress checkboxes, and tracks the user\'s completion percentage in real time.'
);

addSubHeading('FEATURE 2: PERSISTENT CHATBOT TUTOR');
addParagraph(
  'A sidebar chatbot parses current user queries. Unlike stateless designs, messages are stored in PostgreSQL using the ChatMessage model linked to the user\'s profile. Upon mounting, the client loads past transcripts via GET /api/chat. The prompt injects context about the active roadmap subject to personalize the chat response.'
);

addSubHeading('FEATURE 3: YOUTUBE API V3 COMPONENT MATCHING');
addParagraph(
  'To support visual learners, each roadmap topic calls the YouTube Search service. The client initiates GET queries to the YouTube API, matches title queries, pulls thumbnail URLs and embed credentials, and compiles a video panel with relevant playlists for immediate playback directly within the application.'
);

addSubHeading('FEATURE 4: EMAIL SCHEDULER & STREAK RETENTION');
addParagraph(
  'The app runs an automated database scanner built on node-cron. The cron system tracks each user\'s lastActiveAt parameter. If the user\'s activity threshold indicates their streak will reset in less than 2 hours (22-23 hours since last activity), the system connects to SMTP and sends an automated warning email encouraging user login.'
);

addSubHeading('FEATURE 5: GAMIFICATION ENGINE & LEADERBOARDS');
addParagraph(
  'Completing quizzes awards Experience Points (XP). Level-ups are calculated: Level = floor(XP / 500) + 1. Streaks increment if active on successive days, and reset to 1 if a day is missed. Achievements are automatically unlocked and stored. A global leaderboard fetches all registered users sorted by total XP.'
);

// ==========================================
// PAGE 5: YT API V3 & GEMINI KEY ROTATION DETAILS
// ==========================================
doc.addPage();
addHeading('4. YouTube API v3 & Gemini Rotation Details');

addSubHeading('YOUTUBE API V3 INTEGRATION SPECIFICATIONS');
addParagraph(
  'For matching video materials, the application queries Google\'s YouTube v3 Data API. The key is managed via environmental variable: REACT_APP_YOUTUBE_API_KEY. It communicates with two main API endpoints:'
);
addBullet('Search Endpoint', 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q={searchQuery}&maxResults=3&key={apiKey}');
addBullet('Videos Endpoint', 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id={videoIds}&key={apiKey}');
addParagraph(
  'Search queries are structured as: `Learn [Topic] in [Subject] Course Tutorial`. The API returns a video JSON response mapping videoId, title, snippet, and high-res thumbnails (e.g. img.youtube.com/vi/{id}/maxresdefault.jpg). A fallback mechanism displays offline mock video sets if the YouTube API key is missing or blocked.'
);

addSubHeading('GEMINI MULTI-KEY ROTATION MECHANISM');
addParagraph(
  'The backend utilises geminiHelper.js to cycle keys when rate limits (HTTP 429) occur. Key settings are specified under GEMINI_API_KEY_1 to GEMINI_API_KEY_5. Setting maxRetries to 0 bypasses LangChain\'s exponential backoffs, allowing the system to catch exceptions and switch keys immediately.'
);

addSubHeading('GEMINI HELPER CODE SNAPSHOT');
addCodeBlock(`// backend/utils/geminiHelper.js
async function executeWithKeyRotation(fn) {
  const keys = getGeminiKeys(); // Loads env GEMINI_API_KEY_1..5
  let lastError = null;

  for (let i = 0; i < keys.length; i++) {
    try {
      return await fn(keys[i]); // Run using active key
    } catch (err) {
      lastError = err;
      if (i < keys.length - 1) {
        console.warn(\`⚠️ Key #\${i + 1} failed. Rotating to Key #\${i + 2}...\`);
        continue;
      }
      throw err; // Out of keys
    }
  }
}`);

// ==========================================
// PAGE 6: OAUTH, SMTP, AND ENCRYPTION FLOW
// ==========================================
doc.addPage();
addHeading('5. End-to-End OAuth, SMTP & Encryption Flow');

addSubHeading('GOOGLE OAUTH 2.0 REGISTRATION & LOGIN FLOW');
addParagraph(
  'The platform supports Google OAuth for authentication, implemented as follows:'
);
addBullet('Redirection', 'GET /api/auth/google redirects client browser to https://accounts.google.com/o/oauth2/v2/auth with scope userinfo.profile, userinfo.email, client_id, and redirect_uri.');
addBullet('OAuth Callback', 'GET /api/auth/google/callback receives authorization code, sends a POST to https://oauth2.googleapis.com/token to trade for access_token, and requests profile info from https://www.googleapis.com/oauth2/v2/userinfo.');
addBullet('User Creation/Binding', 'Checks if user email exists. If not, it creates a new account with a random password hashed using bcryptjs. signs a session JWT cookie, and redirects user to dashboard.');

addSubHeading('CREDENTIAL SECURITY & BCRYPTJS ENCRYPTION');
addParagraph(
  'For local accounts, passwords are encrypted on register and validated on login. The project uses bcryptjs with a salt round factor of 12 (BCRYPT_SALT_ROUNDS=12) for secure password hashing. It compares hashes on login using:'
);
addCodeBlock(`// Hashing on Register / User creation
const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
const passwordHash = await bcrypt.hash(password, saltRounds);

// Comparison on Login
const isMatch = await bcrypt.compare(password, user.passwordHash);`);

addSubHeading('SMTP EMAIL SENDER & PASSWORD RECOVERY');
addParagraph(
  'Emails are dispatched using Nodemailer and a configured SMTP server (e.g. Host: smtp.gmail.com, Port: 587/465, Secure: SSL/TLS). For password recovery:'
);
addBullet('Token Generation', 'User POSTs /forgot-password. Server creates a JWT signed with user-specific secret (JWT_SECRET + user.passwordHash) expiring in 15 mins.');
addBullet('Recovery Link', 'Sends email containing /reset-password/[token] link. The user-specific signature prevents token reuse if the password has already been changed.');

// ==========================================
// PAGE 7: DATABASE SCHEMA & DATA TABLES (PART 1)
// ==========================================
doc.addPage();
addHeading('6. Database Schema & Prisma Data Models');
addParagraph(
  'The application schema is modeled in PostgreSQL using Prisma ORM. Primary keys are CUID strings generated on creation. Foreign keys enforce Cascade deletions to maintain database integrity.'
);

addSubHeading('TABLE 1: users');
addBullet('Primary Key (PK)', 'id : String [CUID]')
addBullet('Columns', 'email (String, Unique, Indexed)\npasswordHash (String - Bcrypt 12 rounds)\nname (String)\nlevel (Int, Default: 1)\ntotalXP (Int, Default: 0)\ncurrentStreak (Int, Default: 0)\nlongestStreak (Int, Default: 0)\nlastActiveAt (DateTime, Nullable)\ncreatedAt (DateTime, Default: now())\nupdatedAt (DateTime, Auto-update)')
addBullet('Relations', 'roadmaps (Roadmap[]), progress (UserProgress[]), chatMessages (ChatMessage[]), achievements (Achievement[])')

doc.moveDown(0.3);
addSubHeading('TABLE 2: roadmaps');
addBullet('Primary Key (PK)', 'id : String [CUID]')
addBullet('Foreign Key (FK)', 'userId : String (References users.id, onDelete: Cascade)')
addBullet('Columns', 'subject (String)\nduration (Int - Total study days)\nskillLevel (String - beginner / intermediate / advanced)\nhoursPerDay (Float)\nmodules (Json - AI day-by-day roadmap objects)\nisActive (Boolean, Default: true)\ncreatedAt (DateTime, Default: now())\nupdatedAt (DateTime)')
addBullet('Relations', 'user (User), progress (UserProgress[])')

doc.moveDown(0.3);
addSubHeading('TABLE 3: user_progress');
addBullet('Primary Key (PK)', 'id : String [CUID]')
addBullet('Foreign Key (FK)', 'userId : String (References users.id, onDelete: Cascade)\nroadmapId : String (References roadmaps.id, onDelete: Cascade)')
addBullet('Columns', 'dayNumber (Int)\ncompleted (Boolean, Default: false)\nquizScore (Int, Nullable - Best attempt score)\nxpEarned (Int, Default: 0)\ncompletedAt (DateTime, Nullable)\ncreatedAt (DateTime, Default: now())')
addBullet('Constraints', 'Unique composite index: [userId, roadmapId, dayNumber] - prevents duplicate progress entries per day/roadmap for a user.')

// ==========================================
// PAGE 8: DATABASE SCHEMA (PART 2) & SCHEDULER
// ==========================================
doc.addPage();
addHeading('7. Database Schema & Scheduler (Part 2)');

addSubHeading('TABLE 4: chat_messages');
addBullet('Primary Key (PK)', 'id : String [CUID]')
addBullet('Foreign Key (FK)', 'userId : String (References users.id, onDelete: Cascade)')
addBullet('Columns', 'sender (String - "user" | "bot")\ntext (String - chat text contents)\ntimestamp (DateTime, Default: now())')
addBullet('Relations', 'user (User)')

doc.moveDown(0.3);
addSubHeading('TABLE 5: achievements');
addBullet('Primary Key (PK)', 'id : String [CUID]')
addBullet('Foreign Key (FK)', 'userId : String (References users.id, onDelete: Cascade)')
addBullet('Columns', 'badgeId (String - trigger keyword: first_quiz, level_5, etc.)\ntitle (String - badge display name)\ndescription (String - badge unlock instructions)\nicon (String - Emoji representation)\nunlockedAt (DateTime, Default: now())')
addBullet('Constraints', 'Unique composite index: [userId, badgeId] - guarantees a user can only unlock each badge once.')

doc.moveDown(0.3);
addSubHeading('HOURLY STREAK SCANNER CRON SCHEMA');
addParagraph(
  'A background worker in services/scheduler.js checks user activity patterns hourly (cron: 0 * * * *). It queries users at risk of losing active streaks:'
);
addCodeBlock(`// Cron hourly streak validation (services/scheduler.js)
const minDate = new Date(now.getTime() - 23 * 60 * 60 * 1000); // 23h ago
const maxDate = new Date(now.getTime() - 22 * 60 * 60 * 1000); // 22h ago

const usersAtRisk = await prisma.user.findMany({
  where: {
    currentStreak: { gt: 0 },
    lastActiveAt: {
      gte: minDate,
      lte: maxDate,
    },
  },
});`);

addSubHeading('CONCLUSION & EXPORT SUCCESS');
addParagraph(
  'The platform represents a robust, highly-available solution. Using multi-key key rotation, SMTP triggers, and Google/YouTube APIs, it delivers a secure learning environment. The database maintains schema validation with composite indices, type-safe queries, and relational integrity.'
);

// ==========================================
// FINALIZING AND METADATA PAGINATION WRITING
// ==========================================
const totalPages = doc.bufferedPageRange().count;

for (let i = 1; i < totalPages; i++) {
  doc.switchToPage(i);
  
  let pageTitle = '';
  switch (i) {
    case 1: pageTitle = 'Table of Contents & Problem Statement'; break;
    case 2: pageTitle = 'Tech Stack & Architecture'; break;
    case 3: pageTitle = 'Core Features'; break;
    case 4: pageTitle = 'YouTube API v3 & Gemini Rotation'; break;
    case 5: pageTitle = 'OAuth, SMTP & Encryption Flow'; break;
    case 6: pageTitle = 'Database Schema Specification (Part 1)'; break;
    case 7: pageTitle = 'Database Schema Specification (Part 2)'; break;
    default: pageTitle = 'Documentation';
  }
  
  drawHeader(pageTitle);
  drawFooter(i + 1, totalPages);
}

// End & save the file
doc.end();

console.log('✅ Documentation PDF has been successfully updated with OAuth, SMTP, YouTube API v3, and database schema mappings!');
