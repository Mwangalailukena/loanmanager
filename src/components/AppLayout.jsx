// src/components/AppLayout.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  useTheme,
  useMediaQuery,
  Box
} from '@mui/material';

import AppBarTop from './AppBarTop';
import BottomNavBar from './BottomNavBar';
import Sidebar from './Sidebar'; // Ensure Sidebar component is updated to accept a 'drawerWidth' prop

// Define the drawerWidth here, which will be passed to Sidebar
const drawerWidth = 220;

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Determine if the current path should hide the main app layout elements
  // (e.g., for login, register, forgot password pages)
  const hideLayout = ['/login', '/register', '/forgot-password'].includes(pathname);

  // Define the actual height of the BottomNavBar (64px based on Material-UI standards/your component)
  // This is used to create space at the bottom of the content for the fixed nav bar.
  const bottomNavHeight = isMobile && !hideLayout ? 64 : 0;

  // If hideLayout is true, render only the children (e.g., Login, Register pages)
  // without any AppBar, Sidebar, or BottomNavBar.
  if (hideLayout) {
    return <>{children}</>;
  }

  // Render the full application layout
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Application Bar (fixed at the top of the viewport) */}
      <AppBarTop darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />

      {/* Main content wrapper:
          This Box handles the vertical positioning of content between the AppBar and BottomNavBar.
          It also acts as the horizontal flex container for the Sidebar and the main page content. */}
      <Box
        sx={{
          display: 'flex',         // Makes this a flex container for its children (Sidebar, main content Box)
          flex: 1,                 // This is crucial: it tells this Box to grow and take all available
                                   // vertical space between the fixed AppBar and the fixed BottomNavBar.
          overflow: 'hidden',      // Prevents unwanted scrollbars on this outer container.

          // Apply padding at the top equal to the AppBar's height.
          // `theme.mixins.toolbar` provides the correct height (56px for mobile, 64px for desktop).
          paddingTop: theme.mixins.toolbar,

          // Apply padding at the bottom equal to the BottomNavBar's height.
          // This creates space so content doesn't go under the BottomNavBar on mobile.
          paddingBottom: `${bottomNavHeight}px`,
        }}
      >
        {/* Sidebar component (conditionally rendered and receiving drawerWidth) */}
        {/* The Sidebar will take its specified 'drawerWidth' on desktop. */}
        {!hideLayout && <Sidebar drawerWidth={drawerWidth} />}

        {/* Main content area: This is where your routed page components (e.g., Dashboard, LoanList) render. */}
        <Box
          component="main"       // Renders semantically as a <main> HTML element
          sx={{
            flexGrow: 1,           // This is crucial: because its parent is `display: 'flex'`,
                                   // `flexGrow: 1` makes this <main> Box take up all the *remaining horizontal space*.
                                   // On mobile (no Sidebar), it's 100%. On desktop (with Sidebar), it fills space to the right of Sidebar.
            overflowY: 'auto',     // Enables vertical scrolling *within* this specific content area if content overflows.
            boxSizing: 'border-box', // Standard box model; padding/border are included in the element's total size.
            background: theme.palette.background.default, // Uses the theme's background color.

            // Horizontal padding for the content area. This is internal content spacing.
            // px: isMobile ? 2 : 4, // This was for horizontal padding, now we'll use the combined 'padding' below

            // *** Changed padding from 0 to 8px ***
            padding: 9, // Applies 8px padding on all four sides (top, right, bottom, left)
          }}
        >
          {children} {/* This is the placeholder where your routed content (from AppRoutes.jsx) will appear */}
        </Box>
      </Box>

      {/* Bottom Navigation Bar (conditionally rendered only on mobile and when not hidden) */}
      {/* It is fixed at the bottom of the viewport. */}
      {!hideLayout && isMobile && <BottomNavBar />}
    </Box>
  );
};

export default AppLayout;
