// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import LoanList from './pages/LoanList';
import AddLoanForm from './pages/AddLoanForm';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import { FirestoreProvider } from './contexts/FirestoreProvider';
import { AuthProvider } from './contexts/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNavBar from './components/BottomNavBar';
import Sidebar from './components/Sidebar';
import AppBarTop from './components/AppBarTop';

import InstallPrompt from './components/InstallPrompt'; // <-- Added install prompt import

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Toolbar } from '@mui/material';

import './App.css';

const AppLayout = ({ children }) => {
  const { pathname } = useLocation();
  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {!hideLayout && <AppBarTop />}
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

function AppRoutes() {
  return (
    <AppLayout>
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <FirestoreProvider>
          <AppRoutes />
          <InstallPrompt /> {/* <-- Insert custom install prompt here */}
          <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </FirestoreProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

