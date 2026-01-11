import React, { useMemo, useState } from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  Box,
  Fab,
  MenuItem,
  ListItemText,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { alpha } from '@mui/material/styles';

// Icons - Import both variants
import HomeIcon from "@mui/icons-material/HomeRounded";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import ListAltIcon from "@mui/icons-material/ListAltRounded";
import ListAltOutlined from "@mui/icons-material/ListAltOutlined";
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import ReceiptIcon from '@mui/icons-material/ReceiptRounded';
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';

import AddIcon from "@mui/icons-material/AddRounded";
import AttachMoneyIcon from "@mui/icons-material/AttachMoneyRounded";
import PersonAddIcon from "@mui/icons-material/PersonAddRounded";

export const BOTTOM_NAV_HEIGHT = 70; 

const triggerHapticFeedback = () => {
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
};

const BottomNavBar = ({ onOpenAddLoan, onOpenAddPayment, onOpenAddBorrower, onOpenAddExpense }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const pathname = location.pathname;
  
  const [dashboardMenuAnchor, setDashboardMenuAnchor] = useState(null);
  const isMenuOpen = Boolean(dashboardMenuAnchor);

  const isDark = theme.palette.mode === 'dark';
  const primaryMain = theme.palette.primary.main;

  // Determine active tab
  const currentValue = useMemo(() => {
    const paths = ["/dashboard", "/loans", "/borrowers", "/expenses"];
    const found = paths.find(path => pathname.startsWith(path));
    return found || "/dashboard";
  }, [pathname]);

  const handleNavigationChange = (event, newValue) => {
    if (newValue === "spacer") return;
    triggerHapticFeedback();
    navigate(newValue);
  };

  const navItems = [
    { label: "Home", value: "/dashboard", activeIcon: <HomeIcon />, inactiveIcon: <HomeOutlined /> },
    { label: "Loans", value: "/loans", activeIcon: <ListAltIcon />, inactiveIcon: <ListAltOutlined /> },
    { label: "Spacer", value: "spacer", icon: null }, 
    { label: "Borrowers", value: "/borrowers", activeIcon: <PeopleIcon />, inactiveIcon: <PeopleOutlined /> },
    { label: "Expenses", value: "/expenses", activeIcon: <ReceiptIcon />, inactiveIcon: <ReceiptOutlined /> },
  ];

  const renderSmartFab = () => {
    const fabSize = 56; 
    const haloSize = 82; 
    const outerHaloSize = 94;

    const fabContainerSx = {
      position: 'absolute',
      top: -(haloSize / 2) + 8, 
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1300, 
      width: outerHaloSize,
      height: outerHaloSize,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const outerHaloSx = {
      position: 'absolute',
      width: outerHaloSize,
      height: outerHaloSize,
      borderRadius: '50%',
      border: `1px solid ${isDark ? alpha(primaryMain, 0.1) : alpha(primaryMain, 0.08)}`,
      zIndex: 0,
    };

    const haloSx = {
      position: 'absolute',
      width: haloSize,
      height: haloSize,
      borderRadius: '50%',
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.08)',
      zIndex: 1,
    };

    const isMenuOpen = Boolean(dashboardMenuAnchor);

    const dashboardActions = [
      { icon: <AddIcon />, label: 'Add Loan', onClick: onOpenAddLoan, color: theme.palette.primary.main }, 
      { icon: <AttachMoneyIcon />, label: 'Add Payment', onClick: onOpenAddPayment, color: theme.palette.secondary.main }, 
      { icon: <PersonAddIcon />, label: 'Add Borrower', onClick: onOpenAddBorrower, color: '#8b5cf6' }, 
    ];

    const handleClick = (e) => {
      triggerHapticFeedback();
      if (currentValue === "/dashboard") {
        setDashboardMenuAnchor(isMenuOpen ? null : e.currentTarget);
      } else if (currentValue === "/borrowers") {
        onOpenAddBorrower();
      } else if (currentValue === "/expenses") {
        onOpenAddExpense();
      } else {
        onOpenAddLoan();
      }
    };

    return (
      <Box sx={fabContainerSx}>
        <Box sx={outerHaloSx} />
        <Box sx={haloSx} />
        
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 40, x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: -fabSize - 24, x: '-50%' }}
              exit={{ opacity: 0, scale: 0.5, y: 40, x: '-50%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 0,
                zIndex: 10,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  borderRadius: '28px',
                  minWidth: 200,
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                {dashboardActions.map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MenuItem
                      onClick={() => {
                        triggerHapticFeedback();
                        setDashboardMenuAnchor(null);
                        action.onClick();
                      }}
                      sx={{
                        borderRadius: '20px',
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          bgcolor: alpha(action.color, 0.1),
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(action.color, 0.12),
                          color: action.color,
                          mr: 2,
                        }}
                      >
                        {React.cloneElement(action.icon, { sx: { fontSize: 20 } })}
                      </Box>
                      <ListItemText 
                        primary={action.label} 
                        primaryTypographyProps={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 700,
                          color: theme.palette.text.primary
                        }} 
                      />
                    </MenuItem>
                  </motion.div>
                ))}
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        <Fab
          sx={{
            zIndex: 2,
            width: fabSize,
            height: fabSize,
            minWidth: fabSize, 
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.main,
            color: '#fff',
            '&:hover': { backgroundColor: theme.palette.primary.dark },
            boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
          }}
          onClick={handleClick}
        >
          <motion.div
            animate={{ rotate: isMenuOpen ? 135 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <AddIcon sx={{ fontSize: 28 }} />
          </motion.div>
        </Fab>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar + 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none', 
      }}
    >
      {/* Global Backdrop for the menu - Elevated to capture clicks */}
      <AnimatePresence>
        {isMenuOpen && (
          <Box 
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              console.log("Backdrop clicked, closing menu");
              setDashboardMenuAnchor(null);
            }}
            sx={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 1250, // Sits above the nav bar but below the Action Hub menu items
              bgcolor: isDark ? 'rgba(10, 15, 30, 0.6)' : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              pointerEvents: 'auto', // Important: must be auto to receive clicks
            }}
          />
        )}
      </AnimatePresence>

      <Box sx={{ position: 'relative', width: '100%', maxWidth: 500, display: 'flex', justifyContent: 'center' }}>
        <Paper
          elevation={0}
          sx={{
            width: "100%", 
            borderRadius: '32px 32px 0 0', 
            backgroundColor: alpha(theme.palette.background.paper, 0.98),
            backdropFilter: "blur(20px)",
            borderTop: `1px solid ${theme.palette.divider}`,
            boxShadow: isDark 
              ? "0 -10px 40px rgba(0,0,0,0.4)" 
              : "0 -10px 40px rgba(0,0,0,0.05)",
            overflow: "visible",
            paddingBottom: 'env(safe-area-inset-bottom)',
            pointerEvents: 'auto',
            position: 'relative', 
            zIndex: 1260, // Above the backdrop but potentially below menu content
          }}
        >
          <Box sx={{ position: 'relative', px: 1 }}>
            {renderSmartFab()}

            <BottomNavigation
              showLabels={false} 
              value={currentValue}
              onChange={handleNavigationChange}
              sx={{
                height: BOTTOM_NAV_HEIGHT,
                backgroundColor: "transparent",
                display: 'flex',
                justifyContent: 'space-between',
                "& .MuiBottomNavigationAction-root": {
                  minWidth: 0,
                  flex: 1,
                  padding: '12px 0',
                  color: theme.palette.text.secondary,
                  transition: 'all 0.3s ease',
                  opacity: 0.6,
                  
                  "&.Mui-selected": {
                    color: theme.palette.primary.main, 
                    opacity: 1,
                    "& .MuiBottomNavigationAction-label": {
                      fontSize: '0.7rem', 
                      fontWeight: 700,
                      mt: 0.5,
                      opacity: 1,
                    },
                  },
                  "& .MuiBottomNavigationAction-label": {
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    opacity: 0, 
                    transition: 'opacity 0.2s ease',
                  }
                },
              }}
            >
              {navItems.map((item) => {
                if (item.value === "spacer") {
                  return <BottomNavigationAction key="spacer" disabled sx={{ flex: 0.8, opacity: 0 }} />;
                }
                
                const isSelected = currentValue === item.value;
                
                return (
                  <BottomNavigationAction
                    key={item.value}
                    label={item.label}
                    value={item.value}
                    icon={
                      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              style={{
                                position: 'absolute',
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                zIndex: -1,
                              }}
                            />
                          )}
                        </AnimatePresence>
                        
                        <motion.div
                          animate={{ 
                            scale: isSelected ? 1.1 : 1,
                            y: isSelected ? -2 : 0
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                          {isSelected ? item.activeIcon : item.inactiveIcon}
                        </motion.div>
                      </Box>
                    }
                  />
                );
              })}
            </BottomNavigation>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default React.memo(BottomNavBar);
