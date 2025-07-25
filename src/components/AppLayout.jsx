import React from 'react';
import { useLocation } from 'react-router-dom';
import { Toolbar } from '@mui/material';
import AppBarTop from './AppBarTop';
import BottomNavBar from './BottomNavBar';
import Sidebar from './Sidebar';

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);

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
            paddingBottom: hideLayout ? 0 : '72px', // leave space for BottomNavBar
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

