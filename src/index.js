import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppThemeProvider from './contexts/ThemeProvider';
import { SnackbarProvider } from './components/SnackbarProvider';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import firebaseApp from './firebase'; // Import the firebase app instance

const root = ReactDOM.createRoot(document.getElementById('root'));

// Function to get FCM token
async function getFCMToken() {
  try {
    const messaging = getMessaging(firebaseApp);
    const currentToken = await getToken(messaging, { vapidKey: "BGowCFISFwFkhKJ2OfwwFNuk8--Sh4ThvuQwZpAwczyy2eakjo826snhYGrMmmA2MX371ykECPVbqB_zNeM-BoE" }); // Replace with your FCM VAPID Key

    if (currentToken) {
      console.log('FCM token:', currentToken);
      // Here, you would typically save this token to your Firestore database
      // associated with the currently logged-in user.
      // This will be implemented in a later step once user context is available.
    } else {
      console.log('No FCM registration token available. Requesting permission...');
      // Request permission
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          getFCMToken(); // Retry getting token after permission is granted
        } else {
          console.log('Unable to get permission to notify.');
        }
      });
    }

    // Handle incoming messages while the app is in the foreground
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // Customize notification display here
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png', // Or a custom icon
      };
      if (Notification.permission === 'granted') {
        new Notification(notificationTitle, notificationOptions);
      }
    });

  } catch (err) {
    console.error('An error occurred while retrieving token:', err);
  }
}

// Call the function to get FCM token (e.g., when the app starts)
// This should ideally be called after user authentication to associate with a user ID.
getFCMToken();

root.render(
  <React.StrictMode>
    <SnackbarProvider>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </SnackbarProvider>
  </React.StrictMode>
);

serviceWorkerRegistration.register();
