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
import UpdateToast from './components/UpdateToast'; // Import the new component

function App() {
  const { darkMode, onToggleDarkMode } = useThemeContext();
  const { loading } = useAuth(); // currentUser is now available for sub-components

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <FirestoreProvider>
      <Router>
        <NetworkStatus />
        <OfflineQueueProcessor />
        <UpdateToast /> {/* Add the UpdateToast component here */}
        <SearchProvider>
          {/* Pass currentUser if AppRoutes needs it, otherwise it's fine as is */}
          <AppRoutes darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
        </SearchProvider>
        <InstallPrompt />
      </Router>
    </FirestoreProvider>
  );
}

// This is the component your index.js is likely trying to import
const AppWithProviders = () => (
  <AppThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </AppThemeProvider>
);

// This fixes the "does not contain a default export" error
export default AppWithProviders;