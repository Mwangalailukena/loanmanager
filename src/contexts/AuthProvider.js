// src/contexts/authProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,  // <-- import this
} from 'firebase/auth';
import app from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const auth = getAuth(app);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  // Login with email/password
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // Register new user with email/password
  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);

  // Login with Google
  const loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());

  // Send reset password email
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // Logout
  const logout = () => signOut(auth);

  const value = {
    currentUser,
    login,
    register,           // <-- add register here
    loginWithGoogle,
    resetPassword,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

