import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppThemeProvider from './contexts/ThemeProvider';
import { SnackbarProvider } from './components/SnackbarProvider';

window.OneSignalDeferred = window.OneSignalDeferred || [];
window.OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "85fb7b5e-ca58-4a5a-9223-6477f32c4992",
    safari_web_id: "web.onesignal.auto.028d9952-ba2c-477b-babc-6aee5c5ba0de",
    notifyButton: {
      enable: true,
    },
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

// serviceWorkerRegistration.register();
