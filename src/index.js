import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppThemeProvider from './contexts/ThemeProvider';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { SnackbarProvider, useSnackbar } from './components/SnackbarProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));

const ServiceWorkerWrapper = () => {
  const showSnackbar = useSnackbar();

  React.useEffect(() => {
    serviceWorkerRegistration.register({
      onUpdate: registration => {
        const waitingWorker = registration.waiting;
        if (waitingWorker) {
          showSnackbar(
            'New version available! Click to update.',
            'info',
            () => {
              waitingWorker.postMessage({ type: 'SKIP_WAITING' });
              waitingWorker.addEventListener('statechange', event => {
                if (event.target.state === 'activated') {
                  window.location.reload();
                }
              });
            }
          );
        }
      },
      onSuccess: registration => {
        showSnackbar('Content is cached for offline use.', 'success');
      }
    }, showSnackbar);

    // Listen for background sync messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
          const data = event.data;
          if (!data) return;

          switch (data.type) {
              case 'POST_QUEUED':
                  showSnackbar('You are offline. Your action will sync when online.', 'info');
                  break;

              case 'BACKGROUND_SYNC':
                  showSnackbar('Your offline data is syncing now!', 'success');
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
  }, [showSnackbar]);

  return null;
};

root.render(
  <React.StrictMode>
    <SnackbarProvider>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
      <ServiceWorkerWrapper />
    </SnackbarProvider>
  </React.StrictMode>
);

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