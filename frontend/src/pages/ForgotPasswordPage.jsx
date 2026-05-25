// src/pages/ForgotPasswordPage.jsx
import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { forgotPassword } from "../services/authService";

// ─────────────────────────────────────────────────────────
//  Small reusable sub-components (aligned with AuthPage.jsx)
// ─────────────────────────────────────────────────────────

function FormField({ label, type, name, value, onChange, placeholder, error, autoComplete }) {
  return (
    <div className="mb-6">
      <label className="block text-xs font-semibold text-slate-200 uppercase tracking-widest mb-2">
        {label}
      </label>
      <input
        type={type}
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
          Sending…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// Animated background
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
//  Main Page Component
// ─────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError("");
    setApiError("");
  };

  const validate = () => {
    if (!email.trim()) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const res = await forgotPassword({ email });
      setSuccessMessage(res.message || "A password reset link has been sent.");
    } catch (err) {
      setApiError(err.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 overflow-hidden items-center justify-center p-8">
      <Background />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold font-display">
            S
          </div>
          <span className="text-lg font-semibold text-slate-100 font-display">
            Smart Personalized Learning
          </span>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.09] rounded-2xl p-8 relative overflow-hidden shadow-2xl backdrop-blur-md">
          {/* Top shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          <AnimatePresence mode="wait">
            {!successMessage ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="font-display text-2xl font-bold text-slate-100 tracking-tight mb-2">
                  Forgot Password? 🔒
                </h2>
                <p className="text-sm text-slate-300 mb-6">
                  No worries! Enter your email address below, and we will send you a secure link to reset your password.
                </p>

                {apiError && (
                  <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {apiError}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <FormField
                    label="Email address"
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    error={error}
                    autoComplete="email"
                  />
                  <SubmitButton loading={loading}>Send Reset Link →</SubmitButton>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 animate-bounce">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-slate-100 mb-2">
                  Check Your Inbox
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {successMessage}
                </p>
                <div className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
                  Tip: If using local development without SMTP configured, the link is logged directly to the backend terminal.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-100 transition-colors font-semibold"
            >
              <span>←</span> Back to Sign In
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Need help? Contact support at{" "}
          <a href="mailto:support@smartlearning.com" className="text-slate-300 hover:text-white transition-colors">
            support@smartlearning.com
          </a>
        </p>
      </div>
    </div>
  );
}
