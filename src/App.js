import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import LoanList from './pages/LoanList';
import AddLoanForm from './pages/AddLoanForm';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import { FirestoreProvider } from './contexts/FirestoreProvider';
import { AuthProvider } from './contexts/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNavBar from './components/BottomNavBar';
import Sidebar from './components/Sidebar';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './App.css';

const Layout = ({ children }) => {
  const location = useLocation();

  const hideNav = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  return (
    <div style={{ display: 'flex' }}>
      {!hideNav && <Sidebar />}
      <main style={{ flexGrow: 1, paddingBottom: '56px' }}>
        {children}
      </main>
      {!hideNav && <BottomNavBar />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <FirestoreProvider>
        <Router>
          {/* Layout uses useLocation, so it must be inside Router */}
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/loans" element={<ProtectedRoute><LoanList /></ProtectedRoute>} />
              <Route path="/add-loan" element={<ProtectedRoute><AddLoanForm /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
          <ToastContainer position="bottom-center" />
        </Router>
      </FirestoreProvider>
    </AuthProvider>
  );
}

export default App;

