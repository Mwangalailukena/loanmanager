// src/AppRoutes.js
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import the correct AppLayout component from its dedicated file
import AppLayout from './components/AppLayout';

// Dynamically import all your page components using React.lazy
const LazyDashboard = lazy(() => import('./pages/Dashboard'));
const LazyLoanList = lazy(() => import('./pages/LoanList'));
const LazyAddLoanForm = lazy(() => import('./pages/AddLoanForm'));
const LazyAddPaymentPage = lazy(() => import('./pages/AddPaymentPage'));
const LazyActivityPage = lazy(() => import('./pages/ActivityPage'));
const LazySettingsPage = lazy(() => import('./pages/SettingsPage'));
const LazyProfile = lazy(() => import('./pages/Profile'));
const LazyChangePassword = lazy(() => import('./pages/ChangePassword'));
const LazyLogin = lazy(() => import('./pages/Login'));
const LazyRegister = lazy(() => import('./pages/Register'));
const LazyForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const LazyReportsPage = lazy(() => import('./pages/ReportsPage'));

// Import your ProtectedRoute component
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes({ darkMode, onToggleDarkMode }) {
  const location = useLocation();

  return (
    <AppLayout darkMode={darkMode} onToggleDarkMode={onToggleDarkMode}>
      <div className="page-transition-container">
        <div key={location.pathname} className="page-transition">
          <Suspense fallback={<div>Loading page...</div>}>
            <Routes location={location}>
              {/* Public Routes */}
              <Route path="/login" element={<LazyLogin />} />
              <Route path="/register" element={<LazyRegister />} />
              <Route path="/forgot-password" element={<LazyForgotPassword />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><LazyDashboard /></ProtectedRoute>} />
              <Route path="/loans" element={<ProtectedRoute><LazyLoanList /></ProtectedRoute>} />
              <Route path="/add-loan" element={<ProtectedRoute><LazyAddLoanForm /></ProtectedRoute>} />
              <Route path="/add-payment" element={<ProtectedRoute><LazyAddPaymentPage /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><LazyActivityPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><LazySettingsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><LazyProfile /></ProtectedRoute>} />
              <Route path="/change-password" element={<ProtectedRoute><LazyChangePassword /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><LazyReportsPage /></ProtectedRoute>} />

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}

export default AppRoutes;
