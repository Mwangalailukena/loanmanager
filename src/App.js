// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import { ThemeProvider as CustomThemeProvider, useThemeContext } from './contexts/ThemeProvider.jsx';

import { FirestoreProvider } from './contexts/FirestoreProvider';
import { AuthProvider } from './contexts/AuthProvider';

import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useOfflineStatus from './hooks/useOfflineStatus'; // Make sure this path is correct

import SplashScreen from './components/SplashScreen';
import { syncPendingData } from './utils/offlineQueue';

const SPLASH_SCREEN_DURATION = 3000;

function AppContent() {
  const { darkMode, toggleDarkMode } = useThemeContext();
  // Use the debounced hook, e.g., with 1000ms (1 second) debounce time.
  // You can adjust this value to find the sweet spot for your app's network conditions.
  const isOnline = useOfflineStatus(1000); // <--- CHANGE THIS LINE

  const syncInProgress = useRef(false);

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

        // Give this "syncing..." toast a specific ID and keep it open
        toast.success("You're back online. Syncing data...", {
          toastId: 'sync-starting', // New ID for the "syncing..." message
          position: "top-center",
          autoClose: false, // Keep it open until sync finishes
        });

        syncPendingData()
          .then(() => {
            toast.dismiss('sync-starting'); // Dismiss the "syncing..." toast on success
            toast.success("Offline data synced successfully!", { toastId: 'sync-success' });
          })
          .catch((err) => {
            console.error("Failed to sync offline data:", err);
            toast.dismiss('sync-starting'); // Dismiss the "syncing..." toast on error
            toast.error("Failed to sync offline data. Please try again.", { toastId: 'sync-fail' });
          })
          .finally(() => {
            syncInProgress.current = false;
          });
      }
    }
  }, [isOnline]); // This now uses the *debounced* `isOnline` state

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
