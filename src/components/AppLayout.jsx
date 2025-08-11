import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useTheme,
  useMediaQuery,
  Box,
  CssBaseline,
  Container,
} from '@mui/material';

import FloatingNavBar from './FloatingNavBar';
import BottomNavBar from './BottomNavBar';
import LoanDetailDialog from './LoanDetailDialog';

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [searchTerm, setSearchTerm] = useState("");

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

  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);
  const bottomNavHeight = isMobile && !hideLayout ? 64 : 0;

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />

      {!isMobile && (
        <FloatingNavBar
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
          onOpenLoanDetail={handleOpenLoanDetail}
          onSearchChange={setSearchTerm}
        />
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          boxSizing: 'border-box',
          background: theme.palette.background.default,
          minHeight: 0,
          height: '100%',
          px: 0,
          pb: 0,
          // Corrected: Add a top padding to account for the FloatingNavBar
          // The padding is only applied on desktop screens where the FloatingNavBar is present.
          // A value of 100px is a safe estimate for the navbar's height and position.
          paddingTop: isMobile ? 0 : '100px',
        }}
      >
        <Container 
          maxWidth="lg" 
          sx={{ 
            pb: 4, 
            px: isMobile ? 2 : 4,
          }}
        >
          {React.cloneElement(children, { globalSearchTerm: searchTerm })}
        </Container>
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
