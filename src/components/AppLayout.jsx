import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useTheme,
  useMediaQuery,
  Box,
  CssBaseline,
  Container,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import FloatingNavBar from './FloatingNavBar';
import BottomNavBar from './BottomNavBar';
import MobileDrawer from './MobileDrawer';
import LoanDetailDialog from './LoanDetailDialog';

// This is the SearchBar component for mobile, which is now functional.
const MobileSearchBar = ({ onSearchChange, onClose, open }) => {
  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar + 2,
        bgcolor: 'background.paper',
        p: 1,
        boxShadow: (theme) => theme.shadows[4],
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <TextField
        fullWidth
        autoFocus
        variant="outlined"
        placeholder="Search loans..."
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={onClose}>
                <CloseIcon color="action" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
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
    handleDrawerClose();
  };
  
  const handleSearchClose = () => setIsSearchOpen(false);
  
  const handleSearchChange = (value) => {
    console.log("Searching for:", value);
    // You would integrate your search/filter logic here
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
        />
      )}
      
      {/* Mobile Fixed Hamburger Button & Search */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 8,
            left: 8,
            zIndex: theme.zIndex.appBar + 1,
            bgcolor: 'background.paper',
            borderRadius: '28px',
            boxShadow: theme.shadows[2],
            display: 'flex',
          }}
        >
          <IconButton onClick={handleDrawerOpen} sx={{ color: theme.palette.secondary.main }}>
            <MenuIcon />
          </IconButton>
          <IconButton onClick={handleSearchOpen} sx={{ color: theme.palette.secondary.main }}>
            <SearchIcon />
          </IconButton>
        </Box>
      )}

      {/* Mobile Search Bar, visible only when search is open */}
      <MobileSearchBar
        onSearchChange={handleSearchChange}
        onClose={handleSearchClose}
        open={isSearchOpen}
      />
      
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
          pt: isSearchOpen ? '76px' : null, // Adjust padding if search bar is open
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
      {!hideLayout && isMobile && !isSearchOpen && <BottomNavBar />}
      
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
