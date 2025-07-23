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
import { db } from "../firebase";  // Make sure this is your firebase config export

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

  // Add activity log function here, before usage
  const addActivity = async (description) => {
    await addDoc(collection(db, "activityLogs"), {
      description,
      date: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  };

  // Real-time listener for loans collection
  useEffect(() => {
    const q = query(collection(db, "loans"), orderBy("startDate", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLoans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Real-time listener for payments collection
  useEffect(() => {
    const q = query(collection(db, "payments"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Load settings once on mount
  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, "settings", "config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // Create default settings if not exist
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

  // Real-time listener for activityLogs collection
  useEffect(() => {
    const q = query(collection(db, "activityLogs"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setActivityLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Add a new loan
  const addLoan = async (loan) => {
    const loanWithTimestamps = {
      ...loan,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "loans"), loanWithTimestamps);
    await addActivity(`Loan added for ${loan.borrower}`);
    return docRef;
  };

  // Update an existing loan
  const updateLoan = async (id, updates) => {
    const docRef = doc(db, "loans", id);
    const updatesWithTimestamp = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(docRef, updatesWithTimestamp);
    await addActivity(`Loan updated (ID: ${id})`);
  };

  // Delete a loan
  const deleteLoan = async (id) => {
    await deleteDoc(doc(db, "loans", id));
    await addActivity(`Loan deleted (ID: ${id})`);
  };

  // Add a payment and update loan status/amount
  const addPayment = async (loanId, amount) => {
    const date = new Date().toISOString();
    // Add payment record
    await addDoc(collection(db, "payments"), {
      loanId,
      amount,
      date,
      createdAt: serverTimestamp(),
    });

    // Fetch fresh loan data
    const loanDocRef = doc(db, "loans", loanId);
    const loanSnap = await getDoc(loanDocRef);

    if (loanSnap.exists()) {
      const loan = loanSnap.data();
      const repaidAmount = (loan.repaidAmount || 0) + amount;
      const status = repaidAmount >= loan.totalRepayable ? "Paid" : "Active";

      // Update loan repayment and status
      await updateLoan(loanId, { repaidAmount, status });
      await addActivity(`Payment of ZMW ${amount} added for loan ID ${loanId}`);
    }
  };

  // Fetch payments by loan ID
  const getPaymentsByLoanId = async (loanId) => {
    const paymentsRef = collection(db, "payments");
    const q = query(paymentsRef, where("loanId", "==", loanId), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  // Update app settings
  const updateSettings = async (newSettings) => {
    const docRef = doc(db, "settings", "config");
    const updatesWithTimestamp = { ...newSettings, updatedAt: serverTimestamp() };
    await setDoc(docRef, updatesWithTimestamp, { merge: true });
    setSettings((prev) => ({ ...prev, ...newSettings }));
    await addActivity("Settings updated");
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
      }}
    >
      {children}
    </FirestoreContext.Provider>
  );
}

