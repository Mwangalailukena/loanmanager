import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useTheme,
  useMediaQuery,
  Box,
  CssBaseline,
  Container,
  IconButton,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

import FloatingNavBar from './FloatingNavBar';
import BottomNavBar from './BottomNavBar';
import MobileDrawer from './MobileDrawer';
import LoanDetailDialog from './LoanDetailDialog';

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
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
  
  const handleDrawerOpen = () => setMobileDrawerOpen(true);
  const handleDrawerClose = () => setMobileDrawerOpen(false);
  
  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);
  const bottomNavHeight = isMobile && !hideLayout ? 64 : 0;
  
  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Desktop Floating Navbar */}
      {!isMobile && (
        <FloatingNavBar
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
          onOpenLoanDetail={handleOpenLoanDetail}
        />
      )}
      
      {/* Mobile Fixed Hamburger Button */}
      {isMobile && (
        <Box sx={{
          position: 'fixed',
          top: 8,
          left: 8,
          zIndex: theme.zIndex.appBar + 1,
          bgcolor: 'background.paper',
          borderRadius: '50%',
          boxShadow: theme.shadows[2],
        }}>
          <IconButton onClick={handleDrawerOpen}>
            <MenuIcon />
          </IconButton>
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          boxSizing: 'border-box',
          background: theme.palette.background.default,
          minHeight: 0,
          height: '100%',
          pb: `${bottomNavHeight}px`,
          paddingTop: !isMobile ? '100px' : '64px', // Increased padding for mobile
        }}
      >
        <Container 
          maxWidth="lg" 
          sx={{ 
            pb: 4, 
            px: isMobile ? 2 : 4,
          }}
        >
          {React.cloneElement(children, { onOpenLoanDetail: handleOpenLoanDetail })}
        </Container>
      </Box>

      {/* Mobile Drawer */}
      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={handleDrawerClose}
        onOpen={handleDrawerOpen}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        onOpenLoanDetail={handleOpenLoanDetail}
      />
      
      {/* Mobile Bottom Navbar */}
      {!hideLayout && isMobile && <BottomNavBar />}
      
      {/* Loan Detail Dialog */}
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
