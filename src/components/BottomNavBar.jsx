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
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: "block", sm: "none" },
        zIndex: theme.zIndex.appBar + 1, // Keep this, or theme.zIndex.drawer + 1 if you have a drawer
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden', // Crucial for backdrop-filter to work correctly with border-radius
        
        // --- GLASSMORPHISM STYLES START ---
        backdropFilter: 'blur(12px) saturate(180%)', // Applies the frosted glass blur effect
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white background
        border: '1px solid rgba(255, 255, 255, 0.2)', // Subtle translucent border
        boxShadow: theme.shadows[3], // A softer shadow (e.g., elevation 3) complements the glass effect
        // --- GLASSMORPHISM STYLES END ---
      }}
      // Set elevation to 0 as we are defining a custom boxShadow for the glassmorphic look
      elevation={0} 
    >
      <BottomNavigation
        showLabels
        value={getValue()}
        onChange={(event, newValue) => navigate(newValue)}
        sx={{
          height: BOTTOM_NAV_HEIGHT,
          // Make the BottomNavigation itself transparent so the glassmorphic Paper background is visible
          backgroundColor: 'transparent', 
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            px: 1,
            color: theme.palette.text.secondary,
            // Add a subtle transition for smoother icon/label color changes
            transition: 'color 0.3s ease-in-out', // Keep for color transition

            '&.Mui-selected': {
              color: theme.palette.primary.main,
              fontWeight: theme.typography.fontWeightMedium,
              
              // >>>>> ADD/MODIFY THIS SECTION FOR THE BOUNCE EFFECT <<<<<
              '& .MuiSvgIcon-root': { // Target the SVG icon directly
                transform: 'translateY(-4px)', // Moves the icon up by 4px
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth animation
                // cubic-bezier provides a subtle ease-out bounce feel
              },
            },
            // Ensure icons return to original position when unselected
            '& .MuiSvgIcon-root': {
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // Same transition for returning
              transform: 'translateY(0)', // Default position
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
