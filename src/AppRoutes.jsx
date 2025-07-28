// File: src/AppRoutes.jsx import React from 'react'; import { Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/AppLayout'; import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard'; import LoanList from './pages/LoanList'; import AddLoanForm from './pages/AddLoanForm'; import AddPaymentPage from './pages/AddPaymentPage'; import ActivityPage from './pages/ActivityPage'; import SettingsPage from './pages/SettingsPage'; import Profile from './pages/Profile'; import ChangePassword from './pages/ChangePassword'; import Login from './pages/Login'; import Register from './pages/Register'; import ForgotPassword from './pages/ForgotPassword';

function AppRoutes({ darkMode, onToggleDarkMode }) { return ( <Routes> {/* Public routes (no layout) */} <Route path="/login" element={<Login />} /> <Route path="/register" element={<Register />} /> <Route path="/forgot-password" element={<ForgotPassword />} />

{/* Protected routes inside AppLayout */}
  <Route
    path="/"
    element={
      <AppLayout darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
    }
  >
    <Route
      path="dashboard"
      element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
    />
    <Route
      path="loans"
      element={<ProtectedRoute><LoanList /></ProtectedRoute>}
    />
    <Route
      path="add-loan"
      element={<ProtectedRoute><AddLoanForm /></ProtectedRoute>}
    />
    <Route
      path="add-payment"
      element={<ProtectedRoute><AddPaymentPage /></ProtectedRoute>}
    />
    <Route
      path="activity"
      element={<ProtectedRoute><ActivityPage /></ProtectedRoute>}
    />
    <Route
      path="settings"
      element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
    />
    <Route
      path="profile"
      element={<ProtectedRoute><Profile /></ProtectedRoute>}
    />
    <Route
      path="change-password"
      element={<ProtectedRoute><ChangePassword /></ProtectedRoute>}
    />

    {/* Default fallback route */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Route>

  {/* Fallback outside layout */}
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>

); }

export default AppRoutes;

