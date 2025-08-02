import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import { useThemeContext } from './contexts/ThemeProvider.jsx';
import { FirestoreProvider } from './contexts/FirestoreProvider';
import { AuthProvider } from './contexts/AuthProvider';

import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/SplashScreen';

// Import the showToast function and ToastContainer
import { ToastContainer } from 'react-toastify';
import { showToast } from './components/toastConfig.js'; 

import useOfflineStatus from './hooks/useOfflineStatus';
import { syncPendingData } from './utils/offlineQueue';

function App() {
  const { darkMode, toggleDarkMode } = useThemeContext();
  const isOnline = useOfflineStatus(1000);
  const syncInProgress = useRef(false);
  const wasOffline = useRef(false);
  const syncExecutedOnce = useRef(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      syncExecutedOnce.current = false;
      // Use your new showToast function
      showToast("You're offline. Changes will sync once you're back online.", 'warning');
    } else if (isOnline && wasOffline.current) {
      if (!syncExecutedOnce.current) {
        syncExecutedOnce.current = true;
        wasOffline.current = false;

        if (!syncInProgress.current) {
          syncInProgress.current = true;
          // Use your new showToast function
          showToast("You're back online. Syncing data...", 'info');

          syncPendingData()
            .then(() => {
              // Use your new showToast function
              showToast("Offline data synced successfully!", 'success');
            })
            .catch((err) => {
              console.error("Failed to sync offline data:", err);
              // Use your new showToast function
              showToast("Failed to sync offline data. Please try again.", 'error');
            })
            .finally(() => {
              syncInProgress.current = false;
            });
        }
      }
    }
  }, [isOnline]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <AuthProvider>
        <FirestoreProvider>
          <AppRoutes darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
          <InstallPrompt />
          
          {/* Keep the ToastContainer, but remove the custom props */}
          <ToastContainer position="top-center" />
        </FirestoreProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
