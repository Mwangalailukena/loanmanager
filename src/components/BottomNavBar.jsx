// src/components/BottomNavBar.jsx
import React from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

export const BOTTOM_NAV_HEIGHT = 64;

// Function to trigger haptic feedback
const triggerHapticFeedback = () => {
  // Check if the browser supports the vibration API
  if (navigator.vibrate) {
    // Vibrate for 50ms
    navigator.vibrate(50);
  }
};

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const getValue = () => {
    if (location.pathname.startsWith("/dashboard")) return "/dashboard";
    if (location.pathname.startsWith("/add-loan")) return "/add-loan";
    if (location.pathname.startsWith("/add-payment")) return "/add-payment";
    if (location.pathname.startsWith("/loans")) return "/loans";
    return null;
  };

  const handleNavigationChange = (event, newValue) => {
    // Trigger haptic feedback on every navigation change
    triggerHapticFeedback();
    navigate(newValue);
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 12,
        left: 0,
        right: 0,
        width: "calc(100% - 24px)",
        maxWidth: 600,
        margin: "0 auto",
        display: { xs: "block", sm: "none" },
        zIndex: theme.zIndex.appBar + 1,
        borderRadius: 16,
        overflow: "hidden",
        backdropFilter: "blur(12px) saturate(180%)",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: theme.shadows[3],
      }}
      elevation={0}
    >
      <BottomNavigation
        showLabels
        value={getValue()}
        onChange={handleNavigationChange}
        sx={{
          height: BOTTOM_NAV_HEIGHT,
          backgroundColor: "transparent",
          "& .MuiBottomNavigationAction-root": {
            position: "relative",
            minWidth: 0,
            px: 1,
            color: theme.palette.text.secondary,
            transition: "color 0.3s ease-in-out",

            // --- HALO/SPOTLIGHT ANIMATION ---
            "&::before": {
              content: '""',
              position: "absolute",
              top: "50%",
              left: "50%",
              // Make it a circle and set initial size and opacity
              width: 50, // Fixed size for a consistent circle
              height: 50,
              borderRadius: "50%",
              backgroundColor: "transparent",
              // Animate scale and background color for a halo effect
              transform: "translate(-50%, -50%) scale(0)",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease-in-out",
            },

            "&.Mui-selected": {
              color: theme.palette.primary.main,
              fontWeight: theme.typography.fontWeightMedium,

              // Animate the halo to appear
              "&::before": {
                transform: "translate(-50%, -50%) scale(1)",
                backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
              },
              
              // Icon lift animation
              "& .MuiSvgIcon-root": {
                transform: "translateY(-4px)",
                transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              },
            },

            // Icon transition for non-selected items
            "& .MuiSvgIcon-root": {
              transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: "translateY(0)",
            },
          },
          "& .MuiBottomNavigationAction-label.Mui-selected": {
            fontSize: "0.75rem",
            transform: "scale(1)",
            color: theme.palette.primary.main,
          },
        }}
      >
        <BottomNavigationAction
          label="Dashboard"
          value="/dashboard"
          icon={<DashboardIcon />}
        />
        <BottomNavigationAction
          label="Add Loan"
          value="/add-loan"
          icon={<AddIcon />}
        />
        <BottomNavigationAction
          label="Add Payment"
          value="/add-payment"
          icon={<AttachMoneyIcon />}
        />
        <BottomNavigationAction
          label="Loans"
          value="/loans"
          icon={<ListAltIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNavBar;
