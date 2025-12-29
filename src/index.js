import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppThemeProvider from './contexts/ThemeProvider';
import { SnackbarProvider } from './components/SnackbarProvider';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

window.OneSignal = window.OneSignal || [];
const OneSignal = window.OneSignal;
OneSignal.push(function() {
  OneSignal.init({
    appId: "85fb7b5e-ca58-4a5a-9223-6477f32c4992",
  });
});

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

serviceWorkerRegistration.register();
