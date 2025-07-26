import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeProvider';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
      <ToastContainer position="bottom-right" autoClose={4000} />
    </ThemeProvider>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered with scope:', registration.scope);

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
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

  // Listen for background sync messages from service worker
  navigator.serviceWorker.addEventListener('message', event => {
    const data = event.data;
    if (!data) return;

    switch (data.type) {
      case 'POST_QUEUED':
        toast.info('You are offline. Your action will sync when online.');
        break;

      case 'BACKGROUND_SYNC':
        toast.success('Your offline data is syncing now!');
        break;

      default:
        break;
    }
  });

  // Reload page when new service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

