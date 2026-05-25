# Smart Personalized Learning Using AI/ML

This repository contains the complete implementation of the **Smart Personalized AI Learning Platform**. The project is split into a React frontend and a Node.js Express backend.

## 📂 Project Structure

- **`frontend/`**: React SPA frontend built with React 18, Tailwind CSS, Framer Motion, and Chart.js.
- **`backend/`**: Node.js Express backend API interacting with PostgreSQL via Prisma ORM. Integrated with Google OAuth, YouTube Data API v3, LangChain/Gemini key-rotation helper, and Nodemailer SMTP streak triggers.
- **`files/`**: Backup configuration files and legacy authentication schemas.
- **`package.json`**: Root-level orchestration settings to run both development environments concurrently.

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn package manager
- PostgreSQL database instance
- Google Cloud Console Credentials (for OAuth and YouTube API v3)
- Gemini API Keys (minimum 1, supports up to 5 for auto-rotation)

### 📦 Setup & Installation

From the root directory, run the following command to automatically install all dependencies across the workspace (root, frontend, and backend):

```bash
npm run install:all
```

### ⚙️ Environment Configuration

Configure environmental keys separately for frontend and backend:

#### Frontend Config (`frontend/.env`)
Create a `frontend/.env` file with reference to `frontend/.env.example`:
```env
REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key_here
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
REACT_APP_API_URL=http://localhost:5000/api
```

#### Backend Config (`backend/.env`)
Create a `backend/.env` file with reference to `backend/.env.example`:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/smart_learning"
JWT_SECRET="your_jwt_secret_key"
PORT=5000
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 🏃 Running the Application

You can start both the frontend development server and backend API concurrently using:

```bash
npm run dev
```

- **Frontend client** runs at `http://localhost:3000`
- **Backend server API** runs at `http://localhost:5000`

Individual commands:
- Start Frontend only: `npm run start:frontend`
- Start Backend Node server only: `npm run start:backend`
- Start Backend Nodemon server only: `npm run dev:backend`
