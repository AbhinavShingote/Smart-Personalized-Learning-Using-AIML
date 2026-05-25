# Smart Personalized AI Learning Platform
## Comprehensive System Test Case Specification

This document provides a detailed suite of test cases divided into four testing surfaces:
1. **Postman API Tests** (Backend endpoints & payloads)
2. **Authentication & Security Tests** (JWT, Bcrypt, Google OAuth, Password Recovery)
3. **Runtime Database Verification Tests** (Prisma Queries, Constraints, Cascading Deletes)
4. **Web Browser UI/UX Tests** (React elements, Modals, Local States, Responsive Views)

---

## 1. Postman API Test Suite
Use Postman or Insomnia to execute these raw HTTP requests against the backend server running at `http://localhost:5000`.

### TC-API-01: User Registration
* **Endpoint**: `POST http://localhost:5000/api/auth/register`
* **Headers**: `Content-Type: application/json`
* **Request Payload**:
  ```json
  {
    "name": "Test Student",
    "email": "student@test.com",
    "password": "Password123"
  }
  ```
* **Expected Result**:
  * Status Code: `211 Created`
  * Response Body: `{ "success": true, "user": { "id": "...", "email": "student@test.com", "name": "Test Student", ... } }`
  * Response Cookies: A cookie named `token` should be present (`httpOnly=true`, `sameSite=Lax`).

### TC-API-02: User Login (Local Credentials)
* **Endpoint**: `POST http://localhost:5000/api/auth/login`
* **Headers**: `Content-Type: application/json`
* **Request Payload**:
  ```json
  {
    "email": "student@test.com",
    "password": "Password123"
  }
  ```
* **Expected Result**:
  * Status Code: `200 OK`
  * Response Body: `{ "success": true, "user": { "id": "...", "email": "student@test.com", ... } }`
  * Response Cookies: A valid updated `token` cookie.

### TC-API-03: Session Restore (Protected Route)
* **Endpoint**: `GET http://localhost:5000/api/auth/me`
* **Headers**: *Send cookies with request* (automatically managed in Postman if cookie jar is active, or use manual Cookie header).
* **Expected Result**:
  * **If cookie is valid**: Status `200 OK`, returns user profile JSON.
  * **If cookie is missing/invalid**: Status `401 Unauthorized`, returns `{ "success": false, "message": "Unauthorized" }`.

### TC-API-04: AI Roadmap Generation
* **Endpoint**: `POST http://localhost:5000/api/roadmap/generate`
* **Headers**: `Content-Type: application/json`
* **Request Payload**:
  ```json
  {
    "subject": "Docker and Kubernetes",
    "duration": 5,
    "skillLevel": "Intermediate",
    "hoursPerDay": 2
  }
  ```
* **Expected Result**:
  * Status Code: `201 Created`
  * Response Body: JSON object representing the generated roadmap days, topics, and descriptions.
  * Key Rotation check: Look at backend terminal logs to ensure key rotation handles rate-limits.

### TC-API-05: AI Study Cheat Sheet Notes
* **Endpoint**: `GET http://localhost:5000/api/roadmap/:id/cheat-sheet?day=1&topic=Introduction%20to%20Containers`
* **Expected Result**:
  * Status Code: `200 OK`
  * Response Body: `{ "success": true, "cheatSheet": "# Markdown content of cheat sheet..." }`

---

## 2. Authentication & Security Test Suite

### TC-AUTH-01: Bcryptjs Password Salting Verification
* **Action**: Register a user via frontend or API, then query the database directly.
* **Assert**: 
  1. The plain-text password `Password123` is **never** written to the database.
  2. The `passwordHash` field starts with the prefix `$2a$12$` indicating a Blowfish-based hashing algorithm with a cost factor of **12 rounds**.

### TC-AUTH-02: Form Validation Guards
* **Action**: Submit registration request with empty password, invalid email format (`student@`), and short username (`A`).
* **Assert**: Status `422 Unprocessable Entity` returned from backend, listing fields with explicit custom validation error arrays.

