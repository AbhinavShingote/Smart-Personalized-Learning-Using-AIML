import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { LearningProvider } from './contexts/LearningContext';
import UniversalLearningForm from './components/UniversalLearningForm';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import QuickRoadmap from './components/QuickRoadmap';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PrivateRoute from './components/PrivateRoute';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <LearningProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route
                  path="/generate"
                  element={
                    <PrivateRoute>
                      <LandingPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/universal"
                  element={
                    <PrivateRoute>
                      <UniversalLearningForm />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/quick"
                  element={
                    <PrivateRoute>
                      <QuickRoadmap />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </motion.div>
          </div>
        </Router>
      </LearningProvider>
    </AuthProvider>
  );
}

export default App;
