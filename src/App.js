import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// Context Imports
import AppThemeProvider, { useThemeContext } from './contexts/ThemeProvider.jsx';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import { FirestoreProvider } from './contexts/FirestoreProvider';
import { SearchProvider } from './contexts/SearchContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { BorrowerProvider } from './contexts/BorrowerContext';

// Component Imports
import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/SplashScreen';
import NetworkStatus from './components/NetworkStatus';
import UpdateToast from './components/UpdateToast'; // Import the new component

function App() {
  const { darkMode, onToggleDarkMode } = useThemeContext();
  const { loading } = useAuth(); // currentUser is now available for sub-components

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <SettingsProvider>
      <BorrowerProvider>
        <FirestoreProvider>
          <Router>
            <NetworkStatus />
            <UpdateToast /> {/* Add the UpdateToast component here */}
            <SearchProvider>
              {/* Pass currentUser if AppRoutes needs it, otherwise it's fine as is */}
              <AppRoutes darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
            </SearchProvider>
            <InstallPrompt />
          </Router>
        </FirestoreProvider>
      </BorrowerProvider>
    </SettingsProvider>
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