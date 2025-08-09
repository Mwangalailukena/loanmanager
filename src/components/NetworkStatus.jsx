import React, { useEffect, useRef } from "react";
import useOfflineStatus from "../hooks/useOfflineStatus";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { syncPendingData } from "../utils/offlineQueue";
import { showToast } from "./toastConfig";

export default function NetworkStatus() {
  const isOnline = useOfflineStatus(1000);
  const wasOffline = useRef(false);
  const syncInProgress = useRef(false);
  const syncExecutedOnce = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      syncExecutedOnce.current = false;
      showToast("You're offline. Changes will sync once you're back online.", "warning");
    } else if (isOnline && wasOffline.current) {
      if (!syncExecutedOnce.current) {
        syncExecutedOnce.current = true;
        wasOffline.current = false;

        if (!syncInProgress.current) {
          syncInProgress.current = true;
          showToast("You're back online. Syncing data...", "info");

          syncPendingData()
            .then(() => {
              showToast("Offline data synced successfully!", "success");
            })
            .catch((err) => {
              console.error("Failed to sync offline data:", err);
              showToast("Failed to sync offline data. Please try again.", "error");
            })
            .finally(() => {
              syncInProgress.current = false;
            });
        }
      }
    }
  }, [isOnline]);

  return (
    <>
      {!isOnline && (
        <div
          style={{
            backgroundColor: "#f44336",
            color: "white",
            padding: "0.5rem",
            textAlign: "center",
            fontWeight: "bold",
          }}
          role="alert"
        >
          You are offline. Some features may not be available.
        </div>
      )}
      <ToastContainer />
    </>
  );
}
