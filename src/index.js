import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppThemeProvider from './contexts/ThemeProvider'; // Corrected import
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppThemeProvider> {/* Corrected usage */}
      <App />
      <ToastContainer position="bottom-right" autoClose={4000} />
    </AppThemeProvider>
  </React.StrictMode>
);

serviceWorkerRegistration.register({
  onUpdate: registration => {
    const waitingWorker = registration.waiting;
    if (waitingWorker) {
      if (window.confirm('New version available! Would you like to update?')) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        waitingWorker.addEventListener('statechange', event => {
          if (event.target.state === 'activated') {
            window.location.reload();
          }
        });
      }
    }
  },
  onSuccess: registration => {
    console.log('Content is cached for offline use.');
  }
});

async function registerPeriodicSync() {
  if ('serviceWorker' in navigator && 'periodicSync' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.periodicSync.register('daily-sync', {
        minInterval: 24 * 60 * 60 * 1000, // 1 day
      });
      console.log('Periodic sync registered');
    } catch (error) {
      console.error('Periodic sync could not be registered:', error);
    }
  }
}

registerPeriodicSync();

// Listen for background sync messages from service worker
if ('serviceWorker' in navigator) {
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
