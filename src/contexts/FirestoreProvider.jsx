import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";
import { useSnackbar } from "../components/SnackbarProvider";
import localforage from "localforage";
import useOfflineStatus from "../hooks/useOfflineStatus";

import * as loanService from "../services/loanService";
import * as paymentService from "../services/paymentService";
import * as borrowerService from "../services/borrowerService";
import * as expenseService from "../services/expenseService";
import * as guarantorService from "../services/guarantorService";
import * as commentService from "../services/commentService";
import * as settingsService from "../services/settingsService";
import * as activityService from "../services/activityService";
import * as userService from "../services/userService";

const FirestoreContext = createContext();
export const useFirestore = () => useContext(FirestoreContext);

export function FirestoreProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
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

  // --- Real-time listeners ---
  useEffect(() => {
    if (authLoading || !currentUser || !isOnline) {
      setLoading(false);

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

      const unsub = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          config.setter(data);
          if (config.cacheKey) localforage.setItem(config.cacheKey, data);
        },
        (err) => console.error(`Error fetching ${colName}:`, err)
      );

      unsubscribes.push(unsub);
    });

    const settingsUnsub = onSnapshot(doc(db, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data());
    });
    unsubscribes.push(settingsUnsub);

    setLoading(false);
    return () => unsubscribes.forEach((u) => u());
  }, [currentUser, authLoading, isOnline]);

  // --- On-demand fetching ---
  const fetchActivityLogs = useCallback(
    (limitCount = 100) => {
      if (!currentUser) return () => {};

      const q = query(
        collection(db, "activityLogs"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      return onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setActivityLogs(data);
        },
        (err) => console.error("Error fetching activity logs:", err)
      );
    },
    [currentUser]
  );

  const fetchComments = useCallback(
    (filters = {}) => {
      if (!currentUser) return () => {};

      const constraints = [
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
      ];

      if (filters.loanId) constraints.push(where("loanId", "==", filters.loanId));
      if (filters.borrowerId)
        constraints.push(where("borrowerId", "==", filters.borrowerId));

      const q = query(collection(db, "comments"), ...constraints);

      return onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setComments(data);
        },
        (err) => console.error("Error fetching comments:", err)
      );
    },
    [currentUser]
  );

  // --- Context value ---
  const value = useMemo(
    () => ({
      loans,
      payments,
      borrowers,
      settings,
      activityLogs,
      comments,
      guarantors,
      expenses,
      loading,
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

      // ---------------- Loans ----------------
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

      refinanceLoan: async (
        oldLoanId,
        newStartDate,
        newDueDate,
        newPrincipalAmount,
        newInterestDuration,
        manualInterestRate
      ) => {
        try {
          const res = await loanService.refinanceLoan(
            db,
            oldLoanId,
            newStartDate,
            newDueDate,
            newPrincipalAmount,
            newInterestDuration,
            manualInterestRate,
            settings,
            currentUser
          );
          showSnackbar("Loan refinanced successfully!", "success");
          return res;
        } catch (error) {
          showSnackbar(`Failed to refinance loan: ${error.message}`, "error");
          throw error;
        }
      },

      topUpLoan: async (loanId, topUpAmount) => {
        try {
          await loanService.topUpLoan(db, loanId, topUpAmount, currentUser);
          showSnackbar("Loan topped up successfully!", "success");
        } catch (error) {
          showSnackbar(`Failed to top up loan: ${error.message}`, "error");
          throw error;
        }
      },

      // ---------------- Payments ----------------
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
          showSnackbar("Failed to fetch payment history.", "error");
          return [];
        }
      },

      // ---------------- Borrowers ----------------
      addBorrower: async (borrower) => {
        try {
          const res = await borrowerService.addBorrower(db, borrower, currentUser);
          showSnackbar("Borrower added successfully!", "success");
          return res;
        } catch (error) {
          showSnackbar("Failed to add borrower.", "error");
          throw error;
        }
      },

      // ---------------- Expenses ----------------
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

      // ---------------- Settings ----------------
      updateSettings: async (newSettings) => {
        try {
          await settingsService.updateSettings(db, newSettings, currentUser);
          showSnackbar("Settings updated successfully!", "success");
        } catch (error) {
          showSnackbar("Failed to update settings.", "error");
          throw error;
        }
      },

      // ---------------- User ----------------
      updateUser: async (updates) => {
        try {
          await userService.updateUser(db, updates, currentUser);
          showSnackbar("User profile updated successfully!", "success");
        } catch (error) {
          showSnackbar("Failed to update user profile.", "error");
          throw error;
        }
      },
    }),
    [
      loans,
      payments,
      borrowers,
      settings,
      activityLogs,
      comments,
      guarantors,
      expenses,
      loading,
      currentUser,
      showSnackbar,
      fetchActivityLogs,
      fetchComments,
    ]
  );

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}