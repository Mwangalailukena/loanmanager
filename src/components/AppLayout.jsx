// src/components/AppLayout.jsx
import React from 'react';
import { useMediaQuery, Box, Toolbar, CssBaseline } from '@mui/material';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';
import AppBarTop from './AppBarTop';

const AppLayout = ({ children }) => {
  const isDesktop = useMediaQuery('(min-width:600px)');

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      {isDesktop && <Sidebar />}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBarTop />
        <Toolbar /> {/* Spacer for AppBar */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
        {!isDesktop && <BottomNavBar />}
      </Box>
    </Box>
  );
};

export default AppLayout;

