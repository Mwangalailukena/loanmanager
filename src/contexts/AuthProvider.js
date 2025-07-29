// src/contexts/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile, // <-- Import updateProfile
} from 'firebase/auth';
import { getStorage } from 'firebase/storage'; // Import getStorage
import app from '../firebase'; // Assuming 'app' is your initialized Firebase app

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const auth = getAuth(app);
  // Optional: If you need a direct storage instance here, though typically passed to components
  // const storage = getStorage(app); 

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // MODIFIED REGISTER FUNCTION TO HANDLE NAME
  const register = async (name, email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // After user is created, update their profile with the display name
      await updateProfile(user, {
        displayName: name,
      });

      // Update the currentUser state in the context immediately with the new display name
      setCurrentUser({ ...user, displayName: name }); // Ensure state reflects new name

      return userCredential; // Return the user credential for further handling if needed
    } catch (error) {
      // Re-throw the error so calling components (e.g., Register.jsx) can catch it
      throw error;
    }
  };

  const loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const logout = () => signOut(auth);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      // Reloading doesn't automatically update the 'user' object from onAuthStateChanged
      // So, manually update the state from the reloaded current user.
      setCurrentUser({ ...auth.currentUser });
    }
    // Return a promise for consistent API if awaited
    return Promise.resolve();
  };

  const value = {
    currentUser,
    login,
    register,
    loginWithGoogle,
    resetPassword,
    logout,
    refreshUser,
    // You could expose storage here if needed directly from context
    // storage,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
