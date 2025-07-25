#!/bin/bash

# 1. Add service-worker.js to public folder
mkdir -p public
cat > public/service-worker.js << 'EOF'
const CACHE_NAME = "loan-manager-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/manifest.json",
  // Add more assets here if needed
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Removing old cache", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
EOF

echo "Created public/service-worker.js"

# 2. Modify src/firebase.js to enable Firestore offline persistence
if [ -f src/firebase.js ]; then
  echo "Updating src/firebase.js to enable offline persistence..."

  # Insert enableIndexedDbPersistence logic after Firestore initialization
  # Backup original file
  cp src/firebase.js src/firebase.js.bak

  # Check if enableIndexedDbPersistence already exists, if not, add it
  if ! grep -q "enableIndexedDbPersistence" src/firebase.js; then
    sed -i "/getFirestore/a import { enableIndexedDbPersistence } from 'firebase/firestore';" src/firebase.js

    # Append persistence code after db initialization (assumes db is const db = getFirestore(app);)
    sed -i "/const db = getFirestore(app);/a \
enableIndexedDbPersistence(db).catch((err) => {\
  if (err.code === 'failed-precondition') {\
    console.warn('Multiple tabs open, offline persistence can only be enabled in one tab at a time.');\
  } else if (err.code === 'unimplemented') {\
    console.warn('The current browser does not support all features required to enable offline persistence.');\
  }\
});" src/firebase.js
    echo "Offline persistence enabled in src/firebase.js"
  else
    echo "Offline persistence already enabled in src/firebase.js"
  fi
else
  echo "src/firebase.js not found, please add Firestore offline persistence manually."
fi

# 3. Modify src/index.js or src/main.jsx to register service worker

INDEX_FILE=""
if [ -f src/index.js ]; then
  INDEX_FILE="src/index.js"
elif [ -f src/main.jsx ]; then
  INDEX_FILE="src/main.jsx"
fi

if [ "$INDEX_FILE" != "" ]; then
  echo "Adding service worker registration to $INDEX_FILE ..."

  # Check if service worker registration is already present
  if ! grep -q "navigator.serviceWorker.register" "$INDEX_FILE"; then
    cat >> "$INDEX_FILE" << 'EOF'

// Register service worker for offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}
EOF
    echo "Service worker registration code appended to $INDEX_FILE"
  else
    echo "Service worker registration already present in $INDEX_FILE"
  fi
else
  echo "No src/index.js or src/main.jsx file found to add service worker registration."
fi

# 4. Create NetworkStatus component in src/components/NetworkStatus.jsx
mkdir -p src/components
cat > src/components/NetworkStatus.jsx << 'EOF'
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
EOF

echo "Created src/components/NetworkStatus.jsx"

echo "Offline support setup script completed.

Next steps:
- Import and use <NetworkStatus /> at the top of your app layout.
- Adjust cache files in service-worker.js as needed.

"


