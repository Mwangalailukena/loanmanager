import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppThemeProvider from './contexts/ThemeProvider';
import { SnackbarProvider } from './components/SnackbarProvider';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));



root.render(
  <React.StrictMode>
    <SnackbarProvider>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </SnackbarProvider>
  </React.StrictMode>
);

serviceWorkerRegistration.register(); // Register the service worker for PWA features and offline support.
