import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";
import { useSnackbar } from "../components/SnackbarProvider";
import * as settingsService from "../services/settingsService";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const showSnackbar = useSnackbar();

  // Default settings
  const [settings, setSettings] = useState({
    initialCapital: 50000,
    interestRates: { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 },
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const settingsUnsub = onSnapshot(
      doc(db, "settings", "config"), 
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching settings:", err);
        setLoading(false);
      }
    );

    return () => settingsUnsub();
  }, [currentUser, authLoading]);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      await settingsService.updateSettings(db, newSettings, currentUser);
      showSnackbar("Settings updated successfully!", "success");
    } catch (error) {
      console.error("Error updating settings:", error);
      showSnackbar("Failed to update settings.", "error");
      throw error;
    }
  }, [currentUser, showSnackbar]);

  const value = useMemo(() => ({
    settings,
    loading,
    updateSettings
  }), [settings, loading, updateSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}