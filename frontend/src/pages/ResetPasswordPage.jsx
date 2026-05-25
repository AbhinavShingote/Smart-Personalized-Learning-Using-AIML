// src/pages/ResetPasswordPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { resetPassword } from "../services/authService";

// ─────────────────────────────────────────────────────────
//  Subcomponents matching styling
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

function FormField({ label, name, value, onChange, placeholder, error, autoComplete }) {
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-200 uppercase tracking-widest mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPwd ? "text" : "password"}
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
        <button
          type="button"
          onClick={() => setShowPwd((p) => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          aria-label={showPwd ? "Hide password" : "Show password"}
        >
          <EyeIcon visible={showPwd} />
        </button>
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
      className="w-full mt-4 py-3.5 px-6 rounded-xl font-semibold text-[15px] text-white
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
          Resetting…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// Background
const DOTS = [
  { top: "15%", left: "30%", delay: 0.5 }, { top: "40%", left: "55%", delay: 1 },
  { top: "70%", left: "20%", delay: 2 },   { top: "25%", left: "70%", delay: 0.2 },
  { top: "80%", left: "75%", delay: 1.5 }, { top: "55%", left: "40%", delay: 0.8 },
];

function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
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

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [fields, setFields] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setApiError("");
  };

  const validate = () => {
    const errs = {};
    if (!fields.password) {
      errs.password = "Password is required.";
    } else {
      if (fields.password.length < 8) {
        errs.password = "Password must be at least 8 characters.";
      }
      if (!/[A-Z]/.test(fields.password)) {
        errs.password = (errs.password || "") + " Must contain an uppercase letter.";
      }
      if (!/[0-9]/.test(fields.password)) {
        errs.password = (errs.password || "") + " Must contain a number.";
      }
    }

    if (fields.password !== fields.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      await resetPassword(token, { password: fields.password });
      setSuccess(true);
    } catch (err) {
      setApiError(err.message || "Failed to reset password. The link may have expired or is invalid.");
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
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="font-display text-2xl font-bold text-slate-100 tracking-tight mb-2">
                  Reset Password 🔑
                </h2>
                <p className="text-sm text-slate-300 mb-6">
                  Set a new, strong password below to secure your learning journey.
                </p>

                {apiError && (
                  <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {apiError}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <FormField
                    label="New Password"
                    name="password"
                    value={fields.password}
                    onChange={handleChange}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    error={errors.password}
                    autoComplete="new-password"
                  />
                  <FormField
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={fields.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                  />
                  <SubmitButton loading={loading}>Reset Password →</SubmitButton>
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
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-slate-100 mb-2">
                  Success!
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  Your password has been reset successfully. You can now use your new password to sign in.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-[15px] text-white
                    bg-gradient-to-br from-blue-600 to-sky-500 tracking-wide
                    hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.35)]
                    active:translate-y-0 transition-all duration-200"
                >
                  Sign In Now
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
