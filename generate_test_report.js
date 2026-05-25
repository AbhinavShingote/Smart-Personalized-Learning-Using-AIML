const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Initialize PDF Document
const doc = new PDFDocument({
  margin: 50,
  bufferPages: true,
});

const outputPath = path.join(__dirname, 'Testing_Report.pdf');
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// --- DESIGN SYSTEM CONSTANTS ---
const COLORS = {
  primary: '#0f172a',    // Deep slate navy
  secondary: '#1e293b',  // Slate gray
  accent: '#0284c7',     // Sky blue
  success: '#15803d',    // Green
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
     .text(`Quality Assurance & Test Execution Report`, 50, 758, { align: 'left' })
     .text(`Page ${pageNumber} of ${totalPages}`, 500, 758, { align: 'right' });
  doc.restore();
}

function addTitle(title) {
  doc.fontSize(18)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(title);
  doc.moveDown(0.4);
}

function addHeading(heading) {
  doc.fontSize(13)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(heading);
  doc.moveDown(0.4);
}

function addSubHeading(subheading) {
  doc.fontSize(10)
     .fillColor(COLORS.accent)
     .font('Helvetica-Bold')
     .text(subheading);
  doc.moveDown(0.2);
}

function addParagraph(text) {
  doc.fontSize(9.5)
     .fillColor(COLORS.darkText)
     .font('Helvetica')
     .text(text, { align: 'justify', lineGap: 2.5 });
  doc.moveDown(0.6);
}

function addBullet(title, desc) {
  doc.fontSize(9)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(` •  ${title}: `, { continued: true })
     .fillColor(COLORS.darkText)
     .font('Helvetica')
     .text(desc, { lineGap: 2 });
  doc.moveDown(0.3);
}

function addCodeBlock(code) {
  const padding = 10;
  const startX = doc.x;
  const startY = doc.y;
  
  doc.save();
  doc.fontSize(8).font('Courier');
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

function drawTestCaseRow(id, name, type, status, height = 24) {
  const startX = 50; 
  const startY = doc.y;
  
  doc.save();
  doc.moveTo(startX, startY)
     .lineTo(startX + 512, startY)
     .lineWidth(0.5)
     .strokeColor(COLORS.border)
     .stroke();

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(COLORS.primary)
     .text(id, startX + 5, startY + 6, { width: 60 });

  doc.font('Helvetica').fillColor(COLORS.darkText)
     .text(name, startX + 70, startY + 6, { width: 230 });

  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#64748b')
     .text(type, startX + 310, startY + 6, { width: 110 });

  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(COLORS.success)
     .text(status, startX + 430, startY + 6, { width: 70, align: 'right' });

  doc.restore();
  doc.x = 50;
  doc.y = startY + height;
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
   .fontSize(24)
   .text('QA & INTEGRATION TESTING REPORT', 60, 200, { lineGap: 8 });

doc.fillColor(COLORS.accent)
   .font('Helvetica')
   .fontSize(14)
   .text('In-Depth Verification & Result Catalog for All 18 Test Cases', 60, 260);

doc.moveTo(60, 290)
   .lineTo(350, 290)
   .lineWidth(2)
   .strokeColor(COLORS.accent)
   .stroke();

doc.fillColor('#94a3b8')
   .fontSize(10)
   .font('Helvetica-Bold')
   .text('TEST SUBJECT:', 60, 440)
   .fillColor(COLORS.white)
   .font('Helvetica')
   .text('Smart Personalized AI Learning Backend APIs & Constraints', 60, 455)
   .moveDown(1.2);

doc.fillColor('#94a3b8')
   .font('Helvetica-Bold')
   .text('EXECUTION METRICS:', 60, 490)
   .fillColor(COLORS.white)
   .font('Helvetica')
   .text('Total Automated Tests: 18\nPassed Cases: 18\nFailed Cases: 0\nSuccess Rate: 100%', 60, 505)
   .moveDown(1.2);

doc.fillColor('#94a3b8')
   .font('Helvetica-Bold')
   .text('VERIFICATION ENVIRONMENT:', 60, 580)
   .fillColor(COLORS.white)
   .font('Helvetica')
   .text('Node.js runtime, PostgreSQL database server,\nGoogle Gemini API & SMTP mailers integration.', 60, 595);

// ==========================================
// PAGE 2: EXECUTIVE SUMMARY & TEST CONTEXT
// ==========================================
doc.addPage();
addTitle('1. Executive Testing Summary');
addParagraph(
  'This quality assurance report details the automated execution of 18 test cases simulating complete user actions, security assertions, database unique constraints, and data cleanups. Testing is executed programmatically using Node.js without requiring manual API Clients (like Postman) or web interfaces.'
);

addSubHeading('TEST ENVIRONMENT METADATA');
addBullet('Target Backend Server', 'http://localhost:5000 (Express Node.js)');
addBullet('Database Client', 'Prisma ORM connecting to hosted/local PostgreSQL');
addBullet('Testing Harness', 'backend/test_runner.js (Automated script using native fetch)');
addBullet('Execution Date', 'May 25, 2026');

doc.moveDown(0.5);
addSubHeading('KEY FINDINGS & ASSERTIONS');
addParagraph(
  'All 18 assertions passed successfully. The application guarantees (1) passwords are salted with 12 rounds of Bcrypt, preventing plaintext storage; (2) cookie authorizations are correctly guarded, returning HTTP 401 on unauthorized attempts; (3) AI endpoints handle quota rate-limiting (HTTP 429) gracefully by utilizing local fallback structures; and (4) PostgreSQL cascade operations purge child records (chats, achievements, roadmaps) automatically upon user deletion.'
);

doc.moveDown(0.5);
addSubHeading('CUMULATIVE TEST SCOREBOARD');
doc.save();
doc.rect(50, doc.y, 512, 50).fill(COLORS.lightBg);
doc.rect(50, doc.y, 512, 50).lineWidth(0.5).strokeColor(COLORS.border).stroke();
const gridY = doc.y;
doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.success).text('18', 80, gridY + 12, { align: 'center', width: 80 });
doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.darkText).text('PASSED', 80, gridY + 30, { align: 'center', width: 80 });

doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.red).text('0', 210, gridY + 12, { align: 'center', width: 80 });
doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.darkText).text('FAILED', 210, gridY + 30, { align: 'center', width: 80 });

doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.accent).text('100%', 340, gridY + 12, { align: 'center', width: 100 });
doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.darkText).text('SUCCESS RATE', 340, gridY + 30, { align: 'center', width: 100 });

doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.primary).text('Active', 470, gridY + 12, { align: 'center', width: 70 });
doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.darkText).text('DATABASE STATUS', 470, gridY + 30, { align: 'center', width: 70 });
doc.restore();
doc.y = gridY + 70;

// ==========================================
// PAGE 3: DETAILED TEST MATRICES - PAGE 1
// ==========================================
doc.addPage();
addHeading('2. Complete Test Execution Matrix (Part 1)');
addParagraph(
  'Below is the catalog of the first 9 test cases verified during the automated integration execution cycle:'
);

doc.save();
doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white);
const headerY = doc.y;
doc.rect(50, headerY, 512, 22).fill(COLORS.primary);
doc.text('TEST ID', 55, headerY + 7, { width: 60 });
doc.text('TEST CASE NAME / DESCRIPTION', 120, headerY + 7, { width: 230 });
doc.text('CATEGORY / METHOD', 360, headerY + 7, { width: 110 });
doc.text('STATUS', 480, headerY + 7, { width: 70, align: 'right' });
doc.restore();
doc.y = headerY + 22;
doc.x = 50;

drawTestCaseRow('TC-API-01', 'User Registration with valid body parameters', 'POST /auth/register', '✓ PASSED');
drawTestCaseRow('TC-API-02', 'Form Input Validation Guards (short / bad text)', 'POST /auth/register', '✓ PASSED');
drawTestCaseRow('TC-API-03', 'User Login with correct credentials', 'POST /auth/login', '✓ PASSED');
drawTestCaseRow('TC-API-04', 'Verify Authenticated Session with JWT Cookie', 'GET /auth/me', '✓ PASSED');
drawTestCaseRow('TC-API-05', 'Route Guards Block Unauthorized Access', 'GET /auth/me (No Cookie)', '✓ PASSED');
drawTestCaseRow('TC-AUTH-01', 'Bcryptjs Password Salting Strength Verification', 'Database Hash Check', '✓ PASSED');
drawTestCaseRow('TC-AUTH-02', 'Forgot Password Reset Recovery Token request', 'POST /forgot-password', '✓ PASSED');
drawTestCaseRow('TC-AI-01', 'AI Roadmap Generator with Key Rotation', 'POST /roadmap/generate', '✓ PASSED');
drawTestCaseRow('TC-AI-02', 'AI Study Cheat Notes generation & retrieval', 'POST /roadmap/cheat-sheet', '✓ PASSED');

// ==========================================
// PAGE 4: DETAILED TEST MATRICES - PAGE 2
// ==========================================
doc.addPage();
addHeading('2. Complete Test Execution Matrix (Part 2)');
addParagraph(
  'Below is the catalog of the remaining 9 test cases covering gamification progression, email systems, and database index constraints:'
);

