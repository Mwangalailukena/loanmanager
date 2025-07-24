// src/components/BottomNavBar.jsx
import React from "react";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney"; // <--- NEW IMPORT for Add Payment icon

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getValue = () => {
    // This function determines which navigation item should be "active"
    // based on the current URL path.
    if (location.pathname.startsWith("/dashboard")) return "/dashboard";
    if (location.pathname.startsWith("/add-loan")) return "/add-loan";
    if (location.pathname.startsWith("/add-payment")) return "/add-payment"; // <--- NEW CHECK for Add Payment
    if (location.pathname.startsWith("/loans")) return "/loans";
    if (location.pathname.startsWith("/activity")) return "/activity";
    if (location.pathname.startsWith("/settings")) return "/settings";
    return null; // Return null if no match, so no item is selected
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: "block", sm: "none" }, // Only visible on mobile (xs breakpoint)
        zIndex: 1000, // Ensure it stays on top of other content
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels // Displays the text labels below the icons
        value={getValue()} // Sets the currently selected item
        onChange={(event, newValue) => navigate(newValue)} // Handles navigation when an item is clicked
      >
        <BottomNavigationAction label="Dashboard" value="/dashboard" icon={<DashboardIcon />} />
        <BottomNavigationAction label="Add Loan" value="/add-loan" icon={<AddIcon />} />
        {/* NEW BottomNavigationAction for Add Payment */}
        <BottomNavigationAction label="Add Payment" value="/add-payment" icon={<AttachMoneyIcon />} />
        <BottomNavigationAction label="Loans" value="/loans" icon={<ListAltIcon />} />
        <BottomNavigationAction label="Activity" value="/activity" icon={<HistoryIcon />} />
        <BottomNavigationAction label="Settings" value="/settings" icon={<SettingsIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNavBar;
