import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme, useMediaQuery, Box, CssBaseline } from '@mui/material';

import AppBarTop from './AppBarTop';
import BottomNavBar from './BottomNavBar';
import Sidebar from './Sidebar';

const drawerWidth = 220;

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);

  const bottomNavHeight = isMobile && !hideLayout ? 64 : 0;

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* 1. Fixed AppBar */}
        <AppBarTop darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />

        {/* 2. Main container: sidebar + content */}
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            paddingTop: theme.mixins.toolbar.minHeight || 64,
            paddingBottom: `${bottomNavHeight}px`,
          }}
        >
          {/* Sidebar */}
          <Sidebar drawerWidth={drawerWidth} />

          {/* Main content */}
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
            aria-label="Main content"
          >
            {children}
          </Box>
        </Box>

        {/* Bottom NavBar only on mobile */}
        {isMobile && <BottomNavBar />}
      </Box>
    </>
  );
};

export default AppLayout;