// src/contexts/FirestoreProvider.js

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  limit,
  getDocs, 
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";
import { useSnackbar } from "../components/SnackbarProvider";
import { useSettings } from "./SettingsContext";
import { useBorrowers } from "./BorrowerContext";

import * as loanService from "../services/loanService";
import * as paymentService from "../services/paymentService";
import * as expenseService from "../services/expenseService";
import * as guarantorService from "../services/guarantorService";
import * as commentService from "../services/commentService";
import * as activityService from "../services/activityService";
import * as userService from "../services/userService";

const FirestoreContext = createContext();
export const useFirestore = () => useContext(FirestoreContext);

export function FirestoreProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const showSnackbar = useSnackbar();

  // Consume child contexts
  const { settings, loading: settingsLoading, updateSettings } = useSettings();
  const { 
    borrowers, 
    loading: borrowersLoading, 
    addBorrower, 
    updateBorrower, 
    undoBorrowerCreation 
  } = useBorrowers();

  // --- State ---
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  // borrowers state removed -> comes from useBorrowers
  // settings state removed -> comes from useSettings
  const [activityLogs, setActivityLogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [guarantors, setGuarantors] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching (Real-time Listeners) ---
  useEffect(() => {
    if (authLoading || !currentUser) {
      setLoading(false);
      if (!currentUser) {
        // Clear data when no user is logged in
        setLoans([]);
        setPayments([]);
        // setBorrowers([]); // Handled by BorrowerContext
        setActivityLogs([]);
        setComments([]);
        setGuarantors([]);
        setExpenses([]);
      }
      return;
    }

    setLoading(true);
    const unsubscribes = [];
    
    // Removed 'borrowers' from here
    const collectionsConfig = {
      loans: { setter: setLoans, orderByField: "startDate" },
      payments: { setter: setPayments, orderByField: "date" },
      guarantors: { setter: setGuarantors, orderByField: "name" },
      expenses: { setter: setExpenses, orderByField: "date" },
    };

    Object.entries(collectionsConfig).forEach(([colName, config]) => {
      const q = query(
        collection(db, colName), 
        where("userId", "==", currentUser.uid), 
        orderBy(config.orderByField, "desc")
      );
      
      const unsub = onSnapshot(
        q, 
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          config.setter(data);
        },
        (err) => {
          console.error(`Error fetching ${colName}:`, err);
        }
      );
      
      unsubscribes.push(unsub);
    });

    // Settings listener removed -> handled by SettingsContext

    setLoading(false);
    return () => unsubscribes.forEach((unsub) => unsub());
  }, [currentUser, authLoading]);
  
  // --- On-Demand Fetching ---
  const fetchActivityLogs = React.useCallback((limitCount = 100) => {
    if (!currentUser) return () => {};
    const q = query(
      collection(db, "activityLogs"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(limitCount) 
    );
    
    const unsub = onSnapshot(
      q, 
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setActivityLogs(data);
      }, 
      (err) => console.error("Error fetching activity logs:", err)
    );
    return unsub;
  }, [currentUser]);

  const fetchComments = React.useCallback((filters = {}) => {
    if (!currentUser) return () => {};
    const constraints = [
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    ];

    if (filters.loanId) constraints.push(where("loanId", "==", filters.loanId));
    if (filters.borrowerId) constraints.push(where("borrowerId", "==", filters.borrowerId));

    const q = query(collection(db, "comments"), ...constraints);
    
    const unsub = onSnapshot(
      q, 
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setComments(data);
      }, 
      (err) => console.error("Error fetching comments:", err)
    );
    return unsub;
  }, [currentUser]);

  const value = useMemo(() => ({
    // Composed state
    loans, 
    payments, 
    borrowers, // from context
    settings, // from context
    activityLogs, 
    comments, 
    guarantors, 
    expenses, 
    loading: loading || settingsLoading || borrowersLoading, // Aggregate loading state

    fetchActivityLogs, 
    fetchComments,

    addActivityLog: async (logEntry) => {
      try {
        await activityService.addActivityLog(db, logEntry, currentUser);
      } catch (error) {
        console.error("Failed to add activity log", error);
      }
    },
    updateActivityLog: async (id, updates) => {
       try {
         await activityService.updateActivityLog(db, id, updates, currentUser);
       } catch (error) {
         console.error("Error updating activity log:", error);
         throw error;
       }
    },

    // --- Loan Services ---
    addLoan: async (loan) => {
      try {
        const res = await loanService.addLoan(db, loan, borrowers, currentUser);
        showSnackbar("Loan added successfully!", "success");
        return res;
      } catch (error) {
        showSnackbar("Failed to add loan.", "error");
        throw error;
      }
    },
    updateLoan: async (id, updates) => {
      try {
        await loanService.updateLoan(db, id, updates, currentUser);
        showSnackbar("Loan updated successfully!", "success");
      } catch (error) {
        showSnackbar("Failed to update loan.", "error");
        throw error;
      }
    },
    deleteLoan: async (id) => {
      try {
        await loanService.deleteLoan(db, id, currentUser);
        showSnackbar("Loan deleted successfully!", "info");
      } catch (error) {
        showSnackbar("Failed to delete loan.", "error");
        throw error;
      }
    },
    markLoanAsDefaulted: async (loanId) => {
      try {
        await loanService.markLoanAsDefaulted(db, loanId, currentUser);
        showSnackbar("Loan marked as defaulted!", "success");
      } catch (error) {
        showSnackbar("Failed to mark loan as defaulted.", "error");
        throw error;
      }
    },
    refinanceLoan: async (oldLoanId, newStartDate, newDueDate, newPrincipalAmount, newInterestDuration, manualInterestRate) => {
      try {
        const res = await loanService.refinanceLoan(db, oldLoanId, newStartDate, newDueDate, newPrincipalAmount, newInterestDuration, manualInterestRate, settings, currentUser);
        showSnackbar("Loan refinanced successfully!", "success");
        return res;
      } catch (error) {
        console.error("Error refinancing loan:", error);
        showSnackbar(`Failed to refinance loan: ${error.message}`, "error");
        throw error;
      }
    },
    topUpLoan: async (loanId, topUpAmount) => {
      try {
        await loanService.topUpLoan(db, loanId, topUpAmount, currentUser);
        showSnackbar("Loan topped up successfully!", "success");
      } catch (error) {
        console.error("Error topping up loan:", error);
        showSnackbar(`Failed to top up loan: ${error.message}`, "error");
        throw error;
      }
    },
    undoLoanCreation: async (loanId, activityLogId) => {
      try {
        await loanService.undoLoanCreation(db, loanId, activityLogId, currentUser);
        showSnackbar("Loan creation undone!", "info");
      } catch (error) {
        console.error("Error undoing loan creation:", error);
        showSnackbar("Failed to undo loan creation.", "error");
        throw error;
      }
    },
    undoRefinanceLoan: async (newLoanId, oldLoanId, activityLogId) => {
      try {
        await loanService.undoRefinanceLoan(db, newLoanId, oldLoanId, activityLogId, currentUser);
        showSnackbar("Loan refinance undone!", "info");
      } catch (error) {
        console.error("Error undoing loan refinance:", error);
        showSnackbar("Failed to undo loan refinance.", "error");
        throw error;
      }
    },
    undoTopUpLoan: async (loanId, previousLoanData, activityLogId) => {
      try {
        await loanService.undoTopUpLoan(db, loanId, previousLoanData, activityLogId, currentUser);
        showSnackbar("Top-up undone successfully!", "info");
      } catch (error) {
        console.error("Error undoing loan top-up:", error);
        showSnackbar("Failed to undo loan top-up.", "error");
        throw error;
      }
    },
    undoDeleteLoan: async (loanData, activityLogId) => {
      try {
        await loanService.undoDeleteLoan(db, loanData, activityLogId, currentUser);
        showSnackbar("Loan deletion undone!", "info");
      } catch (error) {
        console.error("Error undoing loan deletion:", error);
        showSnackbar("Failed to undo loan deletion.", "error");
        throw error;
      }
    },
    undoUpdateLoan: async (loanId, previousLoanData, activityLogId) => {
      try {
        await loanService.undoUpdateLoan(db, loanId, previousLoanData, activityLogId, currentUser);
        showSnackbar("Loan update undone!", "info");
      } catch (error) {
        console.error("Error undoing loan update:", error);
        showSnackbar("Failed to undo loan update.", "error");
        throw error;
      }
    },

    // --- Payment Services ---
    addPayment: async (loanId, amount) => {
      try {
        await paymentService.addPayment(db, loanId, amount, currentUser);
        showSnackbar("Payment added successfully!", "success");
      } catch (error) {
        showSnackbar("Failed to add payment.", "error");
        throw error;
      }
    },
    getPaymentsByLoanId: async (loanId) => {
      try {
        return await paymentService.getPaymentsByLoanId(db, loanId, currentUser);
      } catch (error) {
        console.error("Error fetching payments by loan ID:", error);
        showSnackbar("Failed to fetch payment history.", "error");
        return [];
      }
    },
    getLoanHistory: async (loanId) => {
      if (!currentUser) return [];
      try {
        // 1. Fetch Payments
        const paymentsQuery = query(
          collection(db, "payments"),
          where("userId", "==", currentUser.uid),
          where("loanId", "==", loanId)
        );
        const paymentSnaps = await getDocs(paymentsQuery);
        const payments = paymentSnaps.docs.map(d => ({ 
          id: d.id, 
          ...d.data(), 
          historyType: 'payment' 
        }));

        // 2. Fetch Top-ups from Activity Logs
        const topupsQuery = query(
          collection(db, "activityLogs"),
          where("userId", "==", currentUser.uid),
          where("relatedId", "==", loanId),
          where("type", "==", "loan_top_up")
        );
        const topupSnaps = await getDocs(topupsQuery);
        const topups = topupSnaps.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            date: data.createdAt,
            historyType: 'topup',
            amount: data.amount || 0
          };
        });

        // 3. Combine and Sort
        const combined = [...payments, ...topups].sort((a, b) => {
          const dateA = a.date?.seconds || a.createdAt?.seconds || 0;
          const dateB = b.date?.seconds || b.createdAt?.seconds || 0;
          return dateB - dateA; // Descending (newest first)
        });

        return combined;
      } catch (error) {
        console.error("Error fetching loan history:", error);
        return [];
      }
    },
    undoPayment: async (paymentId, loanId, paymentAmount, activityLogId) => {
      try {
        await paymentService.undoPayment(db, paymentId, loanId, paymentAmount, activityLogId, currentUser);
        showSnackbar("Payment undone successfully!", "info");
      } catch (error) {
        console.error("Error undoing payment:", error);
        showSnackbar("Failed to undo payment.", "error");
        throw error;
      }
    },

    // --- Borrower Services (Proxied from context) ---
    addBorrower, 
    updateBorrower, 
    undoBorrowerCreation,

    // --- Expense Services ---
    addExpense: async (expense) => {
      try {
        const res = await expenseService.addExpense(db, expense, currentUser);
        showSnackbar("Expense added successfully!", "success");
        return res;
      } catch (error) {
        showSnackbar("Failed to add expense.", "error");
        throw error;
      }
    },
    updateExpense: async (id, updates) => {
      try {
        await expenseService.updateExpense(db, id, updates, currentUser);
        showSnackbar("Expense updated successfully!", "success");
      } catch (error) {
        showSnackbar("Failed to update expense.", "error");
        throw error;
      }
    },
    deleteExpense: async (id) => {
      try {
        await expenseService.deleteExpense(db, id, currentUser);
        showSnackbar("Expense deleted successfully!", "info");
      } catch (error) {
        showSnackbar("Failed to delete expense.", "error");
        throw error;
      }
    },
    undoExpenseCreation: async (expenseId, activityLogId) => {
      try {
        await expenseService.undoExpenseCreation(db, expenseId, activityLogId, currentUser);
        showSnackbar("Expense creation undone!", "info");
      } catch (error) {
        console.error("Error undoing expense creation:", error);
        showSnackbar("Failed to undo expense creation.", "error");
        throw error;
      }
    },
    undoExpenseDeletion: async (expenseData, activityLogId) => {
      try {
        await expenseService.undoExpenseDeletion(db, expenseData, activityLogId, currentUser);
        showSnackbar("Expense deletion undone!", "info");
      } catch (error) {
        console.error("Error undoing expense deletion:", error);
        showSnackbar("Failed to undo expense deletion.", "error");
        throw error;
      }
    },

    // --- Guarantor Services ---
    addGuarantor: async (guarantor) => {
      try {
        const res = await guarantorService.addGuarantor(db, guarantor, currentUser);
        showSnackbar("Guarantor added successfully!", "success");
        return res;
      } catch (error) {
        showSnackbar("Failed to add guarantor.", "error");
        throw error;
      }
    },
    updateGuarantor: async (id, updates) => {
      try {
        await guarantorService.updateGuarantor(db, id, updates, currentUser);
        showSnackbar("Guarantor updated successfully!", "success");
      } catch (error) {
        showSnackbar("Failed to update guarantor.", "error");
        throw error;
      }
    },
    deleteGuarantor: async (id) => {
      try {
        await guarantorService.deleteGuarantor(db, id, currentUser);
        showSnackbar("Guarantor deleted successfully!", "info");
      } catch (error) {
        showSnackbar("Failed to delete guarantor.", "error");
        throw error;
      }
    },
    undoGuarantorCreation: async (guarantorId, activityLogId) => {
      try {
        await guarantorService.undoGuarantorCreation(db, guarantorId, activityLogId, currentUser);
        showSnackbar("Guarantor creation undone!", "info");
      } catch (error) {
        console.error("Error undoing guarantor creation:", error);
        showSnackbar("Failed to undo guarantor creation.", "error");
        throw error;
      }
    },
    undoGuarantorDeletion: async (guarantorData, activityLogId) => {
      try {
        await guarantorService.undoGuarantorDeletion(db, guarantorData, activityLogId, currentUser);
        showSnackbar("Guarantor deletion undone!", "info");
      } catch (error) {
        console.error("Error undoing guarantor deletion:", error);
        showSnackbar("Failed to undo guarantor deletion.", "error");
        throw error;
      }
    },

    // --- Comment Services ---
    addComment: async (comment) => {
      try {
        const res = await commentService.addComment(db, comment, currentUser);
        showSnackbar("Comment added successfully!", "success");
        return res;
      } catch (error) {
        showSnackbar("Failed to add comment.", "error");
        throw error;
      }
    },
    deleteComment: async (id) => {
      try {
        await commentService.deleteComment(db, id, currentUser);
        showSnackbar("Comment deleted successfully!", "info");
      } catch (error) {
        showSnackbar("Failed to delete comment.", "error");
        throw error;
      }
    },
    undoCommentCreation: async (commentId, activityLogId) => {
      try {
        await commentService.undoCommentCreation(db, commentId, activityLogId, currentUser);
        showSnackbar("Comment creation undone!", "info");
      } catch (error) {
        console.error("Error undoing comment creation:", error);
        showSnackbar("Failed to undo comment creation.", "error");
        throw error;
      }
    },
    undoCommentDeletion: async (commentData, activityLogId) => {
      try {
        await commentService.undoCommentDeletion(db, commentData, activityLogId, currentUser);
        showSnackbar("Comment deletion undone!", "info");
      } catch (error) {
        console.error("Error undoing comment deletion:", error);
        showSnackbar("Failed to undo comment deletion.", "error");
        throw error;
      }
    },

    // --- Settings Services (Proxied from context) ---
    updateSettings,

    // --- User Services ---
    updateUser: async (updates) => {
      try {
        await userService.updateUser(db, updates, currentUser);
        showSnackbar("User profile updated successfully!", "success");
      } catch (error) {
        console.error("Error updating user profile:", error);
        showSnackbar("Failed to update user profile.", "error");
        throw error;
      }
    }
  }), [
    loans, payments, borrowers, settings, activityLogs, comments, guarantors, expenses, loading,
    settingsLoading, borrowersLoading,
    currentUser, showSnackbar, fetchActivityLogs, fetchComments,
    updateSettings, addBorrower, updateBorrower, undoBorrowerCreation
  ]);

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}
