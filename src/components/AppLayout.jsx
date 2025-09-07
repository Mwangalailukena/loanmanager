import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useTheme,
  useMediaQuery,
  Box,
  CssBaseline,
  Container,
  IconButton,
  TextField,
  InputAdornment,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Fab,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon,
  PersonAdd as PersonAddIcon,
  Receipt as ReceiptIcon, // For FloatingNavBar and MobileDrawer
} from '@mui/icons-material';

import FloatingNavBar from './FloatingNavBar';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from './BottomNavBar';
import MobileDrawer from './MobileDrawer';
import LoanDetailDialog from './LoanDetailDialog';
import { useSearch } from '../contexts/SearchContext'; // Import useSearch

// Dedicated mobile search bar, controlled by the AppLayout state
const MobileSearchBar = ({ onSearchChange, onClose, open, searchTerm }) => {
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
        value={searchTerm}
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
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Consume search context
  const {
    searchTerm,
    handleSearchChange,
    isMobileSearchOpen,
    handleMobileSearchOpen,
    handleMobileSearchClose,
  } = useSearch();

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
  const bottomNavHeight = isMobile && !hideLayout ? BOTTOM_NAV_HEIGHT : 0;

  if (hideLayout) {
    return <>{children}</>;
  }

  const renderFab = () => {
    const fabStyles = {
      position: 'fixed',
      bottom: isMobile ? `calc(${bottomNavHeight}px + 16px)` : 16,
      right: 16,
    };

    switch (pathname) {
      case '/dashboard':
        const actions = [
          { icon: <AddIcon />, name: 'Add Loan', path: '/add-loan' },
          { icon: <PersonAddIcon />, name: 'Add Borrower', path: '/add-borrower' },
          { icon: <AttachMoneyIcon />, name: 'Add Payment', path: '/add-payment' },
        ];
        return (
          <SpeedDial
            ariaLabel="SpeedDial for primary actions"
            sx={fabStyles}
            icon={<SpeedDialIcon />}
          >
            {actions.map((action) => (
              <SpeedDialAction
                key={action.name}
                icon={action.icon}
                tooltipTitle={action.name}
                onClick={() => navigate(action.path)}
              />
            ))}
          </SpeedDial>
        );
      case '/borrowers':
        return (
          <Fab
            color="secondary"
            aria-label="add borrower"
            sx={fabStyles}
            onClick={() => navigate('/add-borrower')}
          >
            <PersonAddIcon />
          </Fab>
        );
      case '/loans':
        return (
          <Fab
            color="secondary"
            aria-label="add loan"
            sx={fabStyles}
            onClick={() => navigate('/add-loan')}
          >
            <AddIcon />
          </Fab>
        );
      case '/expenses':
        return (
          <Fab
            color="secondary"
            aria-label="add expense"
            sx={fabStyles}
            onClick={() => navigate('/expenses')}
          >
            <ReceiptIcon />
          </Fab>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />

      {/* Desktop Floating Navbar */}
      {!isMobile && (
        <FloatingNavBar
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
          onOpenLoanDetail={handleOpenLoanDetail}
          onSearchChange={handleSearchChange} // Use handleSearchChange from context
        />
      )}

      {/* Mobile Fixed Hamburger Button */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 8,
            left: 8,
            zIndex: theme.zIndex.appBar + 1,
            bgcolor: 'background.paper',
            borderRadius: '50%',
            boxShadow: theme.shadows[2],
          }}
        >
          <IconButton onClick={handleDrawerOpen} sx={{ color: theme.palette.secondary.main }}>
            <MenuIcon />
          </IconButton>
        </Box>
      )}

      {/* Mobile Search Bar, visible only when search is open */}
      <MobileSearchBar
        onSearchChange={handleSearchChange} // Use handleSearchChange from context
        onClose={handleMobileSearchClose} // Use handleMobileSearchClose from context
        open={isMobileSearchOpen} // Use isMobileSearchOpen from context
        searchTerm={searchTerm} // Use searchTerm from context
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
          pt: isMobileSearchOpen ? '76px' : null, // Adjust padding if search bar is open
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            pb: 4,
            px: isMobile ? 2 : 4,
          }}
        >
          {children} {/* No more React.cloneElement here */}
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
        onSearchOpen={handleMobileSearchOpen} // Use handleMobileSearchOpen from context
      />

      {/* Mobile Bottom Navbar */}
      {!hideLayout && isMobile && !isMobileSearchOpen && <BottomNavBar />}

      {/* Loan Detail Dialog */}
      <LoanDetailDialog
        key={selectedLoanId}
        open={loanDetailOpen}
        onClose={handleCloseLoanDetail}
        loanId={selectedLoanId}
      />

      {/* Context-aware FAB */}
      {renderFab()}
    </Box>
  );
};

export default AppLayout;
