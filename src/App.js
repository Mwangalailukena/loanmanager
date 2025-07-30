// src/App.js
import React, { useState, useEffect, useRef } from 'react';
// These Material-UI imports are no longer needed here as your CustomThemeProvider handles them internally
// import { ThemeProvider, createTheme } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router } from 'react-router-dom';

import { ThemeProvider as CustomThemeProvider, useThemeContext } from './contexts/ThemeProvider.jsx';

import { FirestoreProvider } from './contexts/FirestoreProvider';
import { AuthProvider } from './contexts/AuthProvider';

import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useOfflineStatus from './hooks/useOfflineStatus';

// Import the SplashScreen component
import SplashScreen from './components/SplashScreen'; // Make sure this path is correct

// Import the syncPendingData function to sync offline queued data (both loans and payments)
import { syncPendingData } from './utils/offlineQueue';

// Define the total duration for the splash screen in milliseconds
const SPLASH_SCREEN_DURATION = 3000; // 3 seconds (adjust as needed)

// This component is created to properly use React Hooks (like useThemeContext)
// as it will be rendered *inside* your CustomThemeProvider.
function AppContent() {
  // Get the darkMode state and the toggleDarkMode function from your custom theme context.
  const { darkMode, toggleDarkMode } = useThemeContext();
  // Use your custom hook to monitor online/offline status.
  const isOnline = useOfflineStatus();

  // Ref to prevent multiple syncs at once
  const syncInProgress = useRef(false);

  // Effect hook to display toast notifications based on online/offline status and sync data
  useEffect(() => {
    if (!isOnline) {
      toast.warn("You're offline. Changes will sync once you're back online.", {
        toastId: 'offline-warning',
        position: "top-center",
      });
    } else {
      // Dismiss offline warning toast if active
      if (toast.isActive('offline-warning')) {
        toast.dismiss('offline-warning');
      }

      // Only start syncing if no sync is currently running
      if (!syncInProgress.current) {
        syncInProgress.current = true;

        toast.success("You're back online. Syncing data...", {
          toastId: 'online-success',
          position: "top-center",
        });

        syncPendingData()
          .then(() => {
            toast.success("Offline data synced successfully!", { toastId: 'sync-success' });
          })
          .catch((err) => {
            console.error("Failed to sync offline data:", err);
            toast.error("Failed to sync offline data. Please try again.", { toastId: 'sync-fail' });
          })
          .finally(() => {
            syncInProgress.current = false;
          });
      }
    }
  }, [isOnline]);

  return (
    <Router>
      <AuthProvider>
        <FirestoreProvider>
          <AppRoutes darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
          <InstallPrompt />
          <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={darkMode ? 'dark' : 'light'}
          />
        </FirestoreProvider>
      </AuthProvider>
    </Router>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

  useEffect(() => {
    const loadAppContent = async () => {
      setTimeout(() => {
        setShowSplash(false);
      }, SPLASH_SCREEN_DURATION);
    };

    loadAppContent();
  }, []);

  const handleSplashFadeOutComplete = () => {
    setSplashAnimationFinished(true);
  };

  return (
    <>
      {showSplash && (
        <SplashScreen
          onFadeOutComplete={handleSplashFadeOutComplete}
          duration={SPLASH_SCREEN_DURATION}
        />
      )}

      {!showSplash && splashAnimationFinished && (
        <CustomThemeProvider>
          <AppContent />
        </CustomThemeProvider>
      )}
    </>
  );
}

export default App;

