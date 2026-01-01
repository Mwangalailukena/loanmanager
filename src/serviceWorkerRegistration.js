// This code registers a service worker for the application.
// This version is optimized for PWABuilder detection by ensuring immediate,
// unconditional registration at root scope.

export function register(config) {
  if ('serviceWorker' in navigator) {
    // Register immediately, unconditionally, at root scope
    const swUrl = '/service-worker.js'; // Use absolute path at root scope

    navigator.serviceWorker
      .register(swUrl, { scope: '/' }) // Explicitly define root scope
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              // At this point, the updated precached content has been fetched.
              // We rely on the client-side useServiceWorker hook to prompt the user to refresh.
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
              // If there's no active controller, it means this is the first install.
              if (!navigator.serviceWorker.controller && config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('Error during service worker registration:', error);
      });
  }
}

// Unregister function, for explicit unregistration if needed
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}