import React, { useState, useEffect, useCallback } from 'react';
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
  Fab,
  Zoom,
} from '@mui/material';
import {
  MenuRounded as MenuIcon,
  SearchRounded as SearchIcon,
  CloseRounded as CloseIcon,
  KeyboardArrowUpRounded as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import FloatingNavBar from './FloatingNavBar';
import BottomNavBar, { BOTTOM_NAV_HEIGHT } from './BottomNavBar';
import MobileDrawer from './MobileDrawer';
import LoanDetailDialog from './LoanDetailDialog';
import AddLoanDialog from './AddLoanDialog';
import AddPaymentDialog from './AddPaymentDialog';
import AddBorrowerDialog from './AddBorrowerDialog';
import AddExpenseDialog from './AddExpenseDialog';
import SearchResults from './SearchResults';
import { useSearch } from '../contexts/SearchContext';
import { useSnackbar } from '../components/SnackbarProvider'; // Import useSnackbar
import { requestNotificationPermission, onForegroundMessage } from '../utils/push'; // Import push notification utils
import { useAuth } from '../contexts/AuthProvider'; // Import auth context to check user status

const MobileSearchBar = ({ onSearchChange, onClose, open, searchTerm }) => {
  // ... (This component remains unchanged)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -70 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -70 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.appBar + 2, }}
        >
          <Box sx={{ bgcolor: 'background.paper', p: 1, boxShadow: (theme) => theme.shadows[4], display: 'flex', alignItems: 'center', }} >
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
                    <IconButton onClick={onClose} aria-label="Close search">
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const showSnackbar = useSnackbar();
  const { currentUser } = useAuth();

  const {
    searchTerm,
    handleSearchChange,
    isMobileSearchOpen,
    handleMobileSearchClose,
    loanDetailOpen,
    selectedLoanId,
    openLoanDetail,
    closeLoanDetail,
  } = useSearch();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSidebarMini, setIsSidebarMini] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Global Modal States
  const [addLoanOpen, setAddLoanOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [addBorrowerOpen, setAddBorrowerOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  const openAddLoan = useCallback(() => setAddLoanOpen(true), []);
  const openAddPayment = useCallback(() => setAddPaymentOpen(true), []);
  const openAddBorrower = useCallback(() => setAddBorrowerOpen(true), []);
  const openAddExpense = useCallback(() => setAddExpenseOpen(true), []);

  // --- Push Notifications Effect ---
  useEffect(() => {
    // Only run if there is a logged-in user
    if (currentUser) {
      // Request permission as soon as the app layout mounts
      requestNotificationPermission();

      // Set up the foreground message listener
      const unsubscribe = onForegroundMessage((payload) => {
        const { notification } = payload;
        // Display the notification using the app's snackbar
        showSnackbar(
          `${notification.title}: ${notification.body}`,
          'info'
        );
      });

      // Clean up the listener when the component unmounts
      return () => {
        unsubscribe();
      };
    }
  }, [currentUser, showSnackbar]);

  // --- Back to Top: Scroll Listener Effect ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const handleDrawerOpen = useCallback(() => setMobileDrawerOpen(true), []);
  const handleDrawerClose = useCallback(() => setMobileDrawerOpen(false), []);

  const isDesktop = !isMobile;
  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);
  const bottomNavHeight = isMobile && !hideLayout ? BOTTOM_NAV_HEIGHT : 0;
  const drawerWidth = isDesktop ? (isSidebarMini ? '72px' : '240px') : '0px';

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {!isMobile && ( 
        <Box sx={{ 
          ml: drawerWidth, 
          transition: theme.transitions.create('margin', { duration: theme.transitions.duration.standard }) 
        }}>
          <FloatingNavBar 
            darkMode={darkMode} 
            onToggleDarkMode={onToggleDarkMode} 
            onOpenAddLoan={openAddLoan}
            onOpenAddPayment={openAddPayment}
            onOpenAddBorrower={openAddBorrower}
          /> 
        </Box>
      )}
      {isMobile && ( <Box sx={{ position: 'fixed', top: 8, left: 8, zIndex: theme.zIndex.appBar + 1, bgcolor: 'background.paper', borderRadius: '50%', boxShadow: theme.shadows[2], }} > <IconButton onClick={handleDrawerOpen} sx={{ color: theme.palette.secondary.main }}><MenuIcon /></IconButton> </Box> )}
      <MobileSearchBar onSearchChange={handleSearchChange} onClose={handleMobileSearchClose} open={isMobileSearchOpen} searchTerm={searchTerm} />
      {isMobileSearchOpen && ( <SearchResults variant="paper" onOpenLoanDetail={openLoanDetail} onClose={handleMobileSearchClose} /> )}
      
      <MobileDrawer 
        open={isDesktop || mobileDrawerOpen} 
        onClose={handleDrawerClose} 
        onOpen={handleDrawerOpen} 
        darkMode={darkMode} 
        onToggleDarkMode={onToggleDarkMode} 
        variant={isDesktop ? 'permanent' : 'temporary'}
        mini={isDesktop && isSidebarMini}
        onToggleMini={() => setIsSidebarMini(!isSidebarMini)}
        onOpenAddLoan={openAddLoan}
        onOpenAddPayment={openAddPayment}
        onOpenAddBorrower={openAddBorrower}
      />

      <Box component="main" sx={{
        flexGrow: 1,
        overflowY: 'auto',
        boxSizing: 'border-box',
        background: theme.palette.background.default,
        minHeight: 0,
        height: '100%',
        ml: drawerWidth,
        pb: `${bottomNavHeight}px`,
        paddingTop: !isMobile ? '100px' : '64px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23${theme.palette.text.disabled.substring(1)}' fill-opacity='0.1'%3E%3Ccircle cx='10' cy='10' r='1'%3E%3C/circle%3E%3C/g%3E%3C/svg%3E")`,
        backgroundAttachment: 'fixed',
        backgroundSize: '20px 20px',
        transition: theme.transitions.create('margin', { duration: theme.transitions.duration.standard }),
      }} >
        <Container maxWidth="lg" sx={{ pb: 4, px: isMobile ? 2 : 4, }} >
          {children}
        </Container>
      </Box>
      
      {!hideLayout && isMobile && (
        <BottomNavBar 
          onOpenAddLoan={openAddLoan} 
          onOpenAddPayment={openAddPayment}
          onOpenAddBorrower={openAddBorrower}
          onOpenAddExpense={openAddExpense}
        />
      )}
      <LoanDetailDialog key={selectedLoanId} open={loanDetailOpen} onClose={closeLoanDetail} loanId={selectedLoanId} />
      
      {/* Global Dialogs */}
      <AddLoanDialog open={addLoanOpen} onClose={() => setAddLoanOpen(false)} />
      <AddPaymentDialog open={addPaymentOpen} onClose={() => setAddPaymentOpen(false)} />
      <AddBorrowerDialog open={addBorrowerOpen} onClose={() => setAddBorrowerOpen(false)} />
      <AddExpenseDialog open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} />

      <Zoom in={showBackToTop}>
        <Fab
          color="primary"
          size="small"
          aria-label="scroll back to top"
          onClick={handleScrollToTop}
          sx={{
            position: 'fixed',
            bottom: isMobile ? `calc(${bottomNavHeight}px + 88px)` : 88,
            right: 16,
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default AppLayout;