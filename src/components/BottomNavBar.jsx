// src/components/BottomNavBar.jsx
import React from "react";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import ListAltIcon from "@mui/icons-material/ListAlt";
// import HistoryIcon from "@mui/icons-material/History"; // REMOVE THIS IMPORT
// import SettingsIcon from "@mui/icons-material/Settings"; // REMOVE THIS IMPORT
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getValue = () => {
    if (location.pathname.startsWith("/dashboard")) return "/dashboard";
    if (location.pathname.startsWith("/add-loan")) return "/add-loan";
    if (location.pathname.startsWith("/add-payment")) return "/add-payment";
    if (location.pathname.startsWith("/loans")) return "/loans";
    // REMOVE these checks:
    // if (location.pathname.startsWith("/activity")) return "/activity";
    // if (location.pathname.startsWith("/settings")) return "/settings";
    return null;
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: "block", sm: "none" },
        zIndex: 1000,
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={getValue()}
        onChange={(event, newValue) => navigate(newValue)}
      >
        <BottomNavigationAction label="Dashboard" value="/dashboard" icon={<DashboardIcon />} />
        <BottomNavigationAction label="Add Loan" value="/add-loan" icon={<AddIcon />} />
        <BottomNavigationAction label="Add Payment" value="/add-payment" icon={<AttachMoneyIcon />} />
        <BottomNavigationAction label="Loans" value="/loans" icon={<ListAltIcon />} />
        {/* REMOVE these actions: */}
        {/* <BottomNavigationAction label="Activity" value="/activity" icon={<HistoryIcon />} /> */}
        {/* <BottomNavigationAction label="Settings" value="/settings" icon={<SettingsIcon />} /> */}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNavBar;
