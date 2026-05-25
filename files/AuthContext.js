// src/contexts/AuthContext.js
// Provides authentication state and actions to the entire React app.
// Drop this alongside your existing LearningContext.js and wrap App.js with it.

import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import { registerUser, loginUser, logoutUser, getMe } from "../services/authService";

// ─────────────────────────────────────────────────────────
//  Context + Reducer
// ─────────────────────────────────────────────────────────

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,   // true while we check for an existing session on mount
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, isLoading: true, error: null };

    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_ERROR":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case "AUTH_LOGOUT":
      return { ...initialState, isLoading: false };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────
//  Provider
// ─────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On app mount — try to restore session via the cookie
  useEffect(() => {
    async function restoreSession() {
      try {
        const data = await getMe();
        dispatch({ type: "AUTH_SUCCESS", payload: data.user });
      } catch {
        // No valid session → just mark loading done, stay unauthenticated
        dispatch({ type: "AUTH_ERROR", payload: null });
      }
    }
    restoreSession();
  }, []);

  // ── Actions ─────────────────────────────────────────────

  const register = useCallback(async (name, email, password) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const data = await registerUser({ name, email, password });
      dispatch({ type: "AUTH_SUCCESS", payload: data.user });
      return data.user;
    } catch (err) {
      dispatch({ type: "AUTH_ERROR", payload: err.message });
      throw err; // re-throw so the form can catch and display inline
    }
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const data = await loginUser({ email, password });
      dispatch({ type: "AUTH_SUCCESS", payload: data.user });
      return data.user;
    } catch (err) {
      dispatch({ type: "AUTH_ERROR", payload: err.message });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      // Always clear state even if network fails
      dispatch({ type: "AUTH_LOGOUT" });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value = {
    ...state,
    register,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
