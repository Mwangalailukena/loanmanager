import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

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

import ProtectedRoute from './components/ProtectedRoute';
import BottomNavBar from './components/BottomNavBar';
import Sidebar from './components/Sidebar';
import AppBarTop from './components/AppBarTop';

import { Toolbar } from '@mui/material';

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {!hideLayout && <AppBarTop darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />}
      {!hideLayout && <Toolbar />}
      <div style={{ flex: 1, display: 'flex' }}>
        {!hideLayout && <Sidebar />}
        <main style={{ flexGrow: 1, paddingBottom: !hideLayout ? '56px' : 0 }}>
          {children}
        </main>
      </div>
      {!hideLayout && <BottomNavBar />}
    </div>
  );
};

function AppRoutes({ darkMode, onToggleDarkMode }) {
  return (
    <AppLayout darkMode={darkMode} onToggleDarkMode={onToggleDarkMode}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <LoanList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-loan"
          element={
            <ProtectedRoute>
              <AddLoanForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-payment"
          element={
            <ProtectedRoute>
              <AddPaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <ActivityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default AppRoutes;

