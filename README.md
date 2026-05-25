# Smart Personalized Learning AI Platform

A state-of-the-art, full-stack, AI-driven learning platform designed to generate personalized learning paths (roadmaps), coordinate persistent chat tutor sessions, recommend relevant YouTube materials, track study progress via gamified mechanics, and enforce secure authentication.

---

## 📂 Project Directory Structure

```
.
├── backend/               # Express.js Node API & Database
│   ├── config/            # Database and security configurations
│   ├── controllers/       # Route business logic handlers
│   ├── middleware/        # Authentication and validation guards
│   ├── prisma/            # Database Schema and migrations
│   ├── routes/            # Express endpoint maps
│   ├── services/          # Email schedulers and AI clients
│   ├── utils/             # Key rotation and general helpers
│   ├── server.js          # API main entrypoint
│   └── package.json
│
├── frontend/              # React SPA Frontend Client
│   ├── public/            # HTML indexes and global assets
│   ├── src/               # React component structure
│   │   ├── components/    # Reusable widgets and sections
│   │   ├── contexts/      # Local Storage Context providers
│   │   ├── data/          # Mock details and static category charts
│   │   ├── pages/         # Login, Register, Forgot Password Views
│   │   ├── services/      # Fetch API connections to backend
│   │   └── index.js
│   └── package.json
│
├── documentation/         # PDF and Markdown specifications & test reports
│   ├── GIT_WORKFLOW.md    # Collaborating branch rules and PR guidelines
│   ├── Testing_Report.pdf # QA test runs for all 18 endpoints
│   └── ... (architectural logs)
│
├── screenshots/           # Application screenshots and visualization graphics
│
├── package.json           # Root workspace orchestrator (concurrent scripts)
└── .gitignore             # Global build and config ignore rules
```

---

## ✨ Features

### 🎯 1. Stateful AI Roadmap Generator
*   Analyze subjects, target durations, and availability.
*   Incorporate AI prompts returning structured JSON layouts.
*   Visualize schedules with progress tracking checkboxes.

### 💬 2. Persistent Chatbot Tutor
*   Database-backed chat transcripts linked to user profiles.
*   Automatically context-aware of your current roadmap subject.
*   Supports offline fallbacks if the AI key hits rate limits.

### 📺 3. YouTube API v3 Video Recommendations
*   Match and curate related tutorials using search endpoints.
*   Pull high-res thumbnails and display video durations.
*   Interactive embedding for playback inside the dashboard.

### 🏆 4. Gamified Retention Mechanics
*   Track XP points, levels, and consecutive day streaks.
*   Award and save unlockable achievements (e.g. "First Spark").
*   Global user leaderboard sorted by total XP.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 (SPA) | Component isolation, Context hooks, local state. |
| | Framer Motion | Smooth fade-ins and slide transitions. |
| | Tailwind CSS | Modern layout and slate-glassmorphic designs. |
| | Chart.js | Interactive learning statistics visualization. |
| **Backend** | Node.js + Express.js | Route routing, JWT session authorization. |
| | Prisma ORM | DB mapping and cascade operations. |
| **Database** | PostgreSQL | Relational schemas with composite indexes. |
| **AI/Services**| Gemini 2.5/1.5 Flash | Structured content generation and key rotation. |
| | YouTube Data API v3 | Educational video matching. |
| | Nodemailer SMTP | Streak reminder cron tasks & recovery emails. |

---

## 🔌 API & Integration Specifications

### 🔑 1. Gemini Multi-Key Rotation
To prevent API limits (HTTP 429), `backend/utils/geminiHelper.js` cycles up to 5 Gemini keys. If a key throws a rate-limit exception, the helper catches it instantly and rotates to the next key.

### 📺 2. YouTube Data API v3
Performs search queries using:
```
https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q={searchQuery}&maxResults=3&key={apiKey}
```
Converts retrieved snippets into embedded video tiles with mock fallbacks.

### ✉️ 3. Streak Schedulers (SMTP)
A cron worker runs hourly on the server (`node-cron`). It queries users who have not logged in for 22–23 hours and fires an email reminder using Gmail App Passwords.

---

## 🚀 Installation & Local Execution

### 1. Install Dependencies
Install all modules for the root orchestrator, frontend, and backend packages concurrently:
```bash
npm run install:all
```

### 2. Configure Local Settings
Setup separate environment files:

#### Frontend Configurations (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_YOUTUBE_API_KEY=your_google_cloud_youtube_key
```

#### Backend Configurations (`backend/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/smart_learning"
JWT_SECRET="your_secure_session_jwt_secret"
PORT=5000
SMTP_USER="gmail-address@gmail.com"
SMTP_PASS="gmail-app-password"
```

### 3. Spin Up Development Servers
Run the fullstack app concurrently:
```bash
npm run dev
```
Navigate your browser to `http://localhost:3000`.

---

## 📸 Screenshots

*Add screenshots here to show the landing page, roadmaps, interactive quizzes, chat panels, and gamified achievements.*

| Dashboard | AI Roadmap | Persistent Chatbot |
| :---: | :---: | :---: |
| *[Dashboard View]* | *[Roadmap Layout]* | *[Tutor Chat Panel]* |
| `screenshots/dashboard.png` | `screenshots/roadmap.png` | `screenshots/chat.png` |

---

## 🔮 Future Scope

1.  **AI Adaptive Learning**: Adjust quiz difficulties dynamically based on past score results.
2.  **Social Study Rooms**: Shared channels where users can track a roadmap together.
3.  **Advanced Notes Engine**: Create and sync markdown notes directly onto YouTube timestamps.
4.  **Mobile Progressive App (PWA)**: Offline-first features with native push reminders.

---

## 🤝 Contribution Guidelines

We welcome pull requests to improve the platform! To contribute:

1.  Clone the repository and align with the development branches.
2.  Follow the branching rules outlined in [GIT_WORKFLOW.md](file:///E:/Smart-Personalized-Learning-master/documentation/GIT_WORKFLOW.md).
3.  Create feature branches from `frontend-dev` or `backend-dev`.
4.  Write clean code, format with Prettier, and submit PRs with descriptive commit messages.
