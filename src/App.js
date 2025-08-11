import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import AppThemeProvider from './contexts/ThemeProvider.jsx';
import { useThemeContext } from './contexts/ThemeProvider.jsx';
import { FirestoreProvider } from './contexts/FirestoreProvider';
import { AuthProvider } from './contexts/AuthProvider';

import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/SplashScreen';

import { ToastContainer } from 'react-toastify';

import NetworkStatus from './components/NetworkStatus';

function App() {
  const { darkMode, onToggleDarkMode } = useThemeContext();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(splashTimeout);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <AuthProvider>
        <FirestoreProvider>
          <NetworkStatus />
          <AppRoutes darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
          <InstallPrompt />
          
          {/* Keep the ToastContainer, but remove the custom props */}
          <ToastContainer position="top-center" />
        </FirestoreProvider>
      </AuthProvider>
    </Router>
  );
}

// Wrap the App component with the AppThemeProvider at the top level
const AppWithProviders = () => (
  <AppThemeProvider>
    <App />
  </AppThemeProvider>
);

export default AppWithProviders;
