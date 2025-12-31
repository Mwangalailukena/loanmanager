// This code registers a service worker for the application.
// For more information, visit https://developers.google.com/web/fundamentals/primers/service-workers

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on.
      return;
    }

    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    navigator.serviceWorker
      .register(swUrl, { scope: '/' }) // Register immediately, unconditionally, at root scope
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

// Removed checkServiceWorkerHealth as it's not needed for basic PWA detection and might interfere.
// Removed isLocalhost check and checkValidServiceWorker as they added complexity not required for production PWA detection.