// seedSettings.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Use your existing Firebase config here (copy from src/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyBJmjOEymW5xxgbhZEpWatOjSZx8byaFSY",
  authDomain: "ilukenas-loan-management.firebaseapp.com",
  projectId: "ilukenas-loan-management",
  storageBucket: "ilukenas-loan-management.firebasestorage.app",
  messagingSenderId: "714108438492",
  appId: "1:714108438492:web:6036fbfc93272f2aaeb119"
};

async function seedSettings() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const settingsRef = doc(db, "settings", "config");

  const data = {
    investedCapital: 50000,
    interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 },
  };

  try {
    await setDoc(settingsRef, data);
    console.log("Settings document created/updated successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error creating settings document:", error);
    process.exit(1);
  }
}

seedSettings();

