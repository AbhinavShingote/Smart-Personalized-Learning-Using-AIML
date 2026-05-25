// ─────────────────────────────────────────────────────────
//  1. Add Google Font to public/index.html <head>
// ─────────────────────────────────────────────────────────

/*
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
*/

// ─────────────────────────────────────────────────────────
//  2. tailwind.config.js — extend with custom font + color
// ─────────────────────────────────────────────────────────

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Outfit", "sans-serif"],   // headings
        sans: ["DM Sans", "sans-serif"],      // body (overrides Tailwind default)
      },
      colors: {
        // brand palette — used as bg-brand-500, text-brand-300 etc.
        brand: {
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          900: "#1E1B4B",
        },
      },
    },
  },
  plugins: [],
};


// ─────────────────────────────────────────────────────────
//  3. src/App.js — add the /login route + AuthProvider wrap
// ─────────────────────────────────────────────────────────

/*
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider }    from "./contexts/AuthContext";
import { LearningProvider } from "./contexts/LearningContext"; // your existing context
import AuthPage    from "./pages/AuthPage";
import Dashboard   from "./components/Dashboard";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LearningProvider>
          <Routes>
            {/* Public routes }
            <Route path="/login" element={<AuthPage />} />

            {/* Protected routes }
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Catch-all: redirect to login if not found }
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </LearningProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
*/
