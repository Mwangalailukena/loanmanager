// src/components/AppLayout.jsx
import React from 'react';
import {
  useMediaQuery,
  useTheme,
  Box,
  Toolbar,
  CssBaseline,
} from '@mui/material';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';
import AppBarTop from './AppBarTop';

const AppLayout = ({ children }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm')); // 'sm' breakpoint is 600px and above

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />

      {/* Sidebar only visible on desktop */}
      {isDesktop && <Sidebar />}

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* AppBarTop visible on all screen sizes */}
        <AppBarTop />

        {/* Toolbar spacer to offset AppBar height */}
        <Toolbar />

        {/* Main content area */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>

        {/* Bottom navigation only visible on mobile */}
        {!isDesktop && <BottomNavBar />}
      </Box>
    </Box>
  );
};

export default AppLayout;

