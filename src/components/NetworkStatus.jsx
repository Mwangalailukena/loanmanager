import React, { useEffect, useRef } from "react";
import useOfflineStatus from "../hooks/useOfflineStatus";
import { useSnackbar } from "./SnackbarProvider";

export default function NetworkStatus() {
  const isOnline = useOfflineStatus(1000);
  const wasOffline = useRef(false);
  const showSnackbar = useSnackbar();

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      showSnackbar("You're offline. Changes will sync once you're back online.", "warning");
    } else if (isOnline && wasOffline.current) {
      wasOffline.current = false;
      showSnackbar("You're back online.", "info");
    }
  }, [isOnline, showSnackbar]);

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
    </>
  );
}
