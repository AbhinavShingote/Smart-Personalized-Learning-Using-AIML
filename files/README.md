# 🔐 Smart Learning Platform — Auth Backend

## Folder Structure

```
backend/
├── config/
│   ├── db.js            ← Prisma client singleton
│   └── jwt.js           ← Token sign / verify / cookie helpers
├── controllers/
│   └── authController.js ← register, login, logout, getMe logic
├── middleware/
│   └── authenticate.js  ← JWT route guard
├── prisma/
│   └── schema.prisma    ← DB models: User, Roadmap, UserProgress
├── routes/
│   └── auth.js          ← POST /register, POST /login, POST /logout, GET /me
├── frontend-integration/
│   ├── authService.js   ← Copy → src/services/authService.js
│   ├── AuthContext.js   ← Copy → src/contexts/AuthContext.js
│   └── PrivateRoute.js  ← Copy → src/components/PrivateRoute.js
├── .env.example
├── package.json
└── server.js
```

---

## Setup Steps

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, etc.
```

### 3. Generate a strong JWT secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Set up the database
```bash
# Option A — Local PostgreSQL
createdb smart_learning

# Option B — Supabase (free)
# Create a project at https://supabase.com and copy the connection string

# Option C — Neon (free, serverless)
# Create a project at https://neon.tech and copy the connection string
```

### 5. Run Prisma migrations
```bash
npx prisma generate       # generates the Prisma client
npx prisma migrate dev --name init   # creates tables in DB
npx prisma studio         # optional: visual DB browser
```

### 6. Start the server
```bash
npm run dev   # nodemon (hot reload)
npm start     # production
```

---

## API Reference

### `POST /api/auth/register`
```json
// Request body
{ "name": "Abhinav", "email": "a@example.com", "password": "SecurePass1" }

// Response 201
{ "success": true, "user": { "id": "...", "name": "Abhinav", "email": "...", "level": 1, ... } }
// + HTTP-only cookie: token=<jwt>
```

### `POST /api/auth/login`
```json
// Request body
{ "email": "a@example.com", "password": "SecurePass1" }

// Response 200
{ "success": true, "user": { ... } }
// + HTTP-only cookie: token=<jwt>; streak updated
```

### `POST /api/auth/logout`
```json
// Response 200
{ "success": true, "message": "Logged out successfully." }
// Clears the cookie
```

### `GET /api/auth/me`  *(protected)*
```json
// Response 200 (cookie sent automatically by browser)
{ "success": true, "user": { "id": "...", "name": "...", "level": 1, "totalXP": 0, ... } }
```

---

## Frontend Integration

### 1. Copy files
```bash
cp frontend-integration/authService.js  ../src/services/authService.js
cp frontend-integration/AuthContext.js  ../src/contexts/AuthContext.js
cp frontend-integration/PrivateRoute.js ../src/components/PrivateRoute.js
```

### 2. Add to .env in your React project
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Wrap App.js with AuthProvider
```jsx
// src/index.js or src/App.js
import { AuthProvider } from "./contexts/AuthContext";

<AuthProvider>
  <LearningProvider>   {/* your existing context */}
    <App />
  </LearningProvider>
</AuthProvider>
```

### 4. Protect routes
```jsx
// src/App.js
import PrivateRoute from "./components/PrivateRoute";

<Route path="/dashboard" element={
  <PrivateRoute><Dashboard /></PrivateRoute>
} />
```

### 5. Use auth in any component
```jsx
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return isAuthenticated
    ? <button onClick={logout}>Logout ({user.name})</button>
    : <Link to="/login">Login</Link>;
}
```

---

## Security Checklist
- ✅ Passwords hashed with bcrypt (salt rounds: 12)
- ✅ JWT stored in HTTP-only cookie (XSS-safe)
- ✅ SameSite cookie flag (CSRF protection)
- ✅ Secure cookie flag in production (HTTPS only)
- ✅ Generic error messages (no user enumeration)
- ✅ Rate limiting on auth endpoints (20 req / 15 min / IP)
- ✅ Input validation via express-validator
- ✅ DB-level user existence check on every request
