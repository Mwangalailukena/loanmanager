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
  runTransaction,
  getDocs, // Added getDocs
  getDoc, // Added getDoc
  deleteField,
  limit, // Added limit import
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";
import { useSnackbar } from "../components/SnackbarProvider";
import localforage from "localforage";
import useOfflineStatus from "../hooks/useOfflineStatus";


const FirestoreContext = createContext();
export const useFirestore = () => useContext(FirestoreContext);

export function FirestoreProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth(); // Destructure loading as authLoading
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
    // Wait until auth is resolved, user is logged in, and online.
    if (authLoading || !currentUser || !isOnline) {
      setLoading(false);
      // Clear data if user logs out or goes offline
      if (!currentUser || !isOnline) {
        setLoans([]);
        setPayments([]);
        setBorrowers([]);
        setActivityLogs([]);
        setComments([]);
        setGuarantors([]);
        setExpenses([]);
      }
      return;
    }

    setLoading(true);
    const unsubscribes = [];
    const collectionsConfig = {
      loans: { setter: setLoans, cacheKey: "loans", orderByField: "startDate" },
      payments: { setter: setPayments, cacheKey: "payments", orderByField: "date" },
      borrowers: { setter: setBorrowers, cacheKey: "borrowers", orderByField: "name" },
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

    // Settings are public, but we fetch them along with user data
    const settingsUnsub = onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data());
    });
    unsubscribes.push(settingsUnsub);

    setLoading(false); // Set loading to false after listeners are attached
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [currentUser, authLoading, isOnline]);
  
  // --- On-Demand Fetching ---
  const fetchActivityLogs = (limitCount = 100) => {
    if (!currentUser) return () => {};
    // Real-time listener for activity logs, but only when requested
    const q = query(
      collection(db, "activityLogs"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(limitCount) 
    );
    // Note: If you want to use 'limit', import it at the top. For now, fetching recent ones.
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setActivityLogs(data);
    }, (err) => console.error("Error fetching activity logs:", err));
    return unsub;
  };

  const fetchComments = (filters = {}) => {
    if (!currentUser) return () => {};
    const constraints = [
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    ];

    if (filters.loanId) constraints.push(where("loanId", "==", filters.loanId));
    if (filters.borrowerId) constraints.push(where("borrowerId", "==", filters.borrowerId));

    const q = query(collection(db, "comments"), ...constraints);
    
    const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setComments(data);
    }, (err) => console.error("Error fetching comments:", err));
    return unsub;
  };

  // --- Actions ---
  const addBorrower = async (borrower) => {
    try {
      const docRef = await addDoc(collection(db, "borrowers"), {
        ...borrower,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await addActivityLog({ 
        type: "borrower_creation", 
        description: `Borrower created: ${borrower.name}`,
        relatedId: docRef.id,
        undoable: true 
      });
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
        relatedId: docRef.id,
        undoable: true
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
        relatedId: paymentDocId,
        loanId: loanId,
        amount: amount,
        undoable: true
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
    addLoan, addPayment, updateSettings, addBorrower, fetchActivityLogs, fetchComments, 
    updateBorrower: async (id, updates) => {
      await updateDoc(doc(db, "borrowers", id), { ...updates, updatedAt: serverTimestamp() });
      showSnackbar("Borrower updated!", "success");
    },
    updateLoan: async (id, updates) => {
      if (!currentUser) return;
      try {
        const loanRef = doc(db, "loans", id);
        const loanSnap = await getDoc(loanRef);
        const previousData = loanSnap.exists() ? { ...loanSnap.data() } : null;

        await updateDoc(loanRef, { ...updates, updatedAt: serverTimestamp() });
        await addActivityLog({ 
          type: "loan_update", 
          description: `Loan ID ${id} updated`,
          relatedId: id,
          undoData: previousData,
          undoable: !!previousData
        });
        showSnackbar("Loan updated successfully!", "success");
      } catch (error) {
        showSnackbar("Failed to update loan.", "error");
        throw error;
      }
    },
    deleteLoan: async (id) => {
      if (!currentUser) return;
      try {
        const loanRef = doc(db, "loans", id);
        const loanSnap = await getDoc(loanRef);
        const loanData = loanSnap.exists() ? { id: loanSnap.id, ...loanSnap.data() } : null;

        await deleteDoc(loanRef);
        await addActivityLog({ 
          type: "loan_deletion", 
          description: `Loan ID ${id} deleted`,
          relatedId: id,
          undoData: loanData,
          undoable: !!loanData
        });
        showSnackbar("Loan deleted successfully!", "info");
      } catch (error) {
        showSnackbar("Failed to delete loan.", "error");
        throw error;
      }
    },
    getPaymentsByLoanId: async (loanId) => {
      if (!currentUser) return [];
      try {
        const q = query(
          collection(db, "payments"),
          where("userId", "==", currentUser.uid),
          where("loanId", "==", loanId),
          orderBy("date", "asc")
        );
        const querySnapshot = await getDocs(q); // getDocs is needed for one-time fetch
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error("Error fetching payments by loan ID:", error);
        showSnackbar("Failed to fetch payment history.", "error");
        return [];
      }
    },
    refinanceLoan: async (oldLoanId, newStartDate, newDueDate, newPrincipalAmount, newInterestDuration) => {
      if (!currentUser) return;
      const oldLoanRef = doc(db, "loans", oldLoanId);
      let newLoanRefId = "";

      try {
        await runTransaction(db, async (transaction) => {
          const oldLoanSnap = await transaction.get(oldLoanRef);
          if (!oldLoanSnap.exists()) {
            throw new Error("Original loan not found for refinancing.");
          }

          const oldLoanData = oldLoanSnap.data();
          const interestRate = settings.interestRates[newInterestDuration] || 0;
          const newInterest = newPrincipalAmount * interestRate;
          const newTotalRepayable = newPrincipalAmount + newInterest;

          // Create new loan document
          const newLoanRef = doc(collection(db, "loans"));
          newLoanRefId = newLoanRef.id;

          const newLoan = {
            borrowerId: oldLoanData.borrowerId, // Keep same borrower
            principal: newPrincipalAmount,
            interest: newInterest,
            totalRepayable: newTotalRepayable,
            repaidAmount: 0,
            startDate: newStartDate,
            dueDate: newDueDate,
            interestDuration: newInterestDuration,
            status: "Active",
            refinancedFromId: oldLoanId, // Link to old loan
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          transaction.set(newLoanRef, newLoan);

          // Update old loan to mark as refinanced
          transaction.update(oldLoanRef, {
            status: "Refinanced",
            refinancedToId: newLoanRefId, // Link to new loan
            updatedAt: serverTimestamp(),
          });
        });

        await addActivityLog({
          type: "loan_refinanced",
          description: `Loan ID ${oldLoanId} refinanced to new loan ID ${newLoanRefId}`,
          relatedId: newLoanRefId,
          oldLoanId: oldLoanId,
          undoable: true
        });
        showSnackbar("Loan refinanced successfully!", "success");
        return newLoanRefId;
      } catch (error) {
        console.error("Error refinancing loan:", error);
        showSnackbar(`Failed to refinance loan: ${error.message}`, "error");
        throw error;
      }
    },
    topUpLoan: async (loanId, topUpAmount) => {
      if (!currentUser) return;
      const loanRef = doc(db, "loans", loanId);
      let previousData = null;

      try {
        await runTransaction(db, async (transaction) => {
          const loanSnap = await transaction.get(loanRef);
          if (!loanSnap.exists()) {
            throw new Error("Loan not found for top-up.");
          }

          const loanData = loanSnap.data();
          previousData = loanData;
          const currentPrincipal = Number(loanData.principal || 0);
          const currentInterestDuration = Number(loanData.interestDuration || 1);

          const newPrincipal = currentPrincipal + topUpAmount;
          const interestRate = settings.interestRates[currentInterestDuration] || 0;
          const newInterest = newPrincipal * interestRate; // Recalculate total interest based on new principal
          const newTotalRepayable = newPrincipal + newInterest;

          transaction.update(loanRef, {
            principal: newPrincipal,
            interest: newInterest,
            totalRepayable: newTotalRepayable,
            // Keep repaidAmount the same, as top-up is not a payment
            updatedAt: serverTimestamp(),
          });
        });

        await addActivityLog({
          type: "loan_top_up",
          description: `Loan ID ${loanId} topped up by ZMW ${topUpAmount.toFixed(2)}`,
          relatedId: loanId,
          undoData: previousData,
          undoable: true
        });
        showSnackbar("Loan topped up successfully!", "success");
      } catch (error) {
        console.error("Error topping up loan:", error);
        showSnackbar(`Failed to top up loan: ${error.message}`, "error");
        throw error;
      }
    },
    addExpense: async (expense) => {
      if (!currentUser) return;
      try {
        const docRef = await addDoc(collection(db, "expenses"), {
          ...expense,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await addActivityLog({ 
          type: "expense_creation", 
          description: `Expense added: ${expense.description}`,
          relatedId: docRef.id,
          undoable: true
        });
        showSnackbar("Expense added successfully!", "success");
        return docRef.id;
      } catch (error) {
        showSnackbar("Failed to add expense.", "error");
        throw error;
      }
    },
    updateExpense: async (id, updates) => {
      if (!currentUser) return;
      try {
        await updateDoc(doc(db, "expenses", id), { ...updates, updatedAt: serverTimestamp() });
        await addActivityLog({ type: "expense_update", description: `Expense ID ${id} updated` });
        showSnackbar("Expense updated successfully!", "success");
      } catch (error) {
        showSnackbar("Failed to update expense.", "error");
        throw error;
      }
    },
    deleteExpense: async (id) => {
      if (!currentUser) return;
      try {
        const expenseRef = doc(db, "expenses", id);
        const expenseSnap = await getDoc(expenseRef);
        const expenseData = expenseSnap.exists() ? { id: expenseSnap.id, ...expenseSnap.data() } : null;

        await deleteDoc(expenseRef);
        await addActivityLog({ 
          type: "expense_deletion", 
          description: `Expense ID ${id} deleted`,
          relatedId: id,
          undoData: expenseData,
          undoable: !!expenseData
        });
        showSnackbar("Expense deleted successfully!", "info");
      } catch (error) {
        showSnackbar("Failed to delete expense.", "error");
        throw error;
      }
    },
    addGuarantor: async (guarantor) => {
      if (!currentUser) return;
      try {
        const docRef = await addDoc(collection(db, "guarantors"), {
          ...guarantor,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await addActivityLog({ 
          type: "guarantor_creation", 
          description: `Guarantor added: ${guarantor.name}`,
          relatedId: docRef.id,
          undoable: true
        });
        showSnackbar("Guarantor added successfully!", "success");
        return docRef.id;
      } catch (error) {
        showSnackbar("Failed to add guarantor.", "error");
        throw error;
      }
    },
    updateGuarantor: async (id, updates) => {
      if (!currentUser) return;
      try {
        await updateDoc(doc(db, "guarantors", id), { ...updates, updatedAt: serverTimestamp() });
        await addActivityLog({ type: "guarantor_update", description: `Guarantor ID ${id} updated` });
        showSnackbar("Guarantor updated successfully!", "success");
      } catch (error) {
        showSnackbar("Failed to update guarantor.", "error");
        throw error;
      }
    },
    deleteGuarantor: async (id) => {
      if (!currentUser) return;
      try {
        const guarantorRef = doc(db, "guarantors", id);
        const guarantorSnap = await getDoc(guarantorRef);
        const guarantorData = guarantorSnap.exists() ? { id: guarantorSnap.id, ...guarantorSnap.data() } : null;

        await deleteDoc(guarantorRef);
        await addActivityLog({ 
          type: "guarantor_deletion", 
          description: `Guarantor ID ${id} deleted`,
          relatedId: id,
          undoData: guarantorData,
          undoable: !!guarantorData
        });
        showSnackbar("Guarantor deleted successfully!", "info");
      } catch (error) {
        showSnackbar("Failed to delete guarantor.", "error");
        throw error;
      }
    },
    addComment: async (comment) => {
      if (!currentUser) return;
      try {
        const docRef = await addDoc(collection(db, "comments"), {
          ...comment,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await addActivityLog({ 
          type: "comment_creation", 
          description: `Comment added by ${currentUser?.displayName || currentUser?.email}`,
          relatedId: docRef.id,
          undoable: true
        });
        showSnackbar("Comment added successfully!", "success");
        return docRef.id;
      } catch (error)
      {
        showSnackbar("Failed to add comment.", "error");
        throw error;
      }
    },
    deleteComment: async (id) => {
      if (!currentUser) return;
      try {
        const commentRef = doc(db, "comments", id);
        const commentSnap = await getDoc(commentRef);
        const commentData = commentSnap.exists() ? { id: commentSnap.id, ...commentSnap.data() } : null;

        await deleteDoc(commentRef);
        await addActivityLog({ 
          type: "comment_deletion", 
          description: `Comment ID ${id} deleted`,
          relatedId: id,
          undoData: commentData,
          undoable: !!commentData
        });
        showSnackbar("Comment deleted successfully!", "info");
      } catch (error) {
        showSnackbar("Failed to delete comment.", "error");
        throw error;
      }
    },
    markLoanAsDefaulted: async (loanId) => {
      if (!currentUser) return;
      try {
        await updateDoc(doc(db, "loans", loanId), {
          status: "Defaulted",
          updatedAt: serverTimestamp(),
        });
        await addActivityLog({ type: "loan_defaulted", description: `Loan ID ${loanId} marked as defaulted` });
        showSnackbar("Loan marked as defaulted!", "success");
      } catch (error) {
        showSnackbar("Failed to mark loan as defaulted.", "error");
        throw error;
      }
    },
    updateActivityLog: async (id, updates) => {
      if (!currentUser) return;
      try {
        await updateDoc(doc(db, "activityLogs", id), { ...updates, updatedAt: serverTimestamp() });
        // showSnackbar("Activity log updated!", "success"); // Logs usually don't need direct user feedback
      } catch (error) {
        console.error("Error updating activity log:", error);
        // showSnackbar("Failed to update activity log.", "error");
        throw error;
      }
    },
    undoLoanCreation: async (loanId, activityLogId) => {
      if (!currentUser) return;
      if (!loanId || !activityLogId) throw new Error("Invalid ID provided for undoLoanCreation");
      try {
        await runTransaction(db, async (transaction) => {
          const loanRef = doc(db, "loans", loanId);
          const activityLogRef = doc(db, "activityLogs", activityLogId);

          transaction.delete(loanRef);
          transaction.delete(activityLogRef);
        });
        await addActivityLog({ type: "loan_creation_undo", description: `Undid creation of Loan ID ${loanId}` });
        showSnackbar("Loan creation undone!", "info");
      } catch (error) {
        console.error("Error undoing loan creation:", error);
        showSnackbar("Failed to undo loan creation.", "error");
        throw error;
      }
    },
    undoPayment: async (paymentId, loanId, paymentAmount, activityLogId) => {
      if (!currentUser) return;
      try {
        await runTransaction(db, async (transaction) => {
          const loanRef = doc(db, "loans", loanId);
          const paymentRef = doc(db, "payments", paymentId);
          const activityLogRef = doc(db, "activityLogs", activityLogId);

          const loanSnap = await transaction.get(loanRef);
          if (!loanSnap.exists()) throw new Error("Loan not found");

          const currentRepaidAmount = (loanSnap.data().repaidAmount || 0);
          const newRepaidAmount = Math.max(0, currentRepaidAmount - paymentAmount); // Ensure repaidAmount doesn't go below 0

          transaction.update(loanRef, { repaidAmount: newRepaidAmount, updatedAt: serverTimestamp() });
          transaction.delete(paymentRef);
          transaction.delete(activityLogRef);
        });
        await addActivityLog({ type: "payment_undo", description: `Undid payment of ZMW ${paymentAmount.toFixed(2)} for Loan ID ${loanId}` });
        showSnackbar("Payment undone successfully!", "info");
      } catch (error) {
        console.error("Error undoing payment:", error);
        showSnackbar("Failed to undo payment.", "error");
        throw error;
      }
    },
    undoRefinanceLoan: async (newLoanId, oldLoanId, activityLogId) => {
      if (!currentUser) return;
      try {
        await runTransaction(db, async (transaction) => {
          const newLoanRef = doc(db, "loans", newLoanId);
          const oldLoanRef = doc(db, "loans", oldLoanId);
          const activityLogRef = doc(db, "activityLogs", activityLogId);

          // Get old loan to restore its status
          const oldLoanSnap = await transaction.get(oldLoanRef);
          const oldLoanData = oldLoanSnap.data();

          // Restore old loan's status (assuming 'Active' or previous status) and remove refinancedToId
          // More robust would be to store original status in the log entry
          transaction.update(oldLoanRef, { status: oldLoanData.status === "Refinanced" ? "Active" : oldLoanData.status, refinancedToId: deleteField(), updatedAt: serverTimestamp() });
          transaction.delete(newLoanRef);
          transaction.delete(activityLogRef);
        });
        await addActivityLog({ type: "loan_refinance_undo", description: `Undid refinance of Loan ID ${oldLoanId}` });
        showSnackbar("Loan refinance undone!", "info");
      } catch (error) {
        console.error("Error undoing loan refinance:", error);
        showSnackbar("Failed to undo loan refinance.", "error");
        throw error;
      }
    },
    undoDeleteLoan: async (loanData, activityLogId) => {
      if (!currentUser) return;
      try {
        await runTransaction(db, async (transaction) => {
          const loanRef = doc(db, "loans", loanData.id); // Use loanData.id to restore the original ID
          const activityLogRef = doc(db, "activityLogs", activityLogId);

          transaction.set(loanRef, { ...loanData, updatedAt: serverTimestamp() }); // Restore the loan
          transaction.delete(activityLogRef); // Delete the undo activity log
        });
        await addActivityLog({ type: "loan_delete_undo", description: `Undid deletion of Loan ID ${loanData.id}` });
        showSnackbar("Loan deletion undone!", "info");
      } catch (error) {
        console.error("Error undoing loan deletion:", error);
        showSnackbar("Failed to undo loan deletion.", "error");
        throw error;
      }
    },
    undoUpdateLoan: async (loanId, previousLoanData, activityLogId) => {
      if (!currentUser) return;
      try {
        await runTransaction(db, async (transaction) => {
          const loanRef = doc(db, "loans", loanId);
          const activityLogRef = doc(db, "activityLogs", activityLogId);

          // Restore the loan to its previous state
          transaction.set(loanRef, { ...previousLoanData, updatedAt: serverTimestamp() }); // Use set to overwrite or update specific fields
          transaction.delete(activityLogRef);
        });
        await addActivityLog({ type: "loan_update_undo", description: `Undid update of Loan ID ${loanId}` });
        showSnackbar("Loan update undone!", "info");
      } catch (error) {
        console.error("Error undoing loan update:", error);
        showSnackbar("Failed to undo loan update.", "error");
        throw error;
      }
    },
    undoBorrowerCreation: async (borrowerId, activityLogId) => {
      if (!currentUser) return;
      try {
        await runTransaction(db, async (transaction) => {
          const borrowerRef = doc(db, "borrowers", borrowerId);
          const activityLogRef = doc(db, "activityLogs", activityLogId);
          transaction.delete(borrowerRef);
          transaction.delete(activityLogRef);
        });
        await addActivityLog({ type: "borrower_creation_undo", description: `Undid creation of Borrower ID ${borrowerId}` });
        showSnackbar("Borrower creation undone!", "info");
      } catch (error) {
        console.error("Error undoing borrower creation:", error);
        showSnackbar("Failed to undo borrower creation.", "error");
        throw error;
      }
    },
    undoExpenseCreation: async (expenseId, activityLogId) => {
      if (!currentUser) return;
      try {
        await runTransaction(db, async (transaction) => {
          const expenseRef = doc(db, "expenses", expenseId);
          const activityLogRef = doc(db, "activityLogs", activityLogId);
          transaction.delete(expenseRef);
          transaction.delete(activityLogRef);
        });
        await addActivityLog({ type: "expense_creation_undo", description: `Undid creation of Expense ID ${expenseId}` });
        showSnackbar("Expense creation undone!", "info");
      } catch (error) {
        console.error("Error undoing expense creation:", error);
        showSnackbar("Failed to undo expense creation.", "error");
        throw error;
      }
    },
    undoGuarantorCreation: async (guarantorId, activityLogId) => {
      if (!currentUser) return;
      try {
        await runTransaction(db, async (transaction) => {
          const guarantorRef = doc(db, "guarantors", guarantorId);
          const activityLogRef = doc(db, "activityLogs", activityLogId);
          transaction.delete(guarantorRef);
          transaction.delete(activityLogRef);
        });
        await addActivityLog({ type: "guarantor_creation_undo", description: `Undid creation of Guarantor ID ${guarantorId}` });
        showSnackbar("Guarantor creation undone!", "info");
      } catch (error) {
        console.error("Error undoing guarantor creation:", error);
        showSnackbar("Failed to undo guarantor creation.", "error");
        throw error;
      }
    },
    undoCommentCreation: async (commentId, activityLogId) => {
      if (!currentUser) return;
      try {
        await runTransaction(db, async (transaction) => {
          const commentRef = doc(db, "comments", commentId);
          const activityLogRef = doc(db, "activityLogs", activityLogId);
          transaction.delete(commentRef);
          transaction.delete(activityLogRef);
        });
        await addActivityLog({ type: "comment_creation_undo", description: `Undid creation of Comment ID ${commentId}` });
        showSnackbar("Comment creation undone!", "info");
      } catch (error) {
        console.error("Error undoing comment creation:", error);
        showSnackbar("Failed to undo comment creation.", "error");
        throw error;
      }
    },
    undoExpenseDeletion: async (expenseData, activityLogId) => {
      if (!currentUser) return;
      try {
        await runTransaction(db, async (transaction) => {
          const expenseRef = doc(db, "expenses", expenseData.id);
          const activityLogRef = doc(db, "activityLogs", activityLogId);
          transaction.set(expenseRef, { ...expenseData, updatedAt: serverTimestamp() });
          transaction.delete(activityLogRef);
        });
        await addActivityLog({ type: "expense_delete_undo", description: `Undid deletion of Expense ID ${expenseData.id}` });
        showSnackbar("Expense deletion undone!", "info");
      } catch (error) {
        console.error("Error undoing expense deletion:", error);
        showSnackbar("Failed to undo expense deletion.", "error");
        throw error;
      }
    },
    undoGuarantorDeletion: async (guarantorData, activityLogId) => {
      if (!currentUser) return;
      try {
        await runTransaction(db, async (transaction) => {
          const guarantorRef = doc(db, "guarantors", guarantorData.id);
          const activityLogRef = doc(db, "activityLogs", activityLogId);
          transaction.set(guarantorRef, { ...guarantorData, updatedAt: serverTimestamp() });
          transaction.delete(activityLogRef);
        });
        await addActivityLog({ type: "guarantor_delete_undo", description: `Undid deletion of Guarantor ID ${guarantorData.id}` });
        showSnackbar("Guarantor deletion undone!", "info");
      } catch (error) {
        console.error("Error undoing guarantor deletion:", error);
        showSnackbar("Failed to undo guarantor deletion.", "error");
        throw error;
      }
    },
    undoCommentDeletion: async (commentData, activityLogId) => {
      if (!currentUser) return;
      try {
        await runTransaction(db, async (transaction) => {
          const commentRef = doc(db, "comments", commentData.id);
          const activityLogRef = doc(db, "activityLogs", activityLogId);
          transaction.set(commentRef, { ...commentData, updatedAt: serverTimestamp() });
          transaction.delete(activityLogRef);
        });
        await addActivityLog({ type: "comment_delete_undo", description: `Undid deletion of Comment ID ${commentData.id}` });
        showSnackbar("Comment deletion undone!", "info");
      } catch (error) {
        console.error("Error undoing comment deletion:", error);
        showSnackbar("Failed to undo comment deletion.", "error");
        throw error;
      }
    },

    updateUser: async (updates) => { // Assuming updates for the current user
      if (!currentUser) return;
      try {
        const userRef = doc(db, "users", currentUser.uid); // Assuming 'users' collection with UID as doc ID
        await updateDoc(userRef, { ...updates, updatedAt: serverTimestamp() });
        await addActivityLog({ type: "user_profile_update", description: `User profile updated for ${currentUser.email}` });
        showSnackbar("User profile updated successfully!", "success");
      } catch (error) {
        console.error("Error updating user profile:", error);
        showSnackbar("Failed to update user profile.", "error");
        throw error;
      }
    },
    addActivityLog: addActivityLog // Expose the helper function
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}