// src/contexts/FirestoreProvider.js

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
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

const CACHE_KEYS = ["loans", "payments", "borrowers", "expenses"];

export function FirestoreProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const showSnackbar = useSnackbar();
  const isOnline = useOfflineStatus();

  // ---- State ----
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
  const [offlineReady, setOfflineReady] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | offline

  const activeListeners = useRef(0);

  // ---- Utilities ----
  const toMillis = (t) => (t?.toMillis ? t.toMillis() : t?.seconds ? t.seconds * 1000 : 0);

  const loadCachedData = useCallback(async () => {
    try {
      const results = await Promise.all(
        CACHE_KEYS.map((k) => localforage.getItem(k))
      );

      const [cLoans, cPayments, cBorrowers, cExpenses] = results;

      if (cLoans) setLoans(cLoans);
      if (cPayments) setPayments(cPayments);
      if (cBorrowers) setBorrowers(cBorrowers);
      if (cExpenses) setExpenses(cExpenses);

      setOfflineReady(true);
    } catch (err) {
      console.error("Failed to load offline cache", err);
    }
  }, []);

  // ---- Real-time listeners ----
  useEffect(() => {
    let unsubscribes = [];

    const setupListeners = async () => {
      if (authLoading || !currentUser) return;

      setLoading(true);

      if (!isOnline) {
        setSyncStatus("offline");
        await loadCachedData();
        setLoading(false);
        return;
      }

      setSyncStatus("syncing");

      const collectionsConfig = {
        loans: { setter: setLoans, cacheKey: "loans", orderByField: "startDate" },
        payments: { setter: setPayments, cacheKey: "payments", orderByField: "date" },
        borrowers: { setter: setBorrowers, cacheKey: "borrowers", orderByField: "name" },
        guarantors: { setter: setGuarantors, cacheKey: null, orderByField: "name" },
        expenses: { setter: setExpenses, cacheKey: "expenses", orderByField: "date" },
      };

      activeListeners.current = 0;
      const expectedListeners = Object.keys(collectionsConfig).length + 1;

      const handleFirstSnapshot = () => {
        activeListeners.current += 1;
        if (activeListeners.current === expectedListeners) {
          setLoading(false);
          setSyncStatus("synced");
          setLastSyncAt(new Date());
        }
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
            handleFirstSnapshot();
          },
          (err) => console.error(`Error fetching ${colName}:`, err)
        );

        unsubscribes.push(unsub);
      });

      const settingsUnsub = onSnapshot(doc(db, "settings", "config"), (docSnap) => {
        if (docSnap.exists()) setSettings(docSnap.data());
        handleFirstSnapshot();
      });

      unsubscribes.push(settingsUnsub);
    };

    setupListeners();

    return () => {
      unsubscribes.forEach((u) => u());
    };
  }, [currentUser, authLoading, isOnline, loadCachedData]);

  // ---- On-demand fetching ----
  const fetchActivityLogs = useCallback(
    (limitCount = 100) => {
      if (!currentUser) return () => {};

      const q = query(
        collection(db, "activityLogs"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      return onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setActivityLogs(data);
      });
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
      if (filters.borrowerId) constraints.push(where("borrowerId", "==", filters.borrowerId));

      const q = query(collection(db, "comments"), ...constraints);

      return onSnapshot(q, (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setComments(data);
      });
    },
    [currentUser]
  );

  // ---- Context value ----
  const value = useMemo(
    () => ({
      // existing
      loans,
      payments,
      borrowers,
      settings,
      activityLogs,
      comments,
      guarantors,
      expenses,
      loading,

      // new (phase 2)
      offlineReady,
      isOnline,
      lastSyncAt,
      syncStatus,

      fetchActivityLogs,
      fetchComments,

      addActivityLog: (log) => activityService.addActivityLog(db, log, currentUser),
      updateActivityLog: (id, u) => activityService.updateActivityLog(db, id, u, currentUser),

      // ---- Loan Services ----
      addLoan: (l) => loanService.addLoan(db, l, borrowers, currentUser),
      updateLoan: (id, u) => loanService.updateLoan(db, id, u, currentUser),
      deleteLoan: (id) => loanService.deleteLoan(db, id, currentUser),
      markLoanAsDefaulted: (id) => loanService.markLoanAsDefaulted(db, id, currentUser),
      refinanceLoan: (...args) =>
        loanService.refinanceLoan(db, ...args, settings, currentUser),
      topUpLoan: (id, amt) => loanService.topUpLoan(db, id, amt, currentUser),
      undoLoanCreation: (...a) => loanService.undoLoanCreation(db, ...a, currentUser),
      undoRefinanceLoan: (...a) => loanService.undoRefinanceLoan(db, ...a, currentUser),
      undoTopUpLoan: (...a) => loanService.undoTopUpLoan(db, ...a, currentUser),
      undoDeleteLoan: (...a) => loanService.undoDeleteLoan(db, ...a, currentUser),
      undoUpdateLoan: (...a) => loanService.undoUpdateLoan(db, ...a, currentUser),

      // ---- Payments ----
      addPayment: (id, amt) => paymentService.addPayment(db, id, amt, currentUser),
      getPaymentsByLoanId: (id) => paymentService.getPaymentsByLoanId(db, id, currentUser),

      getLoanHistory: async (loanId) => {
        if (!currentUser) return [];
        const paymentsQuery = query(
          collection(db, "payments"),
          where("userId", "==", currentUser.uid),
          where("loanId", "==", loanId)
        );

        const paymentSnaps = await getDocs(paymentsQuery);
        const payments = paymentSnaps.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          historyType: "payment",
        }));

        const topupsQuery = query(
          collection(db, "activityLogs"),
          where("userId", "==", currentUser.uid),
          where("relatedId", "==", loanId),
          where("type", "==", "loan_top_up")
        );

        const topupSnaps = await getDocs(topupsQuery);
        const topups = topupSnaps.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          historyType: "topup",
          date: d.data().createdAt,
        }));

        return [...payments, ...topups].sort(
          (a, b) => toMillis(b.date || b.createdAt) - toMillis(a.date || a.createdAt)
        );
      },

      undoPayment: (...a) => paymentService.undoPayment(db, ...a, currentUser),

      // ---- Borrowers ----
      addBorrower: (b) => borrowerService.addBorrower(db, b, currentUser),
      updateBorrower: (id, u) => borrowerService.updateBorrower(db, id, u),
      undoBorrowerCreation: (...a) =>
        borrowerService.undoBorrowerCreation(db, ...a, currentUser),

      // ---- Expenses ----
      addExpense: (e) => expenseService.addExpense(db, e, currentUser),
      updateExpense: (id, u) => expenseService.updateExpense(db, id, u, currentUser),
      deleteExpense: (id) => expenseService.deleteExpense(db, id, currentUser),
      undoExpenseCreation: (...a) =>
        expenseService.undoExpenseCreation(db, ...a, currentUser),
      undoExpenseDeletion: (...a) =>
        expenseService.undoExpenseDeletion(db, ...a, currentUser),

      // ---- Guarantors ----
      addGuarantor: (g) => guarantorService.addGuarantor(db, g, currentUser),
      updateGuarantor: (id, u) => guarantorService.updateGuarantor(db, id, u, currentUser),
      deleteGuarantor: (id) => guarantorService.deleteGuarantor(db, id, currentUser),
      undoGuarantorCreation: (...a) =>
        guarantorService.undoGuarantorCreation(db, ...a, currentUser),
      undoGuarantorDeletion: (...a) =>
        guarantorService.undoGuarantorDeletion(db, ...a, currentUser),

      // ---- Comments ----
      addComment: (c) => commentService.addComment(db, c, currentUser),
      deleteComment: (id) => commentService.deleteComment(db, id, currentUser),
      undoCommentCreation: (...a) =>
        commentService.undoCommentCreation(db, ...a, currentUser),
      undoCommentDeletion: (...a) =>
        commentService.undoCommentDeletion(db, ...a, currentUser),

      // ---- Settings ----
      updateSettings: (s) => settingsService.updateSettings(db, s, currentUser),

      // ---- User ----
      updateUser: (u) => userService.updateUser(db, u, currentUser),
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
      offlineReady,
      isOnline,
      lastSyncAt,
      syncStatus,
      currentUser,
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