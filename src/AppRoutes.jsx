// src/AppRoutes.js
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
const LazyBorrowerListPage = lazy(() => import('./pages/BorrowerListPage'));
const LazyAddBorrowerPage = lazy(() => import('./pages/AddBorrowerPage'));
const LazyBorrowerProfilePage = lazy(() => import('./pages/BorrowerProfilePage'));
const LazyEditBorrowerPage = lazy(() => import('./pages/EditBorrowerPage'));
const LazyExpensesPage = lazy(() => import('./pages/ExpensesPage'));

const LazyLoanSimulatorPage = lazy(() => import('./pages/LoanSimulatorPage'));

function AppRoutes({ darkMode, onToggleDarkMode }) {
  const location = useLocation();
  const theme = useTheme();

  return (
    <AppLayout darkMode={darkMode} onToggleDarkMode={onToggleDarkMode}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{ width: '100%' }}
        >
          <Suspense
            fallback={
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100%',
                  zIndex: theme.zIndex.appBar + 1,
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
              <Route path="/expenses" element={<ProtectedRoute><LazyExpensesPage /></ProtectedRoute>} />
              <Route path="/simulator" element={<ProtectedRoute><LazyLoanSimulatorPage /></ProtectedRoute>} />

              {/* Borrower Routes */}
              <Route path="/borrowers" element={<ProtectedRoute><LazyBorrowerListPage /></ProtectedRoute>} />
              <Route path="/add-borrower" element={<ProtectedRoute><LazyAddBorrowerPage /></ProtectedRoute>} />
              <Route path="/borrowers/:id" element={<ProtectedRoute><LazyBorrowerProfilePage /></ProtectedRoute>} />
              <Route path="/borrowers/:id/edit" element={<ProtectedRoute><LazyEditBorrowerPage /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
}

export default AppRoutes;
