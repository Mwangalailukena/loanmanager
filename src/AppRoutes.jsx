// src/AppRoutes.js
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import the correct AppLayout component from its dedicated file
import AppLayout from './components/AppLayout';

// Import all your page components
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
import ReportsPage from './pages/ReportsPage';

// Import your ProtectedRoute component
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes({ darkMode, onToggleDarkMode }) {
  const location = useLocation();

  return (
    <AppLayout darkMode={darkMode} onToggleDarkMode={onToggleDarkMode}>
      <div className="page-transition-container">
        <div key={location.pathname} className="page-transition">
          <Routes location={location}>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/loans" element={<ProtectedRoute><LoanList /></ProtectedRoute>} />
            <Route path="/add-loan" element={<ProtectedRoute><AddLoanForm /></ProtectedRoute>} />
            <Route path="/add-payment" element={<ProtectedRoute><AddPaymentPage /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </AppLayout>
  );
}

export default AppRoutes;
