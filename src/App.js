import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import AppThemeProvider from './contexts/ThemeProvider.jsx';
import { useThemeContext } from './contexts/ThemeProvider.jsx';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import { FirestoreProvider } from './contexts/FirestoreProvider';

import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/SplashScreen';
import NetworkStatus from './components/NetworkStatus';

function App() {
  const { darkMode, onToggleDarkMode } = useThemeContext();
  const { loading } = useAuth(); // Get the loading state from the AuthProvider

  // Conditional rendering based on the loading state
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <FirestoreProvider>
        <NetworkStatus />
        <AppRoutes darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
        <InstallPrompt />
      </FirestoreProvider>
    </Router>
  );
}

// Wrap the App component with the necessary providers at the top level
const AppWithProviders = () => (
  <AppThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </AppThemeProvider>
);

export default AppWithProviders;
