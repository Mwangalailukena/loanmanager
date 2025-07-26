import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// Register the Workbox service worker generated as /sw.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered with scope:', registration.scope);

        // Listen for updates to the service worker.
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  if (window.confirm('New version available! Would you like to update?')) {
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                } else {
                  console.log('Service Worker installed for the first time.');
                }
              }
            };
          }
        };
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });

  // Listen for controlling service worker changing and reload the page
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

