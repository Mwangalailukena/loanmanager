// File: src/components/AppLayout.jsx import React from 'react'; import { Outlet, useLocation } from 'react-router-dom'; import { useTheme, useMediaQuery, Box } from '@mui/material';

import AppBarTop from './AppBarTop'; import BottomNavBar from './BottomNavBar'; import Sidebar from './Sidebar';

const drawerWidth = 220;

const AppLayout = ({ darkMode, onToggleDarkMode }) => { const { pathname } = useLocation(); const theme = useTheme(); const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);

const bottomNavHeight = isMobile && !hideLayout ? 64 : 0;

if (hideLayout) { return <Outlet />; }

return ( <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}> {/* Top App Bar */} <AppBarTop darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />

{/* Main container below AppBar */}
  <Box
    sx={{
      display: 'flex',
      flex: 1,
      paddingTop: theme.mixins.toolbar,
      paddingBottom: `${bottomNavHeight}px`,
    }}
  >
    {!hideLayout && <Sidebar drawerWidth={drawerWidth} />}

    {/* Main content area */}
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
    >
      <Outlet />
    </Box>
  </Box>

  {/* Bottom Nav for mobile */}
  {!hideLayout && isMobile && <BottomNavBar />}
</Box>

); };

export default AppLayout;

