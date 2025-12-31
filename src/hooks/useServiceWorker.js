import { useEffect, useState, useCallback } from 'react';
import { Workbox } from 'workbox-window';

const useServiceWorker = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  const handleUpdate = useCallback(() => {
    if (waitingWorker) {
      // Send message to the waiting service worker to skip its waiting phase
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Listen for the service worker state change to 'activated'
      waitingWorker.addEventListener('statechange', (event) => {
        if (event.target.state === 'activated') {
          // Once activated, reload the page to apply the updates
          window.location.reload();
        }
      });
      
      setShowUpdatePrompt(false); // Hide the prompt after sending message
    }
  }, [waitingWorker]);

  useEffect(() => {
    // Check if service workers are supported by the browser
    if ('serviceWorker' in navigator) {
      // Create a new Workbox instance for the service worker at the root
      const wb = new Workbox('/service-worker.js'); 

      // Add an event listener for when a new service worker is waiting
      wb.addEventListener('waiting', (event) => {
        setWaitingWorker(event.sw); // Store the waiting service worker instance
        setShowUpdatePrompt(true);  // Show the update prompt to the user
      });
      
      // We expect the service worker to be registered by serviceWorkerRegistration.js
      // We attach the Workbox event listeners and check for waiting state on initial load
      navigator.serviceWorker.ready.then((registration) => {
        if (registration && registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowUpdatePrompt(true);
        }
              // Workbox automatically attaches its own message listeners to the active SW
              // if it detects it as its own.
              }).catch(error => {
                console.error('Service Worker ready check failed:', error);
              });
        
              // Add controllerchange listener to reload the page when a new service worker takes control
              const onControllerChange = () => {
                window.location.reload();
              };
              navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
        
              // Cleanup function to remove the event listener when the component unmounts
              return () => {
                navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
              };
            }
          }, []); // Empty dependency array ensures this effect runs only once on mount
  return { showUpdatePrompt, handleUpdate };
};

export default useServiceWorker;
