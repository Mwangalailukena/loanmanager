// src/components/AppLayout.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme, useMediaQuery, Box } from '@mui/material';

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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 1. Fixed AppBar */}
      <AppBarTop darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />

      {/* 2. This Box creates space BELOW the fixed AppBar and holds sidebar/main content */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          // This property creates the necessary space at the top, equal to the AppBar's height.
          paddingTop: theme.mixins.toolbar,
          // Apply padding at the bottom equal to the BottomNavBar's height.
          paddingBottom: `${bottomNavHeight}px`,
        }}
      >
        {/* Sidebar component */}
        {!hideLayout && <Sidebar drawerWidth={drawerWidth} />}

        {/* 3. This is the actual Main content area where your page components render. */}
        <Box
          component="main" // Renders semantically as a <main> HTML element
          sx={{
            flexGrow: 1, // Takes up remaining horizontal space
            overflowY: 'auto', // Enables vertical scrolling *within* this content area if content overflows.
            boxSizing: 'border-box', // Standard box model; padding/border are included in the element's total size.
            background: theme.palette.background.default,

            // Ensure the main content box fills available vertical space and has no default min-height pushing it.
            minHeight: 0,
            height: '100%', // Take 100% height of its flex parent (the Box above)

            // Internal horizontal padding (from theme spacing)
            px: isMobile ? 2 : 4, // Shorthand for paddingLeft and paddingRight

            // *** Increased top vertical space to 70px ***
            paddingTop: '70px', // Direct pixel value as requested
            pb: 0, // paddingBottom: 0
          }}
        >
          {children} {/* Your Dashboard content goes here */}
        </Box>
      </Box>

      {/* Bottom Navigation Bar */}
      {!hideLayout && isMobile && <BottomNavBar />}
    </Box>
  );
};

export default AppLayout;