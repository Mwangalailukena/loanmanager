// src/components/AppLayout.jsx

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useTheme,
  useMediaQuery,
  Box,
  CssBaseline,
} from '@mui/material';

import AppBarTop from './AppBarTop';
import BottomNavBar from './BottomNavBar';
import Sidebar from './Sidebar';
import LoanDetailDialog from './LoanDetailDialog';

const drawerWidth = 220;

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // NEW: State for the live search term
  const [searchTerm, setSearchTerm] = useState("");

  // === DIALOG STATE AND HANDLERS ===
  const [loanDetailOpen, setLoanDetailOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const handleOpenLoanDetail = (loanId) => {
    setSelectedLoanId(loanId);
    setLoanDetailOpen(true);
  };

  const handleCloseLoanDetail = () => {
    setLoanDetailOpen(false);
    setSelectedLoanId(null);
  };
  // ===================================

  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);
  const bottomNavHeight = isMobile && !hideLayout ? 64 : 0;

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* UPDATED: Pass the searchTerm and setSearchTerm props */}
      <AppBarTop 
        darkMode={darkMode} 
        onToggleDarkMode={onToggleDarkMode} 
        onOpenLoanDetail={handleOpenLoanDetail} 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <Box
        sx={{
          display: 'flex',
          flex: 1,
          paddingTop: theme.mixins.toolbar,
          paddingBottom: `${bottomNavHeight}px`,
        }}
      >
        {!hideLayout && <Sidebar drawerWidth={drawerWidth} />}

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
          {/* UPDATED: We need to pass the searchTerm to the child component */}
          {React.cloneElement(children, { searchTerm })}
        </Box>
      </Box>

      {!hideLayout && isMobile && <BottomNavBar />}

      <LoanDetailDialog
        key={selectedLoanId}
        open={loanDetailOpen}
        onClose={handleCloseLoanDetail}
        loanId={selectedLoanId}
      />
    </Box>
  );
};

export default AppLayout;
