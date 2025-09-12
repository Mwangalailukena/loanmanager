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
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import FloatingNavBar from './FloatingNavBar';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from './BottomNavBar';
import MobileDrawer from './MobileDrawer';
import LoanDetailDialog from './LoanDetailDialog';
import SearchResults from './SearchResults';
import { useSearch } from '../contexts/SearchContext';

const MobileSearchBar = ({ onSearchChange, onClose, open, searchTerm }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -70 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -70 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar + 2,
          }}
        >
          <Box
            sx={{
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
              placeholder="Search loans, borrowers..."
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
                    <IconButton onClick={onClose} aria-label="close search">
                      <CloseIcon color="action" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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

    let fabContent = null;

    switch (pathname) {
      case '/dashboard':
        const actions = [
          { icon: <AddIcon />, name: 'Add Loan', path: '/add-loan' },
          { icon: <PersonAddIcon />, name: 'Add Borrower', path: '/add-borrower' },
          { icon: <AttachMoneyIcon />, name: 'Add Payment', path: '/add-payment' },
        ];
        fabContent = (
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
        break;
      case '/borrowers':
        fabContent = (
          <Fab color="secondary" aria-label="add borrower" sx={fabStyles} onClick={() => navigate('/add-borrower')}>
            <PersonAddIcon />
          </Fab>
        );
        break;
      case '/loans':
        fabContent = (
          <Fab color="secondary" aria-label="add loan" sx={fabStyles} onClick={() => navigate('/add-loan')}>
            <AddIcon />
          </Fab>
        );
        break;
      case '/expenses':
        fabContent = (
          <Fab color="secondary" aria-label="add expense" sx={fabStyles} onClick={() => navigate('/add-expense')}>
            <ReceiptIcon />
          </Fab>
        );
        break;
      default:
        fabContent = null;
    }

    return (
        <AnimatePresence>
            {fabContent && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                    {fabContent}
                </motion.div>
            )}
        </AnimatePresence>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />

      {!isMobile && (
        <FloatingNavBar
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
          onOpenLoanDetail={handleOpenLoanDetail}
        />
      )}

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

      <MobileSearchBar
        onSearchChange={handleSearchChange}
        onClose={handleMobileSearchClose}
        open={isMobileSearchOpen}
        searchTerm={searchTerm}
      />
      {isMobileSearchOpen && (
        <SearchResults
          variant="paper"
          onOpenLoanDetail={handleOpenLoanDetail}
          onClose={handleMobileSearchClose}
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
          pb: `${bottomNavHeight}px`,
          paddingTop: !isMobile ? '100px' : '64px',
        }}
      >
        <Container
          maxWidth="lg"
          sx={{ pb: 4, px: isMobile ? 2 : 4, }}
        >
          {children}
        </Container>
      </Box>

      <MobileDrawer
        open={mobileDrawerOpen}
        onClose={handleDrawerClose}
        onOpen={handleDrawerOpen}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        onOpenLoanDetail={handleOpenLoanDetail}
        onSearchOpen={handleMobileSearchOpen}
      />
      
      {!hideLayout && isMobile && <BottomNavBar />}

      <LoanDetailDialog
        key={selectedLoanId}
        open={loanDetailOpen}
        onClose={handleCloseLoanDetail}
        loanId={selectedLoanId}
      />

      {renderFab()}
    </Box>
  );
};

export default AppLayout;
