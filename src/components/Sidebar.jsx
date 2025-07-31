// src/components/Sidebar.jsx
import React from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, useTheme } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HistoryIcon from "@mui/icons-material/History";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssessmentIcon from "@mui/icons-material/Assessment"; // <--- ADD THIS IMPORT

const drawerWidth = 220;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const navItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Add Loan", icon: <AddIcon />, path: "/add-loan" },
    { text: "Add Payment", icon: <AttachMoneyIcon />, path: "/add-payment" },
    { text: "Loan Records", icon: <ListAltIcon />, path: "/loans" },
    // Add the new Reports item here
    { text: "Reports", icon: <AssessmentIcon />, path: "/reports" }, // <--- ADD THIS ITEM
    { text: "Activity", icon: <HistoryIcon />, path: "/activity" },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: { xs: 'none', sm: 'block' },
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: 'none',
          // --- GLASSMORPHISM STYLES START ---
          backdropFilter: 'blur(12px) saturate(180%)', // Apply blur to content behind
          backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white background
          borderRight: '1px solid rgba(255, 255, 255, 0.2)', // Subtle translucent border on the right
          boxShadow: theme.shadows[3], // A softer shadow works well with glassmorphism
          // --- GLASSMORPHISM STYLES END ---
        },
      }}
    >
      <Toolbar />
      <List sx={{ pt: 2, px: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              // Use startsWith for robust active state, especially for nested routes if you ever add them
              selected={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                py: 1.2,
                '&.Mui-selected': {
                  // Keep your existing active state styles which are good
                  backgroundColor: theme.palette.primary.light + '20',
                  color: theme.palette.primary.main,
                  fontWeight: theme.typography.fontWeightMedium,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '30',
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  borderRadius: 2,
                },
                color: theme.palette.text.secondary,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.text.secondary,
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
