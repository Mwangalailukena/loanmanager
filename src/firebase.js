// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJmjOEymW5xxgbhZEpWatOjSZx8byaFSY",
  authDomain: "ilukenas-loan-management.firebaseapp.com",
  projectId: "ilukenas-loan-management",
  storageBucket: "ilukenas-loan-management.appspot.com", // double-check this URL
  messagingSenderId: "714108438492",
  appId: "1:714108438492:web:6036fbfc93272f2aaeb119",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({}),
});

export default app;

