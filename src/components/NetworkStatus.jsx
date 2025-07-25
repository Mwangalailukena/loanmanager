import React, { useEffect, useState } from "react";

export default function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
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
  );
}
