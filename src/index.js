import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Register the service worker with update & success callbacks
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    if (window.confirm('New version available! Would you like to update?')) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  },
  onSuccess: () => {
    console.log('Service worker registered successfully!');
  },
});

