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
  updateProfile,
} from 'firebase/auth';
import app from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const auth = getAuth(app);

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener runs once when the component mounts and
    // whenever the user's sign-in state changes.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Set to false once the initial check is complete
    });
    return () => unsubscribe();
  }, [auth]);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const register = async (name, email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      setCurrentUser({ ...user, displayName: name });
      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    // Adding custom parameters can sometimes help with popup behavior
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const logout = () => signOut(auth);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setCurrentUser({ ...auth.currentUser });
    }
    return Promise.resolve();
  };

  const value = {
    currentUser,
    loading, // Expose the loading state
    login,
    register,
    loginWithGoogle,
    resetPassword,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
