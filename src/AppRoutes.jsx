// src/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import the correct AppLayout component from its dedicated file
import AppLayout from './components/AppLayout';

// Import your page components
import Dashboard from './pages/Dashboard';
import LoanList from './pages/LoanList';
import AddLoanForm from './pages/AddLoanForm';
import AddPaymentPage from './pages/AddPaymentPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Import your ProtectedRoute component
import ProtectedRoute from './components/ProtectedRoute';

// This component defines your application's routes
function AppRoutes({ darkMode, onToggleDarkMode }) {
  return (
    // AppLayout wraps all routes to provide consistent UI shell
    // The AppLayout component itself has logic to hide parts of the layout
    // for specific routes like /login, /register, etc.
    <AppLayout darkMode={darkMode} onToggleDarkMode={onToggleDarkMode}>
      <Routes>
        {/* Public Routes - these paths will trigger `hideLayout` in AppLayout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes - These components will be rendered inside AppLayout's <main> area */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/loans" element={<ProtectedRoute><LoanList /></ProtectedRoute>} />
        <Route path="/add-loan" element={<ProtectedRoute><AddLoanForm /></ProtectedRoute>} />
        <Route path="/add-payment" element={<ProtectedRoute><AddPaymentPage /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

        {/* Catch-all route: Redirects any unmatched path to /dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default AppRoutes;
