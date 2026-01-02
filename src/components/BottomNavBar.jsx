import React from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from 'framer-motion';

import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add'; // Import AddIcon
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // Import AttachMoneyIcon

export const BOTTOM_NAV_HEIGHT = 64;

const triggerHapticFeedback = () => {
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
};

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const getValue = () => {
    const paths = ["/dashboard", "/loans", "/borrowers", "/add-loan", "/add-payment"];
    return paths.find(path => location.pathname.startsWith(path)) || null;
  };
  
  const currentValue = getValue();

  const handleNavigationChange = (event, newValue) => {
    triggerHapticFeedback();
    navigate(newValue);
  };

  const navItems = [
      { label: "Dashboard", value: "/dashboard", icon: <DashboardIcon /> },
      { label: "Loans", value: "/loans", icon: <ListAltIcon /> },
      { label: "Add Loan", value: "/add-loan", icon: <AddIcon /> }, // Added Add Loan
      { label: "Add Payment", value: "/add-payment", icon: <AttachMoneyIcon /> }, // Added Add Payment
      { label: "Borrowers", value: "/borrowers", icon: <PeopleIcon /> },
  ];

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 12, left: 0, right: 0,
        width: "calc(100% - 24px)",
        maxWidth: 600, margin: "0 auto",
        display: { xs: "block", sm: "none" },
        zIndex: theme.zIndex.appBar + 1,
        borderRadius: 20, overflow: "hidden",
        backdropFilter: "blur(20px) saturate(180%)",
        backgroundColor: theme.palette.mode === 'dark' ? "rgba(22, 30, 49, 0.7)" : "rgba(255, 255, 255, 0.7)",
        border: "1px solid " + (theme.palette.mode === 'dark' ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"),
        boxShadow: theme.palette.mode === 'dark' ? "0 8px 32px rgba(0, 0, 0, 0.4)" : "0 8px 32px rgba(0, 0, 0, 0.08)",
      }}
      elevation={0}
    >
      <BottomNavigation
        showLabels
        value={currentValue}
        onChange={handleNavigationChange}
        sx={{
          height: BOTTOM_NAV_HEIGHT,
          backgroundColor: "transparent",
          "& .MuiBottomNavigationAction-root": {
            position: "relative", minWidth: 0, px: 1,
            color: theme.palette.text.secondary,
            transition: 'all 0.2s ease',
            "&.Mui-selected": {
              color: theme.palette.primary.main,
              "& .MuiBottomNavigationAction-label": {
                fontWeight: 700,
                fontSize: '0.75rem',
              },
            },
          },
        }}
      >
        {navItems.map((item) => {
            const isSelected = currentValue === item.value;
            return (
                <BottomNavigationAction
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    icon={
                        <motion.div
                            animate={{ 
                                y: isSelected ? -4 : 0,
                                scale: isSelected ? 1.1 : 1 // Reduced scale for subtlety
                            }}
                            // --- FIX: Remove duration/ease and use only spring properties ---
                            transition={{ 
                                type: 'spring',
                                stiffness: 300,
                                damping: 15
                            }}
                        >
                            {item.icon}
                        </motion.div>
                    }
                />
            )
        })}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNavBar;