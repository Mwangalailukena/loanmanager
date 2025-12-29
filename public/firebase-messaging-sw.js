// Give the service worker access to Firebase SDKs
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
  apiKey: "AIzaSyBJmjOEymW5xxgbhZEpWatOjSZx8byaFSY",
  authDomain: "ilukenas-loan-management.firebaseapp.com",
  projectId: "ilukenas-loan-management",
  storageBucket: "ilukenas-loan-management.appspot.com",
  messagingSenderId: "714108438492",
  appId: "1:714108438492:web:6036fbfc93272f2aaeb119",
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging object.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});