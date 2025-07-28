import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Toolbar,
  useTheme,
  useMediaQuery,
  Box
} from '@mui/material';
import AppBarTop from './AppBarTop';
import BottomNavBar from './BottomNavBar';
import Sidebar from './Sidebar';

const drawerWidth = 220;

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);

  const bottomNavHeight = isMobile && !hideLayout ? 56 : 0; // Standard Material-UI BottomNavigation height

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBarTop darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />

      {/* This Toolbar creates space equal to the AppBar's height, pushing content down */}
      <Toolbar />

      <Box
        sx={{
          display: 'flex',
          flex: 1, // Allows this Box to grow and take available height
          overflow: 'hidden', // Prevents scrollbars on this flex container
          paddingBottom: `${bottomNavHeight}px`, // Space for BottomNavBar on mobile
        }}
      >
        {!hideLayout && <Sidebar />}

        {/* Main content area. It takes remaining space and has horizontal/bottom padding. */}
        <Box
          component="main"
          sx={{
            flexGrow: 1, // Allows main content to fill remaining width
            overflowY: 'auto', // Enables vertical scrolling for content if it overflows
            boxSizing: 'border-box', // Ensures padding is included in the element's total width/height
            background: theme.palette.background.default, // Use theme background color
            px: isMobile ? 2 : 4, // Horizontal padding for the content area
            pb: isMobile ? 2 : 4, // Bottom padding for the content area
            // IMPORTANT: No 'pt' here. Dashboard.jsx will handle its own initial top spacing.
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Bottom navigation bar, only visible on mobile */}
      <BottomNavBar />
    </Box>
  );
};

export default AppLayout;
