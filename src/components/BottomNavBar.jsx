// src/components/BottomNavBar.jsx
import React from "react";
import { BottomNavigation, BottomNavigationAction, Paper, useTheme } from "@mui/material"; // Import useTheme
import { useNavigate, useLocation } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme(); // Access the theme

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
        zIndex: theme.zIndex.appBar + 1, // Ensure it's above other elements like AppBar
        backgroundColor: theme.palette.background.paper, // Use paper background
        borderTopLeftRadius: 16, // Rounded top-left corner
        borderTopRightRadius: 16, // Rounded top-right corner
        overflow: 'hidden', // Ensures the rounded corners are visible for the paper
        boxShadow: theme.shadows[8], // A slightly more pronounced shadow for a floating effect
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={getValue()}
        onChange={(event, newValue) => navigate(newValue)}
        sx={{
          height: 64, // Slightly increased height for better touch targets
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0, // Allow items to shrink if needed
            px: 1, // Adjusted horizontal padding
            color: theme.palette.text.secondary, // Default color for inactive items
            '&.Mui-selected': {
              color: theme.palette.primary.main, // Primary color for active item icon/label
              fontWeight: theme.typography.fontWeightMedium,
            },
          },
          // Custom indicator for selected item
          '& .MuiBottomNavigationAction-label.Mui-selected': {
            fontSize: '0.75rem', // Smaller font size for label if desired, or keep default
            transform: 'scale(1)', // No scaling needed if relying on indicator
          },
          '& .MuiBottomNavigationAction-wrapper': {
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 4, // Position the indicator at the bottom of the action
              left: '50%',
              transform: 'translateX(-50%)',
              height: 4, // Thickness of the indicator
              width: '60%', // Width of the indicator
              borderRadius: 2, // Rounded indicator
              backgroundColor: 'transparent', // Default transparent
              transition: 'background-color 0.3s ease-in-out', // Smooth transition
            },
          },
          '& .MuiBottomNavigationAction-root.Mui-selected .MuiBottomNavigationAction-wrapper::after': {
            backgroundColor: theme.palette.primary.main, // Primary color for active indicator
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