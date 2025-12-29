import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { getMessaging, getToken, onMessage } from "firebase/messaging"; // Import FCM functions
import firebaseApp from './firebase'; // Ensure correct import of firebaseApp

import AppThemeProvider from './contexts/ThemeProvider.jsx';
import { useThemeContext } from './contexts/ThemeProvider.jsx';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import { FirestoreProvider, useFirestore } from './contexts/FirestoreProvider'; // Import useFirestore

import AppRoutes from './AppRoutes';
import InstallPrompt from './components/InstallPrompt';
import SplashScreen from './components/SplashScreen';
import NetworkStatus from './components/NetworkStatus';
import OfflineQueueProcessor from './components/OfflineQueueProcessor';

import { SearchProvider } from './contexts/SearchContext';

function App() {
  const { darkMode, onToggleDarkMode } = useThemeContext();
  const { currentUser, loading } = useAuth(); // Get currentUser from AuthProvider
  const { saveFCMTokenToFirestore } = useFirestore(); // Get saveFCMTokenToFirestore from FirestoreProvider

  useEffect(() => {
    if (loading || !currentUser) {
      // Don't try to get FCM token until user is loaded and authenticated
      return;
    }

    const getFCMToken = async () => {
      try {
        const messaging = getMessaging(firebaseApp);
        const currentToken = await getToken(messaging, { vapidKey: "BGowCFISFwFkhKJ2OfwwFNuk8--Sh4ThvuQwZpAwczyy2eakjo826snhYGrMmmA2MX371ykECPVbqB_zNeM-BoE" }); // Use the actual FCM VAPID Key

        if (currentToken) {
          console.log('FCM token:', currentToken);
          await saveFCMTokenToFirestore(currentToken); // Save token to Firestore
        } else {
          console.log('No FCM registration token available. Requesting permission...');
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              console.log('Notification permission granted.');
              getFCMToken(); // Retry getting token after permission is granted
            } else {
              console.log('Unable to get permission to notify.');
            }
          });
        }

        onMessage(messaging, (payload) => {
          console.log('Message received. ', payload);
          const notificationTitle = payload.notification.title;
          const notificationOptions = {
            body: payload.notification.body,
            icon: '/logo192.png',
          };
          if (Notification.permission === 'granted') {
            new Notification(notificationTitle, notificationOptions);
          }
        });

      } catch (err) {
        console.error('An error occurred while retrieving token:', err);
      }
    };

    getFCMToken();
  }, [currentUser, loading, saveFCMTokenToFirestore]); // Dependencies for useEffect

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <FirestoreProvider>
        <NetworkStatus />
        <OfflineQueueProcessor />
        <SearchProvider>
          <AppRoutes darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
        </SearchProvider>
        <InstallPrompt />
      </FirestoreProvider>
    </Router>
  );
}

// Wrap the App component with the necessary providers at the top level
const AppWithProviders = () => (
  <AppThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </AppThemeProvider>
);

export default AppWithProviders;
