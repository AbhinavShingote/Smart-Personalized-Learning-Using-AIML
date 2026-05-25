// src/services/authService.js
// Thin wrapper around the backend auth API.
// All requests go with credentials: "include" so the browser sends/receives
// the HTTP-only JWT cookie automatically.

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    // Surface backend validation errors or messages
    const message =
      data.errors?.[0]?.msg || data.message || "An unexpected error occurred.";
    throw new Error(message);
  }
  return data;
}

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} payload
 * @returns {{ success: boolean, user: object }}
 */
export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",   // send/receive cookies
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/**
 * Log in an existing user.
 * @param {{ email: string, password: string }} payload
 */
export async function loginUser(payload) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/**
 * Log out — clears the HTTP-only cookie on the server.
 */
export async function logoutUser() {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  return handleResponse(res);
}

/**
 * Fetch the currently authenticated user (uses the cookie silently).
 * Call this on app load to restore session.
 */
export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    credentials: "include",
  });
  return handleResponse(res);
}
