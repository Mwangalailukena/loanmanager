// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBJmjOEymW5xxgbhZEpWatOjSZx8byaFSY",
  authDomain: "ilukenas-loan-management.firebaseapp.com",
  projectId: "ilukenas-loan-management",
  storageBucket: "ilukenas-loan-management.appspot.com",
  messagingSenderId: "714108438492",
  appId: "1:714108438492:web:6036fbfc93272f2aaeb119",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Initialize Firestore with persistent caching
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const messaging = getMessaging(app);

export default app;