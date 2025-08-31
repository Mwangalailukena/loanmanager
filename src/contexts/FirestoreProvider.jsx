// src/contexts/FirestoreProvider.js

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  where,
  serverTimestamp,
  getDoc, // Added getDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";
import { useSnackbar } from "../components/SnackbarProvider";
import localforage from "localforage";
import useOfflineStatus from "../hooks/useOfflineStatus";


const FirestoreContext = createContext();
export const useFirestore = () => useContext(FirestoreContext);

export function FirestoreProvider({ children }) {
  const { currentUser } = useAuth();
  const showSnackbar = useSnackbar();
  const isOnline = useOfflineStatus();

  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  const [settings, setSettings] = useState({
    initialCapital: 50000,
    interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 },
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [guarantors, setGuarantors] = useState([]);
  const [loading, setLoading] = useState(true);

  const addActivityLog = async (logEntry) => {
    if (!currentUser) return;
    await addDoc(collection(db, "activityLogs"), {
      ...logEntry,
      userId: currentUser.uid,
      user: currentUser?.displayName || currentUser?.email || "System",
      createdAt: serverTimestamp(),
    });
  };

  const addBorrower = async (borrower) => {
    const borrowerWithOwner = {
      ...borrower,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "borrowers"), borrowerWithOwner);
    await addActivityLog({ type: "borrower_creation", description: `Borrower created: ${borrower.name}` });
    return docRef;
  };

  const updateBorrower = async (id, updates) => {
    const docRef = doc(db, "borrowers", id);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    await addActivityLog({ type: "borrower_update", description: `Borrower updated (ID: ${id})` });
  };

  const deleteBorrower = async (id) => {
    await deleteDoc(doc(db, "borrowers", id));
    setBorrowers((prev) => prev.filter((b) => b.id !== id));
    await addActivityLog({ type: "borrower_delete", description: `Borrower deleted (ID: ${id})` });
  };

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // ... (loadOfflineData remains the same)

    if (!isOnline) {
      // ... (loadOfflineData call remains the same)
      return;
    }

    setLoading(true);
    const unsubscribes = [];
    const dbRef = db;

    // --- Listeners ---
    const collections = {
      loans: { setter: setLoans, cacheKey: "loans", orderByField: "startDate" },
      payments: { setter: setPayments, cacheKey: "payments", orderByField: "date" },
      borrowers: { setter: setBorrowers, cacheKey: "borrowers", orderByField: "name" },
      activityLogs: { setter: setActivityLogs, cacheKey: null, orderByField: "createdAt" },
      comments: { setter: setComments, cacheKey: null, orderByField: "createdAt" },
      guarantors: { setter: setGuarantors, cacheKey: null, orderByField: "name" },
    };

    Object.entries(collections).forEach(([col, config]) => {
      const q = query(collection(dbRef, col), where("userId", "==", currentUser.uid), orderBy(config.orderByField, "desc"));
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        config.setter(data);
        if (config.cacheKey) {
          localforage.setItem(config.cacheKey, data);
        }
      }, (error) => console.error(`Error fetching ${col}:`, error));
      unsubscribes.push(unsub);
    });
    
    const settingsUnsub = onSnapshot(doc(dbRef, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data());
    });
    unsubscribes.push(settingsUnsub);

    setLoading(false);

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [currentUser, isOnline, showSnackbar]);

  const addLoan = async (loan) => {
    const loanWithMeta = { ...loan, userId: currentUser.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, "loans"), loanWithMeta);
    await addActivityLog({ type: "loan_creation", description: `Loan added for borrower ID ${loan.borrowerId}` });
    return docRef;
  };

  const updateLoan = async (id, updates) => {
    const docRef = doc(db, "loans", id);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    await addActivityLog({ type: "edit", description: `Loan updated (ID: ${id})` });
  };

  const deleteLoan = async (id) => {
    await deleteDoc(doc(db, "loans", id));
    await addActivityLog({ type: "delete", description: `Loan deleted (ID: ${id})` });
  };

  const addComment = async (borrowerId, text) => {
    if (!currentUser) return;
    await addDoc(collection(db, "comments"), { borrowerId, text, userId: currentUser.uid, createdAt: serverTimestamp() });
    await addActivityLog({ type: "comment_add", description: `Comment added to borrower ID ${borrowerId}` });
  };

  const deleteComment = async (id) => {
    await deleteDoc(doc(db, "comments", id));
    setComments((prev) => prev.filter((c) => c.id !== id));
    await addActivityLog({ type: "comment_delete", description: `Comment deleted (ID: ${id})` });
  };

  const addGuarantor = async (guarantor) => {
    const guarantorWithOwner = { ...guarantor, userId: currentUser.uid, createdAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, "guarantors"), guarantorWithOwner);
    await addActivityLog({ type: "guarantor_add", description: `Guarantor ${guarantor.name} added for borrower ID ${guarantor.borrowerId}` });
    return docRef;
  };

  const updateGuarantor = async (id, updates) => {
    const docRef = doc(db, "guarantors", id);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    await addActivityLog({ type: "guarantor_update", description: `Guarantor updated (ID: ${id})` });
  };

  const deleteGuarantor = async (id) => {
    await deleteDoc(doc(db, "guarantors", id));
    setGuarantors((prev) => prev.filter((g) => g.id !== id));
    await addActivityLog({ type: "guarantor_delete", description: `Guarantor deleted (ID: ${id})` });
  };

  const addPayment = async (loanId, amount) => {
    if (!currentUser) return;

    const loanRef = doc(db, "loans", loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
      console.error("Loan not found for payment:", loanId);
      throw new Error("Loan not found.");
    }

    const loanData = loanSnap.data();
    const newRepaidAmount = (loanData.repaidAmount || 0) + amount;

    // 1. Add new payment record
    await addDoc(collection(db, "payments"), {
      loanId,
      amount,
      date: serverTimestamp(),
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
    });

    // 2. Update the loan's repaidAmount
    await updateDoc(loanRef, {
      repaidAmount: newRepaidAmount,
      updatedAt: serverTimestamp(),
    });

    // 3. Add activity log
    await addActivityLog({
      type: "payment_add",
      description: `Payment of ZMW ${amount.toFixed(2)} added to loan ID ${loanId}`,
    });
  };

  const getPaymentsByLoanId = async (loanId) => {
    // ... (getPaymentsByLoanId implementation remains the same)
  };

  const updateSettings = async (newSettings) => {
    // ... (updateSettings implementation remains the same)
  };

  const value = {
    loans, payments, borrowers, settings, activityLogs, comments, guarantors, loading,
    addLoan, updateLoan, deleteLoan,
    addPayment, getPaymentsByLoanId,
    updateSettings, addActivityLog,
    addBorrower, updateBorrower, deleteBorrower,
    addComment, deleteComment,
    addGuarantor, updateGuarantor, deleteGuarantor,
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}