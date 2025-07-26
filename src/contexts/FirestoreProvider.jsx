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

const FirestoreContext = createContext();

export const useFirestore = () => useContext(FirestoreContext);

export function FirestoreProvider({ children }) {
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
      description: `Loan updated (ID: ${id})`,
      date: new Date().toISOString(),
    });
  };

  const deleteLoan = async (id) => {
    await deleteDoc(doc(db, "loans", id));
    await addActivityLog({
      description: `Loan deleted (ID: ${id})`,
      date: new Date().toISOString(),
    });
  };

  const addPayment = async (loanId, amount) => {
    const date = new Date().toISOString();
    await addDoc(collection(db, "payments"), {
      loanId,
      amount,
      date,
      createdAt: serverTimestamp(),
    });

    const loanDocRef = doc(db, "loans", loanId);
    const loanSnap = await getDoc(loanDocRef);

    if (loanSnap.exists()) {
      const loan = loanSnap.data();
      const repaidAmount = (loan.repaidAmount || 0) + amount;
      const status = repaidAmount >= loan.totalRepayable ? "Paid" : "Active";

      await updateLoan(loanId, { repaidAmount, status });
      await addActivityLog({
        description: `Payment of ZMW ${amount} added for loan ID ${loanId}`,
        date: new Date().toISOString(),
      });
    }
  };

  const getPaymentsByLoanId = async (loanId) => {
    const paymentsRef = collection(db, "payments");
    const q = query(
      paymentsRef,
      where("loanId", "==", loanId),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  const updateSettings = async (newSettings) => {
    const docRef = doc(db, "settings", "config");
    const updatesWithTimestamp = { ...newSettings, updatedAt: serverTimestamp() };
    await setDoc(docRef, updatesWithTimestamp, { merge: true });
    setSettings((prev) => ({ ...prev, ...newSettings }));
    await addActivityLog({
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