### TC-AUTH-03: Google OAuth 2.0 Flow
* **Action**: In browser, navigate to `http://localhost:5000/api/auth/google`.
* **Assert**:
  1. Server issues a `302 Redirect` to `https://accounts.google.com/o/oauth2/v2/auth`.
  2. The redirection URL query string parameters match configured values: `response_type=code`, `scope` including user profile and email.
  3. Authorizing redirect goes back to `http://localhost:5000/api/auth/google/callback?code=...`.
  4. Database creates user automatically (if new) and attaches credentials cookie.

### TC-AUTH-04: Secure Password Recovery Token
* **Action**: Send POST to `/api/auth/forgot-password` with email `student@test.com`.
* **Assert**:
  1. Server signs a reset token containing user ID.
  2. Sign key is composite: `process.env.JWT_SECRET + user.passwordHash`.
  3. *Why check this?* If the password changes, `user.passwordHash` updates, immediately invalidating old links to prevent unauthorized token reuse.

---

## 3. Runtime Database & Relations Test Suite
Validate database structures and schema constraints in PostgreSQL via Prisma Studio (`localhost:5555`).

### TC-DB-01: User Deletion (Cascade Check)
* **Action**: Delete a specific user record from the `users` table.
* **Assert**: 
  1. The related records in the `roadmaps` table are deleted automatically.
  2. The related progress data in the `user_progress` table is deleted.
  3. The chatbot logs in the `chat_messages` table are deleted.
  4. The unlocked user achievements in `achievements` are deleted.
  *(Ensures no orphaned rows are left in the database, preventing memory leaks).*

### TC-DB-02: Composite Progress Constraint
* **Action**: Attempt to manually insert a record in the `user_progress` table with duplicate values for `userId`, `roadmapId`, and `dayNumber`.
* **Assert**: Database throws a unique constraint violation error. This prevents double completions and duplicate XP rewards for the same learning day.

### TC-DB-03: Single Badge Achievement Constraint
* **Action**: Attempt to insert a badge record with duplicate `userId` and `badgeId` (e.g. two "first_quiz" badges for user A).
* **Assert**: Database raises a unique index error. A student can unlock each specific achievement badge exactly once.

---

## 4. Web Browser Interface (UI/UX) Test Suite
Test the application interface locally using Google Chrome/Firefox with Developer Tools (F12) active.

### TC-UI-01: Session Restoring On Mount
* **Action**: Navigate to `http://localhost:3000/dashboard` while logged in. Close the browser tab. Re-open the tab and navigate to `http://localhost:3000/dashboard`.
* **Assert**: The dashboard renders immediately. The system restores the user's active session without prompting for credentials.

### TC-UI-02: Route Guards (Unauthorized Redirect)
* **Action**: Delete the `token` cookie in Developer Tools -> Application -> Cookies. Manually type `http://localhost:3000/dashboard` in the address bar and press Enter.
* **Assert**: React Router blocks access and redirects to `/login`.

### TC-UI-03: Markdown Rendering & Copy Clipboard
* **Action**: Click the "Book" icon to trigger a topic study guide.
* **Assert**:
  1. A modal appears displaying rendered markdown headers, code snippets, and list points.
  2. Clicking "Copy" shows a visual confirmation (e.g., "Copied!").
  3. Open notepad and press `Ctrl + V` to confirm text is correct.

### TC-UI-04: Gamification Level-Up HUD Update
* **Action**: Open the Roadmap page. Take a Quiz and answer questions correctly to pass.
* **Assert**:
  1. An XP award alert appears.
  2. Dashboard XP level bar fills up.
  3. If character XP crosses 500, user Level changes immediately on screen (e.g. Level 1 -> Level 2).

### TC-UI-05: Chatbot Sidebar Context Locking
* **Action**: Navigate to Java Course Roadmap. Open chatbot and ask: *"How do I run this?"*
* **Assert**: The prompt context locks to the active roadmap subject (Java) and the AI answers with Java code recommendations.
