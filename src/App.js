import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import { useThemeContext } from './contexts/ThemeProvider.jsx';
import { FirestoreProvider } from './contexts/FirestoreProvider';
import { AuthProvider } from './contexts/AuthProvider';

import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useOfflineStatus from './hooks/useOfflineStatus';
import { syncPendingData } from './utils/offlineQueue';

function AppContent() {
  const { darkMode, toggleDarkMode } = useThemeContext();
  const isOnline = useOfflineStatus(1000);
  const syncInProgress = useRef(false);
  const wasOffline = useRef(false);
  const syncExecutedOnce = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      syncExecutedOnce.current = false;
      
      toast.warn("You're offline. Changes will sync once you're back online.", {
        toastId: 'offline-warning',
        position: "top-center",
        autoClose: false,
      });
    } else if (isOnline && wasOffline.current) {
      if (toast.isActive('offline-warning')) {
        toast.dismiss('offline-warning');
      }

      if (!syncExecutedOnce.current) {
        syncExecutedOnce.current = true;
        wasOffline.current = false;

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
            autoClose={3000}
            hideProgressBar
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={darkMode ? "dark" : "light"}
            toastStyle={{
              borderRadius: "15px",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              fontWeight: "500",
              fontSize: "0.85rem",
              padding: "12px 20px",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
              background: "rgba(255, 255, 255, 0.12)", // translucent white for glass
              color: "#ffffff",
              userSelect: "none",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              WebkitBackdropFilter: "blur(10px)",
            }}
            bodyClassName="toast-body"
          />

          <style>{`
            /* Fade in and fade out with opacity and slight vertical movement */
            .Toastify__toast {
              opacity: 0;
              transform: translateY(-10px);
              animation: toastFadeIn 0.4s forwards;
            }
            .Toastify__toast--exit {
              opacity: 0 !important;
              transform: translateY(-10px) !important;
              transition: opacity 0.4s ease, transform 0.4s ease;
            }

            @keyframes toastFadeIn {
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            /* Close button styling */
            .Toastify__close-button {
              color: #ddd;
              opacity: 0.7;
              transition: opacity 0.2s;
            }
            .Toastify__close-button:hover {
              opacity: 1;
            }

            /* Smaller icons */
            .Toastify__toast-icon svg {
              width: 18px;
              height: 18px;
            }
          `}</style>
        </FirestoreProvider>
      </AuthProvider>
    </Router>
  );
}

export default AppContent;

