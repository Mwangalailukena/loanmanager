// src/components/BottomNavBar.jsx
import React from "react";
import { BottomNavigation, BottomNavigationAction, Paper, useTheme } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

export const BOTTOM_NAV_HEIGHT = 64; 

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

  return (
    <Paper
      sx={{
        position: "fixed",
        // --- LIFT FROM BOTTOM (ADJUSTED TO 14PX) ---
        bottom: 14, // Lifts the component 14px from the bottom of the viewport
        // --- END LIFT FROM BOTTOM ---
        left: 0,
        right: 0,
        display: { xs: "block", sm: "none" },
        zIndex: theme.zIndex.appBar + 1,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        overflow: 'hidden', 
        
        // --- GLASSMORPHISM STYLES ---
        backdropFilter: 'blur(12px) saturate(180%)', 
        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        border: '1px solid rgba(255, 255, 255, 0.2)', 
        boxShadow: theme.shadows[3], 
        // --- END GLASSMORPHISM STYLES ---
      }}
      elevation={0} 
    >
      <BottomNavigation
        showLabels
        value={getValue()}
        onChange={(event, newValue) => navigate(newValue)}
        sx={{
          height: BOTTOM_NAV_HEIGHT,
          backgroundColor: 'transparent', 
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            px: 1,
            color: theme.palette.text.secondary,
            transition: 'color 0.3s ease-in-out',

            '&.Mui-selected': {
              color: theme.palette.primary.main,
              fontWeight: theme.typography.fontWeightMedium,
              
              '& .MuiSvgIcon-root': {
                transform: 'translateY(-4px)',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              },
            },
            '& .MuiSvgIcon-root': {
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translateY(0)',
            },
          },
          '& .MuiBottomNavigationAction-label.Mui-selected': {
            fontSize: '0.75rem',
            transform: 'scale(1)',
            color: theme.palette.primary.main, 
          },
          '& .MuiBottomNavigationAction-wrapper': {
            position: 'relative',
          },
          '& .MuiBottomNavigationAction-wrapper::after': {
            content: '""',
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            height: 4,
            width: '60%',
            borderRadius: 2,
            backgroundColor: 'transparent',
            transition: 'background-color 0.3s ease-in-out',
          },
          '& .MuiBottomNavigationAction-root.Mui-selected .MuiBottomNavigationAction-wrapper::after': {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        <BottomNavigationAction label="Dashboard" value="/dashboard" icon={<DashboardIcon />} />
        <BottomNavigationAction label="Add Loan" value="/add-loan" icon={<AddIcon />} />
        <BottomNavigationAction label="Add Payment" value="/add-payment" icon={<AttachMoneyIcon />} />
        <BottomNavigationAction label="Loans" value="/loans" icon={<ListAltIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNavBar;
