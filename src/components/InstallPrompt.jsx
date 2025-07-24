// src/components/InstallPrompt.jsx
import React, { useEffect, useState } from 'react';
import { Button, Snackbar } from '@mui/material';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setShowInstall(false);
      setDeferredPrompt(null);
    });
  };

  return (
    <Snackbar
      open={showInstall}
      message="Install Loan Manager?"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      action={
        <Button color="inherit" size="small" onClick={handleInstallClick}>
          Install
        </Button>
      }
    />
  );
};

export default InstallPrompt;

