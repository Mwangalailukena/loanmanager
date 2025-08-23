// src/contexts/FirestoreProvider.js

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const FirestoreContext = createContext();
export const useFirestore = () => useContext(FirestoreContext);

export function FirestoreProvider({ children }) {
  const { currentUser } = useAuth();

  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState({
    initialCapital: 50000,
    interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 },
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // This ref tracks if notifications have been shown during this session.
  const toastsShownRef = useRef(false);

  const addActivityLog = async (logEntry) => {
    await addDoc(collection(db, "activityLogs"), {
      ...logEntry,
      user: currentUser?.displayName || currentUser?.email || "System",
      createdAt: serverTimestamp(),
    });
  };

  useEffect(() => {
    const unsubscribes = [];
    const dbRef = db;

    const loansUnsub = onSnapshot(query(collection(dbRef, "loans"), orderBy("startDate", "desc")), (snap) => {
      const loanData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLoans(loanData);
      setLoading(false);

      // --- START OF NEW NOTIFICATION LOGIC ---
      // This logic now lives here, running only once per session due to the ref
      if (loanData.length > 0 && !toastsShownRef.current) {
        const now = dayjs();
        const UPCOMING_LOAN_THRESHOLD_DAYS = 3;
        const upcomingDueThreshold = now.add(UPCOMING_LOAN_THRESHOLD_DAYS, "day");

        const calcStatus = (loan) => {
          const totalRepayable = Number(loan.totalRepayable || 0);
          const repaidAmount = Number(loan.repaidAmount || 0);

          if (repaidAmount >= totalRepayable && totalRepayable > 0) {
            return "Paid";
          }
          const due = dayjs(loan.dueDate);
          if (due.isBefore(now, "day")) {
            return "Overdue";
          }
          return "Active";
        };

        const upcomingLoans = loanData.filter(
          (l) =>
            calcStatus(l) === "Active" &&
            dayjs(l.dueDate).isAfter(now) &&
            dayjs(l.dueDate).isBefore(upcomingDueThreshold)
        );

        const overdueLoansList = loanData.filter((l) => calcStatus(l) === "Overdue");

        if (upcomingLoans.length > 0) {
          toast.info(
            `You have ${upcomingLoans.length} loan(s) due within ${UPCOMING_LOAN_THRESHOLD_DAYS} days!`
          );
        }
        if (overdueLoansList.length > 0) {
          toast.error(
            `You have ${overdueLoansList.length} overdue loan(s)! Please take action.`
          );
        }
        toastsShownRef.current = true;
      }
      // --- END OF NEW NOTIFICATION LOGIC ---

    }, (error) => {
      console.error("Error fetching loans:", error);
      setLoading(false);
    });
    unsubscribes.push(loansUnsub);

    // Listener for payments
    const paymentsUnsub = onSnapshot(query(collection(dbRef, "payments"), orderBy("date", "desc")), (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Error fetching payments:", error);
    });
    unsubscribes.push(paymentsUnsub);

    // Listener for settings
    const settingsUnsub = onSnapshot(doc(dbRef, "settings", "config"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        setDoc(doc(dbRef, "settings", "config"), {
          initialCapital: 50000,
          interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }, (error) => {
      console.error("Error fetching settings:", error);
    });
    unsubscribes.push(settingsUnsub);

    // Listener for activity logs
    const activityUnsub = onSnapshot(query(collection(dbRef, "activityLogs"), orderBy("date", "desc")), (snap) => {
      setActivityLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Error fetching activity logs:", error);
    });
    unsubscribes.push(activityUnsub);

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const addLoan = async (loan) => {
    const loanWithTimestamps = {
      ...loan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "loans"), loanWithTimestamps);
    await addActivityLog({
      type: "loan_creation",
      description: `Loan added for ${loan.borrower}`,
      date: new Date().toISOString(),
    });
    return docRef;
  };

  const updateLoan = async (id, updates) => {
    const docRef = doc(db, "loans", id);
    const updatesWithTimestamp = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(docRef, updatesWithTimestamp);
    await addActivityLog({
      type: "edit",
      description: `Loan updated (ID: ${id})`,
      date: new Date().toISOString(),
    });
  };

  const deleteLoan = async (id) => {
    await deleteDoc(doc(db, "loans", id));
    await addActivityLog({
      type: "delete",
      description: `Loan deleted (ID: ${id})`,
      date: new Date().toISOString(),
    });
  };

  const addPayment = async (loanId, amount) => {
    const date = new Date().toISOString();

    const [loanSnap] = await Promise.all([
      getDoc(doc(db, "loans", loanId)),
      addDoc(collection(db, "payments"), {
        loanId,
        amount,
        date,
        createdAt: serverTimestamp(),
      }),
    ]);

    if (loanSnap.exists()) {
      const loan = loanSnap.data();
      const repaidAmount = (loan.repaidAmount || 0) + amount;

      let newStatus = "Active";
      if (repaidAmount >= loan.totalRepayable && loan.totalRepayable > 0) {
        newStatus = "Paid";
      } else {
        const now = dayjs();
        const due = dayjs(loan.dueDate);
        if (due.isBefore(now, "day")) {
          newStatus = "Overdue";
        }
      }

      await updateLoan(loanId, { repaidAmount, status: newStatus });
      await addActivityLog({
        type: "payment",
        description: `Payment of ZMW ${amount} added for loan ID ${loanId}`,
        date: new Date().toISOString(),
      });
      return true;
    }
  };

  const getPaymentsByLoanId = async (loanId) => {
    const paymentsRef = collection(db, "payments");
    const q = query(paymentsRef, where("loanId", "==", loanId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  const updateSettings = async (newSettings) => {
    const docRef = doc(db, "settings", "config");
    const updatesWithTimestamp = { ...newSettings, updatedAt: serverTimestamp() };
    await setDoc(docRef, updatesWithTimestamp, { merge: true });
    setSettings((prev) => ({ ...prev, ...newSettings }));
    await addActivityLog({
      type: "settings_update",
      description: "Settings updated",
      date: new Date().toISOString(),
    });
  };

  const value = {
    loans,
    payments,
    settings,
    activityLogs,
    loading,
    addLoan,
    updateLoan,
    deleteLoan,
    addPayment,
    getPaymentsByLoanId,
    updateSettings,
    addActivityLog,
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}