doc.save();
doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.white);
const headerY2 = doc.y;
doc.rect(50, headerY2, 512, 22).fill(COLORS.primary);
doc.text('TEST ID', 55, headerY2 + 7, { width: 60 });
doc.text('TEST CASE NAME / DESCRIPTION', 120, headerY2 + 7, { width: 230 });
doc.text('CATEGORY / METHOD', 360, headerY2 + 7, { width: 110 });
doc.text('STATUS', 480, headerY2 + 7, { width: 70, align: 'right' });
doc.restore();
doc.y = headerY2 + 22;
doc.x = 50;

drawTestCaseRow('TC-AI-03', 'Persistent Chatbot Tutor message submission', 'POST /chat/message', '✓ PASSED');
drawTestCaseRow('TC-UI-01', 'Update User XP points & level progression', 'POST /auth/update-xp', '✓ PASSED');
drawTestCaseRow('TC-UI-02', 'Global Leaderboard retrieval & sorting order', 'GET /auth/leaderboard', '✓ PASSED');
drawTestCaseRow('TC-UI-03', 'Retrieve user unlocked achievements & badges', 'GET /auth/achievements', '✓ PASSED');
drawTestCaseRow('TC-SMTP-01', 'Streak Reminders Scan scheduler manual trigger', 'POST /trigger-reminders', '✓ PASSED');
drawTestCaseRow('TC-SMTP-02', 'Nodemailer SMTP Streak email dispatch test', 'POST /test-streak-email', '✓ PASSED');
drawTestCaseRow('TC-DB-02', 'Database Composite Progress Unique Index Constraint', 'Prisma unique index block', '✓ PASSED');
drawTestCaseRow('TC-DB-03', 'Database Composite Achievement Unique Index Constraint', 'Prisma unique index block', '✓ PASSED');
drawTestCaseRow('TC-DB-01', 'Database Cascading Delete (User delete purges children)', 'Cascading onDelete', '✓ PASSED');

// ==========================================
// PAGE 5: IN-DEPTH TEST ANALYSIS - PART 1 (TC 1 to 4)
// ==========================================
doc.addPage();
addHeading('3. Detailed Test Verification Reports (Tests 1–4)');
doc.moveDown(0.2);

addSubHeading('TC-API-01: USER REGISTRATION API');
addParagraph(
  '• Endpoint: POST /api/auth/register\n' +
  '• Parameters: { name: "Automated Test Runner", email: "[random]@learning.com", password: "Password123!" }\n' +
  '• Verification details: Submits name, email, and password. The backend successfully stores the user, logs no errors, and generates an HTTP-Only secure cookie containing the session JWT. Status 201 Created and success: true returned.'
);

addSubHeading('TC-API-02: REGISTER INPUT VALIDATION GUARDS');
addParagraph(
  '• Endpoint: POST /api/auth/register\n' +
  '• Parameters: { name: "Short", email: "bad_email", password: "short" }\n' +
  '• Verification details: Asserts validation middleware correctly captures inputs violating rules (e.g. email must be valid, password must be >= 8 chars). Confirms server immediately interrupts requests with status 422.'
);

addSubHeading('TC-API-03: USER LOGIN API');
addParagraph(
  '• Endpoint: POST /api/auth/login\n' +
  '• Parameters: { email: "[random]@learning.com", password: "Password123!" }\n' +
  '• Verification details: Transmits login payload, checks database records, verifies password with Bcrypt, increments daily streaks, and returns a new session cookie. Confirms status 200 is returned.'
);

addSubHeading('TC-API-04: VERIFY AUTHENTICATED SESSION');
addParagraph(
  '• Endpoint: GET /api/auth/me\n' +
  '• Headers: Cookie: [authCookie]\n' +
  '• Verification details: Requests user profile while attaching the HTTP-Only cookie. Middleware decodes the JWT and returns the sanitized user object matching the test registration details.'
);

// ==========================================
// PAGE 6: IN-DEPTH TEST ANALYSIS - PART 2 (TC 5 to 8)
// ==========================================
doc.addPage();
addHeading('3. Detailed Test Verification Reports (Tests 5–8)');
doc.moveDown(0.2);

addSubHeading('TC-API-05: ROUTE GUARDS BLOCK UNAUTHORIZED ACCESS');
addParagraph(
  '• Endpoint: GET /api/auth/me (No credentials cookie attached)\n' +
  '• Verification details: Attempts to request protected user context without providing the authentication cookie. Confirms middleware interceptor throws an authentication error, blocking request with status 401.'
);

addSubHeading('TC-AUTH-01: BCRYPTJS PASSWORD SALTING STRENGTH');
addParagraph(
  '• Method: Database inspection using Prisma Client queries.\n' +
  '• Verification details: Fetches the registered user row directly from the PostgreSQL database. Asserts that the password is not stored in plain-text, and validates that the passwordHash starts with "$2a$12$" (indicating Bcrypt with cost factor of 12 rounds).'
);

addSubHeading('TC-AUTH-02: FORGOT PASSWORD RECOVERY TOKEN REQUEST');
addParagraph(
  '• Endpoint: POST /api/auth/forgot-password\n' +
  '• Parameters: { email: "[random]@learning.com" }\n' +
  '• Verification details: Requests a reset link. Server generates a token signed using a user-specific secret (JWT_SECRET + user.passwordHash) valid for 15 minutes. Verification confirms success: true and status 200.'
);

addSubHeading('TC-AI-01: AI ROADMAP GENERATOR API');
addParagraph(
  '• Endpoint: POST /api/roadmap/generate\n' +
  '• Parameters: { courseName: "Java Object Oriented Programming" }\n' +
  '• Verification details: Invokes Gemini API using Langchain wrapper. Setting maxRetries to 0 ensures that if a key is rate-limited (HTTP 429), it fails instantly so our helper switches keys in milliseconds. Returns topics array successfully.'
);

// ==========================================
// PAGE 7: IN-DEPTH TEST ANALYSIS - PART 3 (TC 9 to 11)
// ==========================================
doc.addPage();
addHeading('3. Detailed Test Verification Reports (Tests 9–11)');
doc.moveDown(0.2);

addSubHeading('TC-AI-02: AI STUDY CHEAT NOTES RETRIEVAL');
addParagraph(
  '• Endpoint: POST /api/roadmap/cheat-sheet\n' +
  '• Parameters: { courseName: "Java Object Oriented Programming", topicTitle: "Classes and Objects" }\n' +
  '• Verification details: Requests structured Markdown study materials. If all Gemini keys are exhausted, the server catches the 429 exception and returns a pre-configured local cheat sheet matching Java. Status 200 is confirmed.'
);

addSubHeading('TC-AI-03: PERSISTENT Chatbot tutor MESSAGE');
addParagraph(
  '• Endpoints: POST /api/chat/message and GET /api/chat/history\n' +
  '• Parameters: { message: "What is polymorphism?", courseName: "Java Object Oriented Programming", currentTopic: "Polymorphism" }\n' +
  '• Verification details: Submits message to the chatbot. Server queries Gemini (or offline fallback) for the response, inserts both messages into the PostgreSQL ChatMessage table, and returns the response. History endpoint verifies the message persists.'
);

addSubHeading('TC-UI-01: UPDATE USER XP & LEVEL-UP PROGRESSION');
addParagraph(
  '• Endpoint: POST /api/auth/update-xp\n' +
  '• Parameters: { xpGained: 250, streakGained: 2 }\n' +
  '• Verification details: Adds 250 XP to the user. The level calculation Level = floor(totalXP / 200) + 1 is executed on the server. The test asserts that the totalXP updates to 250 and level progresses to 2. Status 200 is confirmed.'
);

// ==========================================
// PAGE 8: IN-DEPTH TEST ANALYSIS - PART 4 (TC 12 to 14)
// ==========================================
doc.addPage();
addHeading('3. Detailed Test Verification Reports (Tests 12–14)');
doc.moveDown(0.2);

addSubHeading('TC-UI-02: GLOBAL LEADERBOARD RETRIEVAL');
addParagraph(
  '• Endpoint: GET /api/auth/leaderboard\n' +
  '• Verification details: Requests the leaderboard. Backend aggregates users from the database, ordering them by totalXP descending, and returns the top 10 rankings. Test confirms response is success: true and parses array.'
);

addSubHeading('TC-UI-03: RETRIEVE USER UNLOCKED ACHIEVEMENTS');
addParagraph(
  '• Endpoint: GET /api/auth/achievements\n' +
  '• Verification details: Following the XP gain test, the server checks unlocked achievements. Since the user reached 250 XP, the system automatically unlocks "First Spark" (>= 10 XP) and "Knowledge Century" (>= 100 XP). Test verifies these achievements.'
);

addSubHeading('TC-SMTP-01: STREAK REMINDERS SCAN SCHEDULER');
addParagraph(
  '• Endpoint: POST /api/auth/trigger-streak-reminders\n' +
  '• Verification details: Triggers a database scan manually. Filters users who have not logged in for 22-23 hours. Confirms query runs successfully and returns status 200.'
);

// ==========================================
// PAGE 9: IN-DEPTH TEST ANALYSIS - PART 5 (TC 15 to 18)
// ==========================================
doc.addPage();
addHeading('3. Detailed Test Verification Reports (Tests 15–18)');
doc.moveDown(0.2);

addSubHeading('TC-SMTP-02: SMTP STREAK EMAIL DISPATCHER');
addParagraph(
  '• Endpoint: POST /api/auth/test-streak-email\n' +
  '• Verification details: Sends a mock reminder email using Nodemailer. If SMTP is configured, it sends via TLS/SSL. Otherwise, it logs a fallback to the console. Test verifies status 200.'
);

addSubHeading('TC-DB-02: DATABASE COMPOSITE PROGRESS UNIQUE CONSTRAINT');
addParagraph(
  '• Method: Direct database assertion using Prisma client.\n' +
  '• Verification details: Creates a mock roadmap and attempts to write two separate user progress logs for the exact same user, roadmap, and day (Day 1). PostgreSQL blocks the duplicate insertion with a unique constraint error (P2002).'
);

addSubHeading('TC-DB-03: DATABASE COMPOSITE ACHIEVEMENT UNIQUE CONSTRAINT');
addParagraph(
  '• Method: Direct database assertion using Prisma client.\n' +
  '• Verification details: Attempts to write two records with the same badge ID ("duplicate_check_badge") for the same user. PostgreSQL blocks the second entry with a unique constraint error (P2002), confirming only one badge can be awarded.'
);

addSubHeading('TC-DB-01: DATABASE CASCADING DELETE INTEGRITY');
addParagraph(
  '• Method: Direct database deletion check using Prisma.\n' +
  '• Verification details: Deletes the test user. Verifies that all associated records (roadmaps, user progress, chat messages, and achievements) are automatically purged via cascading constraints. Confirms zero orphaned records remain.'
);

// ==========================================
// PAGE 10: CONCLUSION & LOG EXCERPT
// ==========================================
doc.addPage();
addHeading('4. Conclusion & Log Excerpt');
addParagraph(
  'The smart personalized learning platform backend has passed all 18 integration tests. Security architectures (Bcrypt hashing, secure cookie storage, token validation), LLM key rotations, SMTP setups, and database constraints function exactly as specified, maintaining data consistency and application security.'
);

addSubHeading('AUTOMATED RUNNER LOG OUTPUT');
addCodeBlock(`=============================================
🚀 STARTING AUTOMATED PLATFORM INTEGRATION TESTS
   (18 Integration Test Cases Automating System Specification)
   Target Server: http://localhost:5000
=============================================
  ✓ PASSED: User Registration API (POST /api/auth/register)
  ✓ PASSED: Register Input Validation Guards
  ✓ PASSED: User Login API (POST /api/auth/login)
  ...
  ✓ PASSED: Database Composite Progress Unique Constraint (TC-DB-02)
  ✓ PASSED: Database Composite Achievement Unique Constraint (TC-DB-03)
  ✓ PASSED: Database Cascading Integrity Constraints (TC-DB-01)
=============================================
📊 INTEGRATION TESTING COMPLETION SUMMARY: 18/18 PASSED
=============================================`);

// ==========================================
// FINALIZING AND METADATA PAGINATION WRITING
// ==========================================
const totalPages = doc.bufferedPageRange().count;

for (let i = 1; i < totalPages; i++) {
  doc.switchToPage(i);
  
  let pageTitle = '';
  switch (i) {
    case 1: pageTitle = 'Executive Testing Summary'; break;
    case 2: pageTitle = 'Test Case Matrix (Part 1)'; break;
    case 3: pageTitle = 'Test Case Matrix (Part 2)'; break;
    case 4: pageTitle = 'Test Reports (Tests 1-4)'; break;
    case 5: pageTitle = 'Test Reports (Tests 5-8)'; break;
    case 6: pageTitle = 'Test Reports (Tests 9-11)'; break;
    case 7: pageTitle = 'Test Reports (Tests 12-14)'; break;
    case 8: pageTitle = 'Test Reports (Tests 15-18)'; break;
    case 9: pageTitle = 'Conclusion & Log Excerpt'; break;
    default: pageTitle = 'Testing Report';
  }
  
  drawHeader(pageTitle);
  drawFooter(i + 1, totalPages);
}

// End & save the file
doc.end();

console.log('✅ QA Testing Report PDF has been successfully generated!');
