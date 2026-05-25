// src/pages/AuthPage.jsx
// Drop-in Login/Register page.
// Uses AuthContext from ../contexts/AuthContext.js (built in Phase 1).
// Place this route in App.js:
//   <Route path="/login" element={<AuthPage />} />

import React, { useState, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

// ─────────────────────────────────────────────────────────
//  Small reusable sub-components
// ─────────────────────────────────────────────────────────

function EyeIcon({ visible }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function FormField({ label, type, name, value, onChange, placeholder, error, autoComplete }) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPwd ? "text" : "password") : type;

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-200 uppercase tracking-widest mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-[15px] text-slate-100
            placeholder-slate-400 outline-none transition-all duration-200
            focus:bg-blue-950/30 focus:ring-2 focus:ring-blue-500/30
            ${error
              ? "border-red-500/50 focus:border-red-500/70"
              : "border-white/[0.15] focus:border-blue-500/50"
            }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            <EyeIcon visible={showPwd} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full mt-2 py-3.5 px-6 rounded-xl font-semibold text-[15px] text-white
        bg-gradient-to-br from-blue-600 to-sky-500 tracking-wide
        hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.35)]
        active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
//  Login Form
// ─────────────────────────────────────────────────────────

function LoginForm({ onSwitch }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const [fields, setFields] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setApiError("");
  }, []);

  function validate() {
    const errs = {};
    if (!fields.email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(fields.email)) errs.email = "Enter a valid email.";
    if (!fields.password) errs.password = "Password is required.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError("");
    try {
      await login(fields.email, fields.password);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
    >
      <h2 className="font-display text-2xl font-bold text-slate-100 tracking-tight mb-1">
        Welcome back 👋
      </h2>
      <p className="text-sm text-slate-300 mb-7">
        Pick up right where your streak left off.
      </p>

      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
          >
            {apiError}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Email address" type="email" name="email" value={fields.email}
          onChange={handleChange} placeholder="you@example.com" error={errors.email}
          autoComplete="email" />
        <FormField label="Password" type="password" name="password" value={fields.password}
          onChange={handleChange} placeholder="••••••••" error={errors.password}
          autoComplete="current-password" />
        <div className="flex justify-end mb-1">
          <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Forgot password?
          </Link>
        </div>
        <SubmitButton loading={loading}>Sign In to Smart Personalized Learning →</SubmitButton>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-xs text-slate-600">or continue with</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <GoogleButton />

      <p className="text-center mt-6 text-sm text-slate-300">
        Don't have an account?{" "}
        <button onClick={onSwitch} className="text-blue-300 hover:text-blue-100 font-semibold transition-colors">
          Create one free →
        </button>
      </p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
//  Register Form
// ─────────────────────────────────────────────────────────

// 🎮 +50 XP Welcome Bonus Badge
function RegisterForm({ onSwitch }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const [fields, setFields] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setApiError("");
  }, []);

  function validate() {
    const errs = {};
    if (!fields.name.trim()) errs.name = "Name is required.";
    else if (fields.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    if (!fields.email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(fields.email)) errs.email = "Enter a valid email.";
    if (!fields.password) errs.password = "Password is required.";
    else if (fields.password.length < 8) errs.password = "At least 8 characters.";
    else if (!/[A-Z]/.test(fields.password)) errs.password = "Add at least one uppercase letter.";
    else if (!/[0-9]/.test(fields.password)) errs.password = "Add at least one number.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError("");
    try {
      await register(fields.name.trim(), fields.email, fields.password);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      {/* Welcome bonus badge */}
      <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 mb-5">
        <span className="text-sm">🎮</span>
        <span className="text-xs font-semibold text-amber-400 font-display tracking-wide">
          +50 XP Welcome Bonus on signup
        </span>
      </div>

      <h2 className="font-display text-2xl font-bold text-slate-100 tracking-tight mb-1">
        Start your journey
      </h2>
      <p className="text-sm text-slate-300 mb-7">
        Join thousands building real skills every day.
      </p>

      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
          >
            {apiError}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Full Name" type="text" name="name" value={fields.name}
          onChange={handleChange} placeholder="Your Name" error={errors.name}
          autoComplete="name" />
        <FormField label="Email address" type="email" name="email" value={fields.email}
          onChange={handleChange} placeholder="you@example.com" error={errors.email}
          autoComplete="email" />
        <FormField label="Password" type="password" name="password" value={fields.password}
          onChange={handleChange} placeholder="Min 8 chars, 1 uppercase, 1 number"
          error={errors.password} autoComplete="new-password" />
        <SubmitButton loading={loading}>Create Free Account →</SubmitButton>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-xs text-slate-600">or continue with</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      <GoogleButton />

      <p className="text-center mt-6 text-sm text-slate-300">
        Already have an account?{" "}
        <button onClick={onSwitch} className="text-blue-300 hover:text-blue-100 font-semibold transition-colors">
          Sign in →
        </button>
      </p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
//  Google Button (placeholder — wire up OAuth later)
// ─────────────────────────────────────────────────────────

function GoogleButton() {
  const handleGoogleLogin = () => {
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl
        text-sm text-slate-200 hover:bg-white/[0.07] hover:text-slate-100
        transition-all duration-200 flex items-center justify-center gap-2.5"
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>
  );
}

// ─────────────────────────────────────────────────────────
//  Animated background
// ─────────────────────────────────────────────────────────

const DOTS = [
  { top: "15%", left: "30%", delay: 0.5 }, { top: "40%", left: "55%", delay: 1 },
  { top: "70%", left: "20%", delay: 2 },   { top: "25%", left: "70%", delay: 0.2 },
  { top: "80%", left: "75%", delay: 1.5 }, { top: "55%", left: "40%", delay: 0.8 },
];

function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Orbs */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,.15) 0%, transparent 70%)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,.05) 0%, transparent 70%)" }}
      />
      {/* Twinkling dots */}
      {DOTS.map((dot, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: dot.delay }}
          className="absolute w-[3px] h-[3px] rounded-full bg-blue-400/50"
          style={{ top: dot.top, left: dot.left }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────────────────

export default function AuthPage() {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 overflow-hidden">
      <Background />

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold text-lg font-display">
            S
          </div>
          <span className="text-lg font-semibold text-slate-100 tracking-tight font-display">
            Smart Personalized Learning
          </span>
        </div>

        {/* Tag */}
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1.5 w-fit mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-widest">
            AI-Powered Learning
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-5xl font-bold leading-[1.1] text-slate-50 tracking-[-2px] mb-5">
          Learn Anything.
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent">
            Your Way.
          </span>
        </h1>

        <p className="text-base text-slate-200 leading-relaxed max-w-sm mb-12">
          A personalized roadmap generated just for you — with curated videos,
          adaptive quizzes, and streaks that keep you going.
        </p>
      </div>

      {/* ── Right panel — Auth card ── */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold font-display">
              S
            </div>
            <span className="text-base font-semibold text-slate-100 font-display">Smart Personalized Learning</span>
          </div>

          {/* Card */}
          <div className="bg-white/[0.04] border border-white/[0.09] rounded-2xl p-8 relative overflow-hidden">
            {/* Top shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

            {/* Tabs */}
            <div className="flex gap-1 bg-black/25 rounded-xl p-1 mb-8">
              {[
                { key: "login", label: "Sign In" },
                { key: "register", label: "Create Account" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200
                    ${tab === key
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "text-slate-500 hover:text-slate-300"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Form content */}
            <AnimatePresence mode="wait">
              {tab === "login" ? (
                <LoginForm key="login" onSwitch={() => setTab("register")} />
              ) : (
                <RegisterForm key="register" onSwitch={() => setTab("login")} />
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-300 mt-6">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-slate-200 hover:text-white transition-colors">
              Terms of Service
            </Link>{" "}
            &amp;{" "}
            <Link to="/privacy" className="text-slate-200 hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
