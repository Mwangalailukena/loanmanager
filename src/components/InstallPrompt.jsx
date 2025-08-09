import { useEffect, useState } from "react";
import { Fab } from "@mui/material";
import InstallMobileIcon from '@mui/icons-material/InstallMobile';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        }
        setDeferredPrompt(null);
      });
    }
  };

  return (
    deferredPrompt && (
      <Fab
        variant="extended"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
        color="primary"
        onClick={handleInstallClick}
      >
        <InstallMobileIcon sx={{ mr: 1 }} />
        Install App
      </Fab>
    )
  );
};

export default InstallPrompt;

