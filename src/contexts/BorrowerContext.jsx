import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";
import { useSnackbar } from "../components/SnackbarProvider";
import * as borrowerService from "../services/borrowerService";

const BorrowerContext = createContext();

export const useBorrowers = () => useContext(BorrowerContext);

export function BorrowerProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const showSnackbar = useSnackbar();

  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setBorrowers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, "borrowers"), 
      where("userId", "==", currentUser.uid), 
      orderBy("name", "desc")
    );
    
    const unsub = onSnapshot(
      q, 
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBorrowers(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching borrowers:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser, authLoading]);

  const addBorrower = useCallback(async (borrower) => {
    try {
      const res = await borrowerService.addBorrower(db, borrower, currentUser);
      showSnackbar("Borrower added successfully!", "success");
      return res;
    } catch (error) {
      showSnackbar("Failed to add borrower.", "error");
      throw error;
    }
  }, [currentUser, showSnackbar]);

  const updateBorrower = useCallback(async (id, updates) => {
    try {
      await borrowerService.updateBorrower(db, id, updates);
      showSnackbar("Borrower updated!", "success");
    } catch (error) {
      console.error("Error updating borrower:", error);
      showSnackbar("Failed to update borrower.", "error");
      throw error;
    }
  }, [showSnackbar]);

  const undoBorrowerCreation = useCallback(async (borrowerId, activityLogId) => {
    try {
      await borrowerService.undoBorrowerCreation(db, borrowerId, activityLogId, currentUser);
      showSnackbar("Borrower creation undone!", "info");
    } catch (error) {
      console.error("Error undoing borrower creation:", error);
      showSnackbar("Failed to undo borrower creation.", "error");
      throw error;
    }
  }, [currentUser, showSnackbar]);

  const value = useMemo(() => ({
    borrowers,
    loading,
    addBorrower,
    updateBorrower,
    undoBorrowerCreation
  }), [borrowers, loading, addBorrower, updateBorrower, undoBorrowerCreation]);

  return (
    <BorrowerContext.Provider value={value}>
      {children}
    </BorrowerContext.Provider>
  );
}