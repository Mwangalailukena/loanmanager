import { getToken, onMessage, deleteToken } from "firebase/messaging";
import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { messaging, db, auth } from "../firebase";

const VAPID_KEY = process.env.REACT_APP_VAPID_KEY;

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
    if (!VAPID_KEY || VAPID_KEY === "YOUR_VAPID_PUBLIC_KEY") {
      console.error('VAPID Key is missing or default. Check your .env file.');
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
 * Deletes the current FCM token from Firestore and Firebase Messaging.
 * Should be called when the user logs out.
 */
export const deleteTokenFromFirestore = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      // 1. Remove from Firestore
      const tokenRef = doc(db, 'fcmTokens', currentToken);
      await deleteDoc(tokenRef);

      // 2. Remove from Firebase Messaging instance
      await deleteToken(messaging);
      
      console.log('FCM Token successfully removed.');
    }
  } catch (err) {
    console.error('Error deleting FCM token:', err);
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
