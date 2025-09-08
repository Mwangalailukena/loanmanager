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
import AddIcon from "@mui/icons-material/Add";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

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
    const paths = ["/dashboard", "/add-loan", "/borrowers", "/loans", "/expenses"];
    return paths.find(path => location.pathname.startsWith(path)) || null;
  };
  
  const currentValue = getValue();

  const handleNavigationChange = (event, newValue) => {
    triggerHapticFeedback();
    navigate(newValue);
  };

  const navItems = [
      { label: "Dashboard", value: "/dashboard", icon: <DashboardIcon /> },
      { label: "Add Loan", value: "/add-loan", icon: <AddIcon /> },
      { label: "Borrowers", value: "/borrowers", icon: <PeopleIcon /> },
      { label: "Loans", value: "/loans", icon: <ListAltIcon /> },
      { label: "Expenses", value: "/expenses", icon: <ReceiptLongIcon /> },
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
        borderRadius: 16, overflow: "hidden",
        backdropFilter: "blur(12px) saturate(180%)",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: theme.shadows[3],
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
            "&.Mui-selected": {
              color: theme.palette.primary.main,
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
                                // --- FIX: Use a single value for scale with spring animation ---
                                scale: isSelected ? 1.2 : 1
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