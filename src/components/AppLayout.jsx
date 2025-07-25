// src/components/AppLayout.jsx
import React from 'react';
import {
  useMediaQuery,
  useTheme,
  Box,
  Toolbar,
  CssBaseline,
  Slide,
} from '@mui/material';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';
import AppBarTop from './AppBarTop';

const AppLayout = ({ children }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm')); // 600px and above

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />

      {/* Animate Sidebar for desktop */}
      <Slide direction="right" in={isDesktop} mountOnEnter unmountOnExit>
        <Box>
          <Sidebar />
        </Box>
      </Slide>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBarTop />
        <Toolbar />

        {/* Main content */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>

        {/* Animate BottomNavBar for mobile */}
        <Slide direction="up" in={!isDesktop} mountOnEnter unmountOnExit>
          <Box>
            <BottomNavBar />
          </Box>
        </Slide>
      </Box>
    </Box>
  );
};

export default AppLayout;

