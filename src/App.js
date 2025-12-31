import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// Context Imports
import AppThemeProvider, { useThemeContext } from './contexts/ThemeProvider.jsx';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import { FirestoreProvider } from './contexts/FirestoreProvider';
import { SearchProvider } from './contexts/SearchContext';

// Component Imports
import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/SplashScreen';
import NetworkStatus from './components/NetworkStatus';
import OfflineQueueProcessor from './components/OfflineQueueProcessor';

function App() {
  const { darkMode, onToggleDarkMode } = useThemeContext();
  const { loading } = useAuth(); // currentUser is now available for sub-components

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <NetworkStatus />
      <OfflineQueueProcessor />
      <SearchProvider>
        {/* Pass currentUser if AppRoutes needs it, otherwise it's fine as is */}
        <AppRoutes darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
      </SearchProvider>
      <InstallPrompt />
    </Router>
  );
}

// This is the component your index.js is likely trying to import
const AppWithProviders = () => (
  <AppThemeProvider>
    <AuthProvider>
      <FirestoreProvider>
        <App />
      </FirestoreProvider>
    </AuthProvider>
  </AppThemeProvider>
);

// This fixes the "does not contain a default export" error
export default AppWithProviders;