import React, { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router } from 'react-router-dom';

import { FirestoreProvider } from './contexts/FirestoreProvider';
import { AuthProvider } from './contexts/AuthProvider';

import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useOfflineStatus from './hooks/useOfflineStatus'; // 🔌 New Hook

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const isOnline = useOfflineStatus(); // 👀 Monitor connection

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
        },
      }),
    [darkMode]
  );

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // 🔔 Show toast based on online/offline state
  useEffect(() => {
    if (!isOnline) {
      toast.warn("You're offline. Changes will sync once you're back online.", {
        toastId: 'offline-warning',
      });
    } else {
      toast.dismiss('offline-warning');
      toast.success("You're back online. Syncing data...", {
        toastId: 'online-success',
      });
    }
  }, [isOnline]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
    </ThemeProvider>
  );
}

export default App;

