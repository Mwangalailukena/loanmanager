import React, { useState } from 'react'; // <-- Import useState
import { useLocation } from 'react-router-dom';
import {
  useTheme,
  useMediaQuery,
  Box,
  CssBaseline // <-- Import CssBaseline if not already there
} from '@mui/material';

import AppBarTop from './AppBarTop';
import BottomNavBar from './BottomNavBar';
import Sidebar from './Sidebar';

// <-- IMPORT THE NEW DIALOG COMPONENT
import LoanDetailDialog from './LoanDetailDialog';

const drawerWidth = 220;

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // === DIALOG STATE AND HANDLERS GO HERE ===
  const [loanDetailOpen, setLoanDetailOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const handleOpenLoanDetail = (loanId) => {
    console.log("AppLayout: handleOpenLoanDetail called for ID:", loanId);
    setSelectedLoanId(loanId);
    setLoanDetailOpen(true);
  };

  const handleCloseLoanDetail = () => {
    console.log("AppLayout: handleCloseLoanDetail called");
    setLoanDetailOpen(false);
    setSelectedLoanId(null);
  };
  // =========================================

  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);
  const bottomNavHeight = isMobile && !hideLayout ? 64 : 0;

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />

      {/* 1. Fixed AppBar - Pass the new handler to it */}
      <AppBarTop 
        darkMode={darkMode} 
        onToggleDarkMode={onToggleDarkMode} 
        onOpenLoanDetail={handleOpenLoanDetail} // <-- PASS THE FUNCTION HERE
      />

      {/* 2. This Box creates space BELOW the fixed AppBar and holds sidebar/main content */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          paddingTop: theme.mixins.toolbar,
          paddingBottom: `${bottomNavHeight}px`,
        }}
      >
        {/* Sidebar component */}
        {!hideLayout && <Sidebar drawerWidth={drawerWidth} />}

        {/* 3. This is the actual Main content area where your page components render. */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            boxSizing: 'border-box',
            background: theme.palette.background.default,
            minHeight: 0,
            height: '100%',
            px: isMobile ? 2 : 4,
            paddingTop: '70px',
            pb: 0,
          }}
        >
          {children} {/* Your Dashboard content goes here */}
        </Box>
      </Box>

      {/* Bottom Navigation Bar */}
      {!hideLayout && isMobile && <BottomNavBar />}

      {/* 4. RENDER THE DIALOG HERE */}
      <LoanDetailDialog
        open={loanDetailOpen}
        onClose={handleCloseLoanDetail}
        loanId={selectedLoanId}
      />
    </Box>
  );
};

export default AppLayout;
