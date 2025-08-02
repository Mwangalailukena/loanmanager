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

function App() {
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
        autoClose: true,
      });
    } else if (isOnline && wasOffline.current) {
      if (toast.isActive('offline-warning')) toast.dismiss('offline-warning');

      if (!syncExecutedOnce.current) {
        syncExecutedOnce.current = true;
        wasOffline.current = false;

        if (!syncInProgress.current) {
          syncInProgress.current = true;

          toast.success("You're back online. Syncing data...", {
            toastId: 'sync-starting',
            position: "top-center",
            autoClose: true,
          });

          syncPendingData()
            .then(() => {
              toast.dismiss('sync-starting');
              toast.success("Offline data synced successfully!", {
                toastId: 'sync-success'
              });
            })
            .catch((err) => {
              console.error("Failed to sync offline data:", err);
              toast.dismiss('sync-starting');
              toast.error("Failed to sync offline data. Please try again.", {
                toastId: 'sync-fail'
              });
            })
            .finally(() => {
              syncInProgress.current = false;
            });
        }
      }
    }

    // Cleanup on unmount
    return () => {
      toast.dismiss('offline-warning');
      toast.dismiss('sync-starting');
      toast.dismiss('sync-success');
      toast.dismiss('sync-fail');
    };
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
            closeOnClick={true}
            pauseOnHover={false}
            draggable={false}
            newestOnTop
            toastStyle={{
              background: "#111",
              color: "#f0f0f0",
              borderRadius: "10px",
              fontSize: "0.8rem",
              fontFamily: "'Segoe UI', sans-serif",
              padding: "10px 16px",
              minHeight: "auto",
              width: "fit-content",
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
            }}
            bodyClassName="custom-toast-body"
          />

          <style>{`
            .Toastify__toast {
              animation: fadeInOut 3s ease-in-out;
            }

            @keyframes fadeInOut {
              0% { opacity: 0; transform: translateY(-10px); }
              10% { opacity: 1; transform: translateY(0); }
              90% { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-10px); }
            }

            .Toastify__close-button {
              display: none;
            }

            .custom-toast-body {
              padding: 0;
              margin: 0;
            }

            .Toastify__toast-icon svg {
              width: 16px;
              height: 16px;
            }
          `}</style>
        </FirestoreProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

