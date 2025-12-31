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
  getDoc,
  runTransaction,
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

  // --- State ---
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
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Helpers ---
  const addActivityLog = async (logEntry) => {
    if (!currentUser) return;
    await addDoc(collection(db, "activityLogs"), {
      ...logEntry,
      userId: currentUser.uid,
      user: currentUser?.displayName || currentUser?.email || "System",
      createdAt: serverTimestamp(),
    });
  };

  // --- Data Fetching (Real-time Listeners) ---
  useEffect(() => {
    if (!currentUser || !isOnline) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribes = [];
    const collectionsConfig = {
      loans: { setter: setLoans, cacheKey: "loans", orderByField: "startDate" },
      payments: { setter: setPayments, cacheKey: "payments", orderByField: "date" },
      borrowers: { setter: setBorrowers, cacheKey: "borrowers", orderByField: "name" },
      activityLogs: { setter: setActivityLogs, cacheKey: null, orderByField: "createdAt" },
      comments: { setter: setComments, cacheKey: null, orderByField: "createdAt" },
      guarantors: { setter: setGuarantors, cacheKey: null, orderByField: "name" },
      expenses: { setter: setExpenses, cacheKey: "expenses", orderByField: "date" },
    };

    Object.entries(collectionsConfig).forEach(([colName, config]) => {
      const q = query(
        collection(db, colName), 
        where("userId", "==", currentUser.uid), 
        orderBy(config.orderByField, "desc")
      );
      
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        config.setter(data);
        if (config.cacheKey) {
          localforage.setItem(config.cacheKey, data);
        }
      }, (err) => console.error(`Error fetching ${colName}:`, err));
      
      unsubscribes.push(unsub);
    });

    const settingsUnsub = onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data());
    });
    unsubscribes.push(settingsUnsub);

    setLoading(false);
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [currentUser, isOnline]);

  // --- Actions ---
  const addBorrower = async (borrower) => {
    try {
      const docRef = await addDoc(collection(db, "borrowers"), {
        ...borrower,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await addActivityLog({ type: "borrower_creation", description: `Borrower created: ${borrower.name}` });
      showSnackbar("Borrower added successfully!", "success");
      return docRef;
    } catch (error) {
      showSnackbar("Failed to add borrower.", "error");
      throw error;
    }
  };

  const addLoan = async (loan) => {
    try {
      const docRef = await addDoc(collection(db, "loans"), { 
        ...loan, 
        userId: currentUser.uid, 
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp() 
      });
      const borrowerName = borrowers.find(b => b.id === loan.borrowerId)?.name || "A borrower";
      await addActivityLog({
        type: "loan_creation",
        description: `Loan added for borrower ${borrowerName}`,
        relatedId: docRef.id
      });
      showSnackbar("Loan added successfully!", "success");
      return docRef;
    } catch (error) {
      showSnackbar("Failed to add loan.", "error");
      throw error;
    }
  };

  const addPayment = async (loanId, amount) => {
    if (!currentUser) return;
    const loanRef = doc(db, "loans", loanId);
    try {
      let paymentDocId;
      await runTransaction(db, async (transaction) => {
        const loanSnap = await transaction.get(loanRef);
        if (!loanSnap.exists()) throw new Error("Loan not found");

        const newRepaidAmount = (loanSnap.data().repaidAmount || 0) + amount;
        const paymentDocRef = doc(collection(db, "payments"));
        paymentDocId = paymentDocRef.id;

        transaction.set(paymentDocRef, {
          loanId, amount, userId: currentUser.uid, date: serverTimestamp(), createdAt: serverTimestamp()
        });
        transaction.update(loanRef, { repaidAmount: newRepaidAmount, updatedAt: serverTimestamp() });
      });

      await addActivityLog({
        type: "payment_add",
        description: `Payment of ZMW ${amount.toFixed(2)} added to loan ID ${loanId}`,
        relatedId: paymentDocId
      });
      showSnackbar("Payment added successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to add payment.", "error");
      throw error;
    }
  };

  const updateSettings = async (newSettings) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "settings", "config"), {
        ...newSettings,
        updatedAt: serverTimestamp(),
        userId: currentUser.uid,
      });
      await addActivityLog({ type: "settings_update", description: "Application settings updated" });
      showSnackbar("Settings updated successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to update settings.", "error");
      throw error;
    }
  };

  const value = {
    loans, payments, borrowers, settings, activityLogs, comments, guarantors, expenses, loading,
    addLoan, addPayment, updateSettings, addBorrower, 
    updateBorrower: async (id, updates) => {
      await updateDoc(doc(db, "borrowers", id), { ...updates, updatedAt: serverTimestamp() });
      showSnackbar("Borrower updated!", "success");
    },
    deleteBorrower: async (id) => {
      await deleteDoc(doc(db, "borrowers", id));
      showSnackbar("Borrower deleted!", "info");
    }
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}