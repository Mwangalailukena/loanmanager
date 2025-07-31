import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import { ThemeProvider as CustomThemeProvider, useThemeContext } from './contexts/ThemeProvider.jsx';

import { FirestoreProvider } from './contexts/FirestoreProvider';
import { AuthProvider } from './contexts/AuthProvider';

import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useOfflineStatus from './hooks/useOfflineStatus';

import SplashScreen from './components/SplashScreen';
import { syncPendingData } from './utils/offlineQueue';

const SPLASH_SCREEN_DURATION = 3000;

function AppContent() {
  const { darkMode, toggleDarkMode } = useThemeContext();
  const isOnline = useOfflineStatus(1000);
  const syncInProgress = useRef(false);
  const wasOffline = useRef(false);
  const syncExecutedOnce = useRef(false);

  useEffect(() => {
    // If we've just gone offline
    if (!isOnline) {
      wasOffline.current = true;
      syncExecutedOnce.current = false; // Reset the flag when we go offline
      
      toast.warn("You're offline. Changes will sync once you're back online.", {
        toastId: 'offline-warning',
        position: "top-center",
        autoClose: false,
      });
    } 
    // If we've just come back online AND we were previously offline
    else if (isOnline && wasOffline.current) {
      // Dismiss the offline warning toast
      if (toast.isActive('offline-warning')) {
        toast.dismiss('offline-warning');
      }

      // Check if sync has already been executed for this offline-online cycle
      if (!syncExecutedOnce.current) {
        syncExecutedOnce.current = true; // Set the flag to prevent re-execution
        wasOffline.current = false; // Reset wasOffline flag after sync is handled

        // Now, proceed with the sync logic
        if (!syncInProgress.current) {
            syncInProgress.current = true;
            toast.success("You're back online. Syncing data...", {
                toastId: 'sync-starting',
                position: "top-center",
                autoClose: false,
            });

            syncPendingData()
                .then(() => {
                    toast.dismiss('sync-starting');
                    toast.success("Offline data synced successfully!", { toastId: 'sync-success' });
                })
                .catch((err) => {
                    console.error("Failed to sync offline data:", err);
                    toast.dismiss('sync-starting');
                    toast.error("Failed to sync offline data. Please try again.", { toastId: 'sync-fail' });
                })
                .finally(() => {
                    syncInProgress.current = false;
                });
        }
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
