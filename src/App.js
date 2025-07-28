import React, { useState, useEffect } from 'react';
// These Material-UI imports are no longer needed here as your CustomThemeProvider handles them internally
// import { ThemeProvider, createTheme } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router } from 'react-router-dom';

// Import your custom ThemeProvider and useThemeContext from the correct file path.
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

// Define the total duration for the splash screen in milliseconds
const SPLASH_SCREEN_DURATION = 3000; // 3 seconds (adjust as needed)

// This component is created to properly use React Hooks (like useThemeContext)
// as it will be rendered *inside* your CustomThemeProvider.
function AppContent() {
  // Get the darkMode state and the toggleDarkMode function from your custom theme context.
  const { darkMode, toggleDarkMode } = useThemeContext();
  // Use your custom hook to monitor online/offline status.
  const isOnline = useOfflineStatus();

  // Effect hook to display toast notifications based on online/offline status.
  useEffect(() => {
    if (!isOnline) {
      toast.warn("You're offline. Changes will sync once you're back online.", {
        toastId: 'offline-warning', // Use a unique ID to manage this specific toast
        position: "top-center", // Position the toast at the top center of the screen
      });
    } else {
      // Dismiss the offline warning when back online
      toast.dismiss('offline-warning');
      toast.success("You're back online. Syncing data...", {
        toastId: 'online-success', // Use a unique ID for the online success toast
        position: "top-center",
      });
    }
  }, [isOnline]); // Re-run this effect when the online status changes

  return (
    // Set up the router for navigation within your application.
    <Router>
      {/* Provide authentication context to the components below. */}
      <AuthProvider>
        {/* Provide Firestore database context to the components below. */}
        <FirestoreProvider>
          {/* Render your application's routes.
              Pass darkMode and onToggleDarkMode (which is toggleDarkMode from context)
              down to AppRoutes if it needs to pass them further down (e.g., to AppLayout). */}
          <AppRoutes darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
          {/* Render the PWA install prompt component. */}
          <InstallPrompt />
          {/* Configure the Toast notification container. */}
          <ToastContainer
            position="top-center" // Position of all toasts
            autoClose={5000} // Toasts close automatically after 5 seconds
            hideProgressBar={false} // Show progress bar
            newestOnTop // New toasts appear on top of old ones
            closeOnClick // Close toast when clicked
            rtl={false} // Right-to-left layout not enabled
            pauseOnFocusLoss // Pause autoClose when window loses focus
            draggable // Allow toasts to be dragged
            pauseOnHover // Pause autoClose when mouse hovers over toast
            theme={darkMode ? 'dark' : 'light'} // Apply dark or light theme to toasts based on app's theme
          />
        </FirestoreProvider>
      </AuthProvider>
    </Router>
  );
}

// This is your root App component.
function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

  useEffect(() => {
    // Simulate any initial data loading or authentication here.
    // Replace this setTimeout with your actual app initialization logic (e.g., API calls, Firebase init).
    // The total time of this timeout should roughly match SPLASH_SCREEN_DURATION.
    const loadAppContent = async () => {
      // Example: Simulate an async operation like loading user data or configs
      // await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate 1.5s of actual loading
      // console.log("App content data loaded.");

      // Ensure the splash screen is shown for at least SPLASH_SCREEN_DURATION
      setTimeout(() => {
        setShowSplash(false);
      }, SPLASH_SCREEN_DURATION);
    };

    loadAppContent();
  }, []); // Run once on component mount

  // This callback is triggered when the CSS fade-out animation of the splash screen completes
  const handleSplashFadeOutComplete = () => {
    setSplashAnimationFinished(true);
  };

  return (
    <>
      {showSplash && (
        <SplashScreen
          onFadeOutComplete={handleSplashFadeOutComplete}
          duration={SPLASH_SCREEN_DURATION} // Pass duration to SplashScreen for progress bar
        />
      )}

      {/* Only render the main app content if splash screen is no longer shown
          AND its fade-out animation has completed.
          Wrap your CustomThemeProvider here to ensure it applies to AppContent. */}
      {!showSplash && splashAnimationFinished && (
        <CustomThemeProvider>
          <AppContent /> {/* Render the rest of your application inside the theme provider */}
        </CustomThemeProvider>
      )}
    </>
  );
}

export default App;
