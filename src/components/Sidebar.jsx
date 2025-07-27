// src/components/Sidebar.jsx
import React from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, useTheme } from "@mui/material"; // Import useTheme
import { useNavigate, useLocation } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HistoryIcon from "@mui/icons-material/History";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

const drawerWidth = 220;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme(); // Access the theme

  const navItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Add Loan", icon: <AddIcon />, path: "/add-loan" },
    { text: "Add Payment", icon: <AttachMoneyIcon />, path: "/add-payment" },
    { text: "Loan Records", icon: <ListAltIcon />, path: "/loans" },
    { text: "Activity", icon: <HistoryIcon />, path: "/activity" },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: { xs: 'none', sm: 'block' }, // Hide on mobile
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: 'none', // Remove default border
          backgroundColor: theme.palette.background.paper, // Use paper background
          boxShadow: theme.shadows[1], // Subtle shadow for the drawer itself
          // You might want rounded top-right corner if the app bar doesn't cover it
          // e.g., borderTopRightRadius: 16,
        },
      }}
    >
      <Toolbar /> {/* This pushes content below the AppBar */}
      <List sx={{ pt: 2, px: 1 }}> {/* Add some padding to the list itself */}
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}> {/* Add bottom margin for spacing between items */}
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2, // Apply rounded corners to the button
                py: 1.2, // Adjust vertical padding for more height
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light + '20', // Lighter primary color with opacity for selected state
                  color: theme.palette.primary.main, // Primary color for text and icon when selected
                  fontWeight: theme.typography.fontWeightMedium,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main, // Ensure icon color is primary
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '30', // Slightly darker hover for selected state
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover, // Subtle hover effect for unselected items
                  borderRadius: 2, // Maintain rounded corners on hover
                },
                // Styles for unselected items
                color: theme.palette.text.secondary, // Softer color for unselected text
                '& .MuiListItemIcon-root': {
                  color: theme.palette.text.secondary, // Softer color for unselected icons
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem' }} /> {/* Adjust font size */}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
