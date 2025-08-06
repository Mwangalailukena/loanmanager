// src/components/AppLayout.jsx

import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery, CssBaseline, useScrollTrigger, Fab, Zoom } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AppBarTop from './AppBarTop';
import SideNav from './SideNav';
import BottomNavBar from './BottomNavBar';
import { useAuth } from '../contexts/AuthProvider';
import LandingPage from '../pages/LandingPage';
import { AnimatePresence, motion } from 'framer-motion';

const drawerWidth = 240;
const transitionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

function ScrollTop({ children }) {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(
      '#back-to-top-anchor',
    );
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Zoom in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // NEW: State to hold the global search term
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSearchChange = (term) => {
    setGlobalSearchTerm(term);
    // If the user searches from another page, navigate them to the loan list.
    if (location.pathname !== '/loans' && term) {
      navigate('/loans');
    }
  };

  const handleOpenLoanDetail = (loanId) => {
    // Implement this if you have a modal for loan details
    // For now, let's just log it or navigate.
    console.log(`Open loan detail for: ${loanId}`);
    // Example: navigate(`/loans/${loanId}`);
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    // You would typically save this to localStorage
  };

  if (isAuthLoading) {
    return null;
  }

  if (!currentUser) {
    return <LandingPage />;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarTop
        onToggleDarkMode={handleToggleDarkMode}
        darkMode={darkMode}
        onSearchChange={handleSearchChange} // Pass the state handler
        onToggleDrawer={handleDrawerToggle}
        onOpenLoanDetail={handleOpenLoanDetail}
      />
      <SideNav mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 1 : 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          background: theme.palette.background.default,
          minHeight: '100vh',
        }}
      >
        <div id="back-to-top-anchor" />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={transitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* The magic happens here: we pass the global search term to the LoanList component */}
            <Outlet context={{ globalSearchTerm }} />
          </motion.div>
        </AnimatePresence>
      </Box>

      {isMobile && <BottomNavBar />}

      <ScrollTop>
        <Fab color="secondary" size="small" aria-label="scroll back to top">
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </Box>
  );
}
