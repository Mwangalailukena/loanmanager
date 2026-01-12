import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { messaging, db, auth } from "../firebase";

// IMPORTANT: Replace this with the VAPID key from your Firebase project settings.
const VAPID_KEY = "BCSVuLFfJvnlwgba2EK1HejWcNn0M2_NvCI2WC_dmy9a-orAHWjpKVu_VtG7yKB957dJTwf4avDYxA5ZTqElXy0";

/**
 * Requests permission to show notifications and saves the token to Firestore.
 * @returns {Promise<string|null>} The FCM token or null if permission is denied.
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.error("This browser does not support desktop notification.");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    return await saveTokenToFirestore();
  }
  
  return null;
};

/**
 * Retrieves the current FCM token and saves it to Firestore.
 * @returns {Promise<string|null>} The FCM token or null on error.
 */
const saveTokenToFirestore = async () => {
  try {
    if (VAPID_KEY.includes('YOUR_VAPID_PUBLIC_KEY')) {
      console.error('VAPID Key is a placeholder. Push notifications will not work.');
      return null;
    }
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported.');
      return null;
    }
    const registration = await navigator.serviceWorker.ready;
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      const user = auth.currentUser;
      if (!user) {
        console.warn('Cannot save FCM token. User is not authenticated.');
        return null;
      }

      const tokenRef = doc(db, 'fcmTokens', currentToken);

      await setDoc(
        tokenRef,
        {
          userId: user.uid,
          token: currentToken,
          createdAt: serverTimestamp(),
          userAgent: navigator.userAgent,
        },
        { merge: true }
      );

      return currentToken;
    }

    console.warn(
      'No registration token available. Request permission to generate one.'
    );
    return null;
  } catch (err) {
    console.error('An error occurred while retrieving token.', err);
    return null;
  }
};

/**
 * Listens for messages that are received while the app is in the foreground.
 * @param {function} callback - The function to call with the message payload.
 * @returns {function} Unsubscribe function.
 */
export const onForegroundMessage = (callback) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
