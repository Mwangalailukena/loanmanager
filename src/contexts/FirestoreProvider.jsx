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
  getDocs, // Added getDocs
  setDoc,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";
import { useSnackbar } from "../components/SnackbarProvider";
import localforage from "localforage";
import useOfflineStatus from "../hooks/useOfflineStatus";


const FirestoreContext = createContext();
export const useFirestore = () => useContext(FirestoreContext);

const functions = getFunctions();
const sendPushNotification = httpsCallable(functions, 'sendPushNotification');

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
  const [expenses, setExpenses] = useState([]);
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
      expenses: { setter: setExpenses, cacheKey: "expenses", orderByField: "date" },
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

    const borrower = borrowers.find(b => b.id === loan.borrowerId);
    const borrowerName = borrower ? borrower.name : "A borrower";

    await addActivityLog({
      type: "loan_creation",
      description: `Loan added for borrower ${borrowerName}`,
      relatedId: docRef.id,
      undoable: true 
    });

    try {
      await sendPushNotification({ 
        userId: currentUser.uid, 
        payload: { 
          title: "New Loan Added", 
          body: `A new loan of ${loan.principal} has been added for ${borrowerName}.` 
        }
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
    }

    return docRef;
  };

  const updateLoan = async (id, updates) => {
    const docRef = doc(db, "loans", id);
    const loanSnap = await getDoc(docRef);
    if (!loanSnap.exists()) {
      throw new Error("Loan to update not found.");
    }
    const oldLoanData = loanSnap.data();

    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });

    await addActivityLog({
      type: "loan_update",
      description: `Loan updated (ID: ${id})`,
      relatedId: id,
      undoable: true,
      undoData: { oldLoan: oldLoanData },
    });
  };

  const deleteLoan = async (id) => {
    const loanRef = doc(db, "loans", id);
    const loanSnap = await getDoc(loanRef);
    if (!loanSnap.exists()) {
      throw new Error("Loan to delete not found.");
    }
    const loanData = loanSnap.data();

    await deleteDoc(loanRef);

    await addActivityLog({
      type: "loan_delete",
      description: `Loan deleted (ID: ${id})`,
      relatedId: id,
      undoable: true,
      undoData: { loan: loanData },
    });
  };

  const markLoanAsDefaulted = async (id) => {
    const docRef = doc(db, "loans", id);
    await updateDoc(docRef, { status: "Defaulted", updatedAt: serverTimestamp() });
    await addActivityLog({ type: "loan_defaulted", description: `Loan marked as defaulted (ID: ${id})` });
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

  const addExpense = async (expense) => {
    const expenseWithOwner = {
      ...expense,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "expenses"), expenseWithOwner);
    await addActivityLog({ type: "expense_add", description: `Expense added: ${expense.description}` });
    return docRef;
  };

  const updateExpense = async (id, updates) => {
    const docRef = doc(db, "expenses", id);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
    await addActivityLog({ type: "expense_update", description: `Expense updated (ID: ${id})` });
  };

  const deleteExpense = async (id) => {
    await deleteDoc(doc(db, "expenses", id));
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await addActivityLog({ type: "expense_delete", description: `Expense deleted (ID: ${id})` });
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

    const paymentDocRef = await addDoc(collection(db, "payments"), {
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
      relatedId: paymentDocRef.id,
      loanId: loanId,
      amount: amount,
      undoable: true
    });
  };

  const getPaymentsByLoanId = async (loanId) => {
    if (!currentUser) return [];

    const q = query(
      collection(db, "payments"),
      where("loanId", "==", loanId),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc") // Assuming 'createdAt' is the timestamp field
    );

    console.log("Fetching payments for loanId:", loanId, "and userId:", currentUser.uid);

    const querySnapshot = await getDocs(q);

    console.log("Query Snapshot Docs:", querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  };

  const updateSettings = async (newSettings) => {
    if (!currentUser) return;
    const settingsRef = doc(db, "settings", "config");
    try {
      await updateDoc(settingsRef, {
        ...newSettings,
        updatedAt: serverTimestamp(),
        userId: currentUser.uid, // Associate settings with the user
      });
      await addActivityLog({ type: "settings_update", description: "Application settings updated" });
      showSnackbar("Settings updated successfully!", "success");
    } catch (error) {
      console.error("Error updating settings:", error);
      showSnackbar("Failed to update settings.", "error");
      throw error; // Re-throw to allow calling component to handle
    }
  };

  const updateActivityLog = async (id, updates) => {
    const docRef = doc(db, "activityLogs", id);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
  };

  const undoLoanCreation = async (loanId) => {
    await deleteLoan(loanId);
    await addActivityLog({
      type: "undo_loan_creation",
      description: `Undo: Loan Created (ID: ${loanId})`,
    });
  };

  const undoPayment = async (paymentId, loanId, amount) => {
    const loanRef = doc(db, "loans", loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
      console.error("Loan not found for payment undo:", loanId);
      throw new Error("Loan not found.");
    }

    const loanData = loanSnap.data();
    const newRepaidAmount = (loanData.repaidAmount || 0) - amount;

    await deleteDoc(doc(db, "payments", paymentId));
    await updateDoc(loanRef, {
      repaidAmount: newRepaidAmount,
      updatedAt: serverTimestamp(),
    });

    await addActivityLog({
      type: "undo_payment",
      description: `Undo: Payment of ZMW ${amount.toFixed(2)} for loan ID ${loanId}`,
    });
  };

  const undoRefinanceLoan = async (oldLoanId, newLoanId, previousRepaidAmount) => {
    // 1. Delete the new loan
    await deleteDoc(doc(db, "loans", newLoanId));

    // 2. Revert the old loan's status and repaidAmount
    const oldLoanRef = doc(db, "loans", oldLoanId);
    await updateDoc(oldLoanRef, {
      status: "Active", // Assuming it was active before. This is a safe default.
      repaidAmount: previousRepaidAmount,
      updatedAt: serverTimestamp(),
    });

    // 3. Log the undo action
    await addActivityLog({
      type: "undo_refinance",
      description: `Undo: Refinance of loan ${oldLoanId}`,
    });
  };

  const refinanceLoan = async (oldLoanId, newStartDate, newDueDate) => {
    const oldLoanRef = doc(db, "loans", oldLoanId);
    const oldLoanSnap = await getDoc(oldLoanRef);

    if (!oldLoanSnap.exists()) {
      throw new Error("Loan to refinance not found.");
    }

    // Fetch the latest settings directly to ensure accuracy
    const settingsRef = doc(db, "settings", "config");
    const settingsSnap = await getDoc(settingsRef);
    const currentSettings = settingsSnap.exists() ? settingsSnap.data() : { interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 } };

    const oldLoanData = oldLoanSnap.data();
    const previousRepaidAmount = oldLoanData.repaidAmount || 0;

    // 1. Calculate new principal from outstanding balance
    const outstandingBalance = (oldLoanData.totalRepayable || 0) - previousRepaidAmount;
    const newPrincipal = outstandingBalance;

    if (newPrincipal <= 0) {
      throw new Error("Loan has no outstanding balance to refinance.");
    }

    // 2. Recalculate interest for the new loan using the old loan's duration
    const interestDuration = oldLoanData.interestDuration || 1;
    const interestRate = currentSettings.interestRates[interestDuration] || 0;
    const newInterest = newPrincipal * interestRate;
    const newTotalRepayable = newPrincipal + newInterest;

    // 3. Create a new loan
    const newLoan = {
      borrowerId: oldLoanData.borrowerId,
      principal: newPrincipal,
      interest: newInterest,
      totalRepayable: newTotalRepayable,
      interestDuration: interestDuration,
      startDate: newStartDate,
      dueDate: newDueDate,
      status: "Active",
      repaidAmount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      originalLoanId: oldLoanId,
      userId: currentUser.uid,
    };
    const newLoanRef = await addDoc(collection(db, "loans"), newLoan);

    // 4. Mark the old loan as "Paid" by updating its status and repaidAmount
    await updateDoc(oldLoanRef, {
      status: "Paid",
      repaidAmount: oldLoanData.totalRepayable, // This effectively closes out the old loan
      updatedAt: serverTimestamp(),
    });

    // 5. Log activity, including the previous repaid amount for undo purposes
    await addActivityLog({
      type: "loan_refinanced",
      description: `Loan ${oldLoanId} refinanced into new loan ${newLoanRef.id} with a principal of ZMW ${newPrincipal.toFixed(2)}`,
      relatedId: oldLoanId,
      newLoanId: newLoanRef.id, // For undo purposes
      previousRepaidAmount: previousRepaidAmount, // For undo purposes
      undoable: true,
    });

    return { ...newLoan, id: newLoanRef.id };
  };

  const topUpLoan = async (loanId, topUpAmount) => {
    const loanRef = doc(db, "loans", loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
      throw new Error("Loan to top-up not found.");
    }

    const loanData = loanSnap.data();

    if ((loanData.repaidAmount || 0) > 0) {
      throw new Error("Cannot top-up a loan that has already been partially paid.");
    }

    const newPrincipal = (loanData.principal || 0) + topUpAmount;

    let interestRate;
    if (loanData.interestRate) {
      interestRate = loanData.interestRate / 100;
    } else if (loanData.manualInterestRate) {
      interestRate = loanData.manualInterestRate / 100;
    } else {
      const settingsRef = doc(db, "settings", "config");
      const settingsSnap = await getDoc(settingsRef);
      const currentSettings = settingsSnap.exists() ? settingsSnap.data() : { interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 } };
      const interestDuration = loanData.interestDuration || 1;
      interestRate = currentSettings.interestRates[interestDuration] || 0;
    }

    const newInterest = newPrincipal * interestRate;
    const newTotalRepayable = newPrincipal + newInterest;

    await updateDoc(loanRef, {
      principal: newPrincipal,
      interest: newInterest,
      totalRepayable: newTotalRepayable,
      updatedAt: serverTimestamp(),
    });

    await addActivityLog({
      type: "loan_top_up",
      description: `Loan ${loanId} topped up with ZMW ${topUpAmount.toFixed(2)}`,
      relatedId: loanId,
      undoable: true,
      undoData: { oldLoan: loanData },
    });
  };

  const undoDeleteLoan = async (loanId, undoData) => {
    const { loan } = undoData;
    await setDoc(doc(db, "loans", loanId), loan);

    await addActivityLog({
      type: "undo_loan_delete",
      description: `Undo: Loan Deleted (ID: ${loanId})`,
    });
  };

  const undoUpdateLoan = async (loanId, undoData) => {
    const { oldLoan } = undoData;
    await setDoc(doc(db, "loans", loanId), oldLoan);

    await addActivityLog({
      type: "undo_loan_update",
      description: `Undo: Loan Update (ID: ${loanId})`,
    });
  };

  const updateUser = async (updates) => {
    if (!currentUser) return;
    const userRef = doc(db, "users", currentUser.uid);
    await setDoc(userRef, updates, { merge: true });
  };

  const value = {
    loans, payments, borrowers, settings, activityLogs, comments, guarantors, expenses, loading,
    addLoan, updateLoan, deleteLoan, markLoanAsDefaulted,
    addPayment, getPaymentsByLoanId,
    updateSettings, addActivityLog,
    addBorrower, updateBorrower, deleteBorrower,
    addComment, deleteComment,
    addGuarantor, updateGuarantor, deleteGuarantor,
    addExpense, updateExpense, deleteExpense,
    undoLoanCreation, undoPayment, updateActivityLog,
    refinanceLoan, undoRefinanceLoan,
    topUpLoan, undoDeleteLoan, undoUpdateLoan,
    updateUser,
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}