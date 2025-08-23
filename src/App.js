import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
// ... (other imports)

import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/SplashScreen'; // The new component
import NetworkStatus from './components/NetworkStatus';

import { ToastContainer } from 'react-toastify';

function App() {
  const { darkMode, onToggleDarkMode } = useThemeContext();
  const { loading } = useAuth(); // Get the loading state

  return (
    <>
      {/* Pass the loading state to the SplashScreen */}
      {loading && <SplashScreen isLoaded={!loading} />}

      {!loading && (
        <Router>
          <FirestoreProvider>
            <NetworkStatus />
            <AppRoutes darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
            <InstallPrompt />
            <ToastContainer position="top-center" />
          </FirestoreProvider>
        </Router>
      )}
    </>
  );
}
// ... (AppWithProviders remains the same)
