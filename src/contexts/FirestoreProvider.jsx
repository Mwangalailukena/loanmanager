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
  getDoc,
  getDocs,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";
import dayjs from "dayjs";

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

  const addActivityLog = async (logEntry) => {
    await addDoc(collection(db, "activityLogs"), {
      ...logEntry,
      user: currentUser?.displayName || currentUser?.email || "System",
      createdAt: serverTimestamp(),
    });
  };

  useEffect(() => {
    const q = query(collection(db, "loans"), orderBy("startDate", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLoans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "payments"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, "settings", "config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        await setDoc(docRef, {
          initialCapital: 50000,
          interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "activityLogs"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setActivityLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
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

  // === START OF CORRECTED CODE ===
  // This function now correctly calculates the loan status based on all
  // relevant factors (paid amount and due date) before updating the document.
  const addPayment = async (loanId, amount) => {
    const date = new Date().toISOString();
    
    // Use Promise.all to ensure both async operations (addDoc and updateLoan) complete
    // before the function returns. This is more robust than a simple sequential await.
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
      return true; // Return a value to indicate success
    }
  };
  // === END OF CORRECTED CODE ===

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

  return (
    <FirestoreContext.Provider
      value={{
        loans,
        payments,
        settings,
        activityLogs,
        addLoan,
        updateLoan,
        deleteLoan,
        addPayment,
        getPaymentsByLoanId,
        updateSettings,
        addActivityLog,
      }}
    >
      {children}
    </FirestoreContext.Provider>
  );
}
