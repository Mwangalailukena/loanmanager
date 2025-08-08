// src/AppRoutes.js
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Import Material-UI components for the loader
import { Box, LinearProgress, useTheme } from '@mui/material';

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

function AppRoutes({ darkMode, onToggleDarkMode }) {
  const location = useLocation();
  const theme = useTheme();

  return (
    <AppLayout darkMode={darkMode} onToggleDarkMode={onToggleDarkMode}>
      <div className="page-transition-container">
        <div key={location.pathname} className="page-transition">
          <Suspense
            fallback={
              // The linear progress bar is placed at the top of the viewport
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  zIndex: theme.zIndex.appBar + 1, // Ensures it's on top of everything
                }}
              >
                <LinearProgress color="secondary" />
              </Box>
            }
          >
            <Routes location={location}>
              <Route path="/login" element={<LazyLogin />} />
              <Route path="/register" element={<LazyRegister />} />
              <Route path="/forgot-password" element={<LazyForgotPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><LazyDashboard /></ProtectedRoute>} />
              <Route path="/loans" element={<ProtectedRoute><LazyLoanList /></ProtectedRoute>} />
              <Route path="/add-loan" element={<ProtectedRoute><LazyAddLoanForm /></ProtectedRoute>} />
              <Route path="/add-payment" element={<ProtectedRoute><LazyAddPaymentPage /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><LazyActivityPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><LazySettingsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><LazyProfile /></ProtectedRoute>} />
              <Route path="/change-password" element={<ProtectedRoute><LazyChangePassword /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><LazyReportsPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}

export default AppRoutes;
