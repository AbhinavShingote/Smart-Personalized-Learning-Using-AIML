// src/components/PrivateRoute.js
// Wraps any component that should only be accessible when logged in.
// Usage in App.js:
//   <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // While checking for an existing session, render a simple loader
  // so the user doesn't get incorrectly redirected to /login on refresh.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Restoring session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to /login, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default PrivateRoute;
