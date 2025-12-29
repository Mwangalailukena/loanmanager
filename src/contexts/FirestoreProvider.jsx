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
  runTransaction,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";
import { useSnackbar } from "../components/SnackbarProvider";
import localforage from "localforage";
import useOfflineStatus from "../hooks/useOfflineStatus";
import dayjs from "dayjs";


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

  // Helper function to get effective interest rates for a given date
  const getEffectiveInterestRates = (settingsObj, dateString) => {
    const monthKey = dayjs(dateString).format("YYYY-MM");
    const monthlyRates = settingsObj?.monthlySettings?.[monthKey]?.interestRates;
    const generalRates = settingsObj?.interestRates || { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 };

    // Prioritize monthly rates, then general rates
    return monthlyRates || generalRates;
  };

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
    try {
      const borrowerWithOwner = {
        ...borrower,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "borrowers"), borrowerWithOwner);
      await addActivityLog({ type: "borrower_creation", description: `Borrower created: ${borrower.name}` });
      showSnackbar("Borrower added successfully!", "success");
      return docRef;
    } catch (error) {
      console.error("Error adding borrower:", error);
      showSnackbar("Failed to add borrower.", "error");
      throw error;
    }
  };

  const updateBorrower = async (id, updates) => {
    try {
      const docRef = doc(db, "borrowers", id);
      await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
      await addActivityLog({ type: "borrower_update", description: `Borrower updated (ID: ${id})` });
      showSnackbar("Borrower updated successfully!", "success");
    } catch (error) {
      console.error("Error updating borrower:", error);
      showSnackbar("Failed to update borrower.", "error");
      throw error;
    }
  };

  const deleteBorrower = async (id) => {
    try {
      await deleteDoc(doc(db, "borrowers", id));
      setBorrowers((prev) => prev.filter((b) => b.id !== id));
      await addActivityLog({ type: "borrower_delete", description: `Borrower deleted (ID: ${id})` });
      showSnackbar("Borrower deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting borrower:", error);
      showSnackbar("Failed to delete borrower.", "error");
      throw error;
    }
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
    try {
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
      
      showSnackbar("Loan added successfully!", "success");
      return docRef;
    } catch (error) {
      console.error("Error adding loan:", error);
      showSnackbar("Failed to add loan.", "error");
      throw error;
    }
  };

  const updateLoan = async (id, updates) => {
    try {
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
      showSnackbar("Loan updated successfully!", "success");
    } catch (error) {
      console.error("Error updating loan:", error);
      showSnackbar("Failed to update loan.", "error");
      throw error;
    }
  };

  const deleteLoan = async (id) => {
    try {
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
      showSnackbar("Loan deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting loan:", error);
      showSnackbar("Failed to delete loan.", "error");
      throw error;
    }
  };

  const markLoanAsDefaulted = async (id) => {
    try {
      const docRef = doc(db, "loans", id);
      await updateDoc(docRef, { status: "Defaulted", updatedAt: serverTimestamp() });
      await addActivityLog({ type: "loan_defaulted", description: `Loan marked as defaulted (ID: ${id})` });
      showSnackbar("Loan marked as defaulted.", "success");
    } catch (error) {
      console.error("Error marking loan as defaulted:", error);
      showSnackbar("Failed to mark loan as defaulted.", "error");
      throw error;
    }
  };

  const addComment = async (borrowerId, text) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, "comments"), { borrowerId, text, userId: currentUser.uid, createdAt: serverTimestamp() });
      await addActivityLog({ type: "comment_add", description: `Comment added to borrower ID ${borrowerId}` });
      showSnackbar("Comment added successfully!", "success");
    } catch (error) {
      console.error("Error adding comment:", error);
      showSnackbar("Failed to add comment.", "error");
      throw error;
    }
  };

  const deleteComment = async (id) => {
    try {
      await deleteDoc(doc(db, "comments", id));
      setComments((prev) => prev.filter((c) => c.id !== id));
      await addActivityLog({ type: "comment_delete", description: `Comment deleted (ID: ${id})` });
      showSnackbar("Comment deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting comment:", error);
      showSnackbar("Failed to delete comment.", "error");
      throw error;
    }
  };

  const addGuarantor = async (guarantor) => {
    try {
      const guarantorWithOwner = { ...guarantor, userId: currentUser.uid, createdAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, "guarantors"), guarantorWithOwner);
      await addActivityLog({ type: "guarantor_add", description: `Guarantor ${guarantor.name} added for borrower ID ${guarantor.borrowerId}` });
      showSnackbar("Guarantor added successfully!", "success");
      return docRef;
    } catch (error) {
      console.error("Error adding guarantor:", error);
      showSnackbar("Failed to add guarantor.", "error");
      throw error;
    }
  };

  const updateGuarantor = async (id, updates) => {
    try {
      const docRef = doc(db, "guarantors", id);
      await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
      await addActivityLog({ type: "guarantor_update", description: `Guarantor updated (ID: ${id})` });
      showSnackbar("Guarantor updated successfully!", "success");
    } catch (error) {
      console.error("Error updating guarantor:", error);
      showSnackbar("Failed to update guarantor.", "error");
      throw error;
    }
  };

  const deleteGuarantor = async (id) => {
    try {
      await deleteDoc(doc(db, "guarantors", id));
      setGuarantors((prev) => prev.filter((g) => g.id !== id));
      await addActivityLog({ type: "guarantor_delete", description: `Guarantor deleted (ID: ${id})` });
      showSnackbar("Guarantor deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting guarantor:", error);
      showSnackbar("Failed to delete guarantor.", "error");
      throw error;
    }
  };

  const addExpense = async (expense) => {
    try {
      const expenseWithOwner = {
        ...expense,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "expenses"), expenseWithOwner);
      await addActivityLog({ type: "expense_add", description: `Expense added: ${expense.description}` });
      showSnackbar("Expense added successfully!", "success");
      return docRef;
    } catch (error) {
      console.error("Error adding expense:", error);
      showSnackbar("Failed to add expense.", "error");
      throw error;
    }
  };

  const updateExpense = async (id, updates) => {
    try {
      const docRef = doc(db, "expenses", id);
      await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
      await addActivityLog({ type: "expense_update", description: `Expense updated (ID: ${id})` });
      showSnackbar("Expense updated successfully!", "success");
    } catch (error) {
      console.error("Error updating expense:", error);
      showSnackbar("Failed to update expense.", "error");
      throw error;
    }
  };

  const deleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      await addActivityLog({ type: "expense_delete", description: `Expense deleted (ID: ${id})` });
      showSnackbar("Expense deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting expense:", error);
      showSnackbar("Failed to delete expense.", "error");
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
        if (!loanSnap.exists()) {
          throw new Error("Loan document does not exist!");
        }

        const loanData = loanSnap.data();
        const newRepaidAmount = (loanData.repaidAmount || 0) + amount;

        const paymentDocRef = doc(collection(db, "payments"));
        paymentDocId = paymentDocRef.id;

        transaction.set(paymentDocRef, {
          loanId,
          amount,
          date: serverTimestamp(),
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
        });

        transaction.update(loanRef, { 
          repaidAmount: newRepaidAmount,
          updatedAt: serverTimestamp(),
        });
      });

      await addActivityLog({
        type: "payment_add",
        description: `Payment of ZMW ${amount.toFixed(2)} added to loan ID ${loanId}`,
        relatedId: paymentDocId,
        loanId: loanId,
        amount: amount,
        undoable: true
      });
      showSnackbar("Payment added successfully!", "success");

    } catch (error) {
      console.error("Error adding payment:", error);
      showSnackbar("Failed to add payment.", "error");
      throw error;
    }
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
    const paymentRef = doc(db, "payments", paymentId);

    try {
      await runTransaction(db, async (transaction) => {
        const loanSnap = await transaction.get(loanRef);
        if (!loanSnap.exists()) {
          throw new Error("Loan not found for payment undo.");
        }

        const loanData = loanSnap.data();
        const newRepaidAmount = (loanData.repaidAmount || 0) - amount;

        transaction.delete(paymentRef);
        transaction.update(loanRef, {
          repaidAmount: newRepaidAmount,
          updatedAt: serverTimestamp(),
        });
      });

      await addActivityLog({
        type: "undo_payment",
        description: `Undo: Payment of ZMW ${amount.toFixed(2)} for loan ID ${loanId}`,
      });

      showSnackbar("Payment undone successfully!", "success");

    } catch (error) {
      console.error("Error undoing payment:", error);
      showSnackbar("Failed to undo payment.", "error");
      throw error;
    }
  };

  const undoRefinanceLoan = async (oldLoanId, newLoanId, previousRepaidAmount) => {
    const oldLoanRef = doc(db, "loans", oldLoanId);
    const newLoanRef = doc(db, "loans", newLoanId);

    try {
      await runTransaction(db, async (transaction) => {
        // We don't need to read the documents here since we are just deleting one
        // and updating the other with a known value.
        transaction.delete(newLoanRef);
        transaction.update(oldLoanRef, {
          status: "Active", // Assuming it was active before. This is a safe default.
          repaidAmount: previousRepaidAmount,
          updatedAt: serverTimestamp(),
        });
      });

      await addActivityLog({
        type: "undo_refinance",
        description: `Undo: Refinance of loan ${oldLoanId}`,
      });

      showSnackbar("Refinance undone successfully!", "success");

    } catch (error) {
      console.error("Error undoing refinance:", error);
      showSnackbar("Failed to undo refinance.", "error");
      throw error;
    }
  };

  const refinanceLoan = async (oldLoanId, newStartDate, newDueDate, refinanceAmount, newInterestDuration) => {
    const oldLoanRef = doc(db, "loans", oldLoanId);
    const settingsRef = doc(db, "settings", "config");

    try {
      let newLoanId;
      let previousRepaidAmount;
      let oldLoanData;

      await runTransaction(db, async (transaction) => {
        const oldLoanSnap = await transaction.get(oldLoanRef);
        if (!oldLoanSnap.exists()) {
          throw new Error("Loan to refinance not found.");
        }

        const settingsSnap = await transaction.get(settingsRef);
        const currentSettings = settingsSnap.exists() ? settingsSnap.data() : { interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 } };

        oldLoanData = oldLoanSnap.data();
        previousRepaidAmount = oldLoanData.repaidAmount || 0;

        const outstandingBalance = (oldLoanData.totalRepayable || 0) - previousRepaidAmount;
        const newPrincipal = refinanceAmount > 0 ? refinanceAmount : outstandingBalance;

        if (newPrincipal <= 0) {
          throw new Error("Loan has no outstanding balance or refinance amount is zero.");
        }
        if (newPrincipal > outstandingBalance) {
          throw new Error("Refinance amount cannot exceed outstanding balance.");
        }

        const interestDuration = newInterestDuration || oldLoanData.interestDuration || 1;
        const effectiveRates = getEffectiveInterestRates(currentSettings, newStartDate);
        const interestRate = effectiveRates[interestDuration] || 0;
        const newInterest = newPrincipal * interestRate;
        const newTotalRepayable = newPrincipal + newInterest;

        const newLoanRef = doc(collection(db, "loans"));
        newLoanId = newLoanRef.id;

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
        transaction.set(newLoanRef, newLoan);

        const newOldLoanRepaidAmount = previousRepaidAmount + newPrincipal;
        transaction.update(oldLoanRef, {
          status: newOldLoanRepaidAmount >= oldLoanData.totalRepayable ? "Paid" : oldLoanData.status,
          repaidAmount: newOldLoanRepaidAmount,
          updatedAt: serverTimestamp(),
        });
      });

      await addActivityLog({
        type: "loan_refinanced",
        description: `Loan ${oldLoanId} partially refinanced with ZMW ${((refinanceAmount > 0) ? refinanceAmount : ((oldLoanData.totalRepayable || 0) - previousRepaidAmount)).toFixed(2)} into new loan ${newLoanId}`,
        relatedId: oldLoanId,
        newLoanId: newLoanId,
        previousRepaidAmount: previousRepaidAmount,
        undoable: true,
      });

      showSnackbar("Loan refinanced successfully!", "success");
      
    } catch (error) {
      console.error("Error refinancing loan:", error);
      showSnackbar(`Failed to refinance loan: ${error.message}`, "error");
      throw error;
    }
  };

  const topUpLoan = async (loanId, topUpAmount) => {
    const loanRef = doc(db, "loans", loanId);
    const settingsRef = doc(db, "settings", "config");
    let oldLoanData;

    try {
      await runTransaction(db, async (transaction) => {
        const loanSnap = await transaction.get(loanRef);
        if (!loanSnap.exists()) {
          throw new Error("Loan to top-up not found.");
        }

        const loanData = loanSnap.data();
        oldLoanData = loanData;

        if ((loanData.repaidAmount || 0) > 0) {
          throw new Error("Cannot top-up a loan that has already been partially paid.");
        }

        const newPrincipal = (loanData.principal || 0) + topUpAmount;

        const settingsSnap = await transaction.get(settingsRef);
        const currentSettings = settingsSnap.exists() ? settingsSnap.data() : { interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 } };

        const effectiveRates = getEffectiveInterestRates(currentSettings, loanData.startDate);
        const interestDuration = loanData.interestDuration || 1;
        const interestRate = effectiveRates[interestDuration] || 0;
        const newInterest = newPrincipal * interestRate;
        const newTotalRepayable = newPrincipal + newInterest;

        transaction.update(loanRef, {
          principal: newPrincipal,
          interest: newInterest,
          totalRepayable: newTotalRepayable,
          updatedAt: serverTimestamp(),
        });
      });

      await addActivityLog({
        type: "loan_top_up",
        description: `Loan ${loanId} topped up with ZMW ${topUpAmount.toFixed(2)}`,
        relatedId: loanId,
        undoable: true,
        undoData: { oldLoan: oldLoanData },
      });

      showSnackbar("Loan topped up successfully!", "success");

    } catch (error) {
      console.error("Error topping up loan:", error);
      showSnackbar(`Failed to top up loan: ${error.message}`, "error");
      throw error;
    }
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

  const saveFCMTokenToFirestore = async (token) => {
    if (!currentUser) {
      console.warn("Attempted to save FCM token without authenticated user.");
      return;
    }
    try {
      const tokensRef = collection(db, "fcmTokens");
      // Use the token itself as the document ID for easy lookup and to prevent duplicates
      await setDoc(doc(tokensRef, token), {
        userId: currentUser.uid,
        token: token,
        createdAt: serverTimestamp(),
      });
      console.log("FCM token saved to Firestore for user:", currentUser.uid);
    } catch (error) {
      console.error("Error saving FCM token to Firestore:", error);
      showSnackbar("Failed to save FCM token.", "error");
    }
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
    saveFCMTokenToFirestore, // Add this line to expose the new function
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}