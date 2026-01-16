import React, { useEffect, useRef } from "react";
import useOfflineStatus from "../hooks/useOfflineStatus";
import { useSnackbar } from "./SnackbarProvider";
import { Box, Typography, Fade, useTheme, alpha } from "@mui/material";
import WifiOffIcon from '@mui/icons-material/WifiOff';

export default function NetworkStatus() {
  const isOnline = useOfflineStatus(1000);
  const wasOffline = useRef(false);
  const showSnackbar = useSnackbar();
  const theme = useTheme();

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      showSnackbar("Working offline. Changes will sync when online.", "warning");
    } else if (isOnline && wasOffline.current) {
      wasOffline.current = false;
      showSnackbar("Back online. Syncing changes with server...", "success");
    }
  }, [isOnline, showSnackbar]);

  return (
    <Fade in={!isOnline}>
      <Box
        sx={{
          position: "fixed",
          bottom: { xs: 80, sm: 24 },
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: theme.zIndex.tooltip + 1,
          bgcolor: alpha(theme.palette.error.main, 0.9),
          color: "white",
          px: 2,
          py: 0.75,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 1,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          backdropFilter: "blur(8px)",
          pointerEvents: "none",
        }}
      >
        <WifiOffIcon sx={{ fontSize: 18 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
          OFFLINE MODE
        </Typography>
      </Box>
    </Fade>
  );
}