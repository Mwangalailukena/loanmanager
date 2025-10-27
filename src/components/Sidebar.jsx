import React from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, useTheme } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AddIcon from "@mui/icons-material/Add";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HistoryIcon from "@mui/icons-material/History";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PeopleIcon from '@mui/icons-material/People';
import CalculateIcon from '@mui/icons-material/Calculate';

const drawerWidth = 220;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const navItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Add Loan", icon: <AddIcon />, path: "/add-loan" },
    { text: "Add Payment", icon: <AttachMoneyIcon />, path: "/add-payment" },
    { text: "Borrowers", icon: <PeopleIcon />, path: "/borrowers" },
    { text: "Loan Records", icon: <ListAltIcon />, path: "/loans" },
    { text: "Reports", icon: <AssessmentIcon />, path: "/reports" },
    { text: "Activity", icon: <HistoryIcon />, path: "/activity" },
    { text: "Simulator", icon: <CalculateIcon />, path: "/simulator" },
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
          // --- GLASSMORPHISM STYLES START ---
          backdropFilter: 'blur(12px) saturate(180%)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRight: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: theme.shadows[3],
          // --- GLASSMORPHISM STYLES END ---
        },
      }}
    >
      <Toolbar />
      <List sx={{ pt: 2, px: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                py: 1, // Reduced padding
                '&.Mui-selected': {
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
                  minWidth: 40, // Ensure consistent spacing for icons
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.875rem' }} /> {/* Smaller font size */}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
