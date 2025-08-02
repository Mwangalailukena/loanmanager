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
import { useAuth } from "./AuthProvider"; // Assuming you have an AuthProvider

const FirestoreContext = createContext();

export const useFirestore = () => useContext(FirestoreContext);

export function FirestoreProvider({ children }) {
  const { user } = useAuth(); // Get the current authenticated user
  
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState({
    initialCapital: 50000,
    interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 },
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  const addActivityLog = async (logEntry) => {
    // Add user info to every log entry
    const userDetails = {
      userId: user?.uid || "system",
      userName: user?.displayName || "System",
      userEmail: user?.email || "system",
    };

    await addDoc(collection(db, "activityLogs"), {
      ...logEntry,
      ...userDetails,
      createdAt: serverTimestamp(),
    });
  };

  useEffect(() => {
    setLoadingLoans(true);
    const q = query(collection(db, "loans"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLoans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingLoans(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
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
        setSettings({
          initialCapital: 50000,
          interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 },
        });
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "activityLogs"), orderBy("createdAt", "desc"));
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
      description: `New loan added for ${loan.borrower} (${loan.phone}).`,
      type: "loan_creation",
      loanId: docRef.id,
      borrower: loan.borrower,
      borrowerPhone: loan.phone,
    });
    return docRef;
  };

  const updateLoan = async (id, updates) => {
    const loanDocRef = doc(db, "loans", id);
    const updatesWithTimestamp = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(loanDocRef, updatesWithTimestamp);
    
    // Fetch loan details for a more descriptive log
    const loanSnap = await getDoc(loanDocRef);
    if (loanSnap.exists()) {
      const loanData = loanSnap.data();
      await addActivityLog({
        description: `Loan details updated for ${loanData.borrower} (${loanData.phone || 'No phone'}).`,
        type: "edit",
        loanId: id,
        borrower: loanData.borrower,
        borrowerPhone: loanData.phone,
      });
    } else {
      await addActivityLog({
        description: `Loan details updated for an unknown loan (ID: ${id}).`,
        type: "edit",
        loanId: id,
      });
    }
  };

  const deleteLoan = async (id) => {
    const loanDocRef = doc(db, "loans", id);
    const loanSnap = await getDoc(loanDocRef);
    const loanExists = loanSnap.exists();
    let borrowerName = "Unknown Borrower";
    let borrowerPhone = "Unknown Phone";
    
    if (loanExists) {
      const loanData = loanSnap.data();
      borrowerName = loanData.borrower;
      borrowerPhone = loanData.phone;
    }
    
    await deleteDoc(loanDocRef);
    
    await addActivityLog({
      description: `Loan for ${borrowerName} (${borrowerPhone}) was deleted.`,
      type: "delete",
      loanId: id,
      borrower: borrowerName,
      borrowerPhone: borrowerPhone,
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

      await updateDoc(loanDocRef, { repaidAmount, status });
      await addActivityLog({
        description: `Payment of ZMW ${amount.toFixed(2)} added for ${loan.borrower} (${loan.phone}).`,
        type: "payment",
        loanId: loanId,
        borrower: loan.borrower,
        borrowerPhone: loan.phone,
      });
    }
  };

  const getPaymentsByLoanId = async (loanId) => {
    const paymentsRef = collection(db, "payments");
    const q = query(
      paymentsRef,
      where("loanId", "==", loanId),
      orderBy("createdAt", "desc")
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
      description: "App settings updated.",
      type: "edit",
    });
  };
  
  const value = {
    loans,
    loadingLoans,
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
  };

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}
