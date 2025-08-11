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
import { Menu as MenuIcon, Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';

import FloatingNavBar from './FloatingNavBar';
import BottomNavBar from './BottomNavBar';
import MobileDrawer from './MobileDrawer';
import LoanDetailDialog from './LoanDetailDialog';

// Placeholder for your SearchBar component (you need to create this)
const SearchBar = ({ onSearchChange, onClose, open }) => {
  if (!open) return null;
  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
      <input 
        type="text" 
        placeholder="Search loans..." 
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ flexGrow: 1, padding: '8px' }}
      />
      <IconButton onClick={onClose}><CloseIcon /></IconButton>
    </Box>
  );
};

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [loanDetailOpen, setLoanDetailOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
  
  const handleSearchOpen = () => {
    setIsSearchOpen(true);
    handleDrawerClose(); // Close the drawer when search is opened
  };
  
  const handleSearchClose = () => setIsSearchOpen(false);
  
  const handleSearchChange = (value) => {
    // This is where you would filter your loans based on the value
    console.log("Searching for:", value);
  };

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
          onSearchChange={handleSearchChange}
          searchOpen={isSearchOpen}
          toggleSearch={handleSearchOpen} // You'll need to update FloatingNavBar to use this
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
          <IconButton onClick={handleDrawerOpen} sx={{ color: theme.palette.secondary.main }}>
            <MenuIcon />
          </IconButton>
        </Box>
      )}

      {/* Mobile search bar, visible only when search is open */}
      {isMobile && isSearchOpen && (
        <SearchBar onSearchChange={handleSearchChange} onClose={handleSearchClose} open={isSearchOpen} />
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
          paddingTop: !isMobile ? '100px' : '64px',
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
        onSearchOpen={handleSearchOpen}
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
