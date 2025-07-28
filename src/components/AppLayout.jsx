import React from 'react';
import { useLocation } from 'react-router-dom';
import { Toolbar, useTheme, useMediaQuery } from '@mui/material';
import AppBarTop from './AppBarTop';
import BottomNavBar from './BottomNavBar';
import Sidebar from './Sidebar';

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);

  // Heights for fixed bars
  const topBarHeight = isMobile ? 56 : 64; // MUI AppBar default heights
  const bottomNavHeight = isMobile && !hideLayout ? 64 : 0; // Your BottomNavBar height on mobile

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {!hideLayout && <AppBarTop darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />}
      {!hideLayout && <Toolbar />} {/* space for fixed AppBar */}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!hideLayout && <Sidebar />}

        <main
          style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '16px',
            paddingTop: !hideLayout ? `${topBarHeight + 8}px` : undefined, // dynamic top padding
            paddingBottom: !hideLayout ? `${bottomNavHeight + 8}px` : undefined, // dynamic bottom padding
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>

      {!hideLayout && <BottomNavBar />}
    </div>
  );
};

export default AppLayout;
