import React from "react";
import { useLocation } from "react-router-dom";
import { useTheme, useMediaQuery, Box, Toolbar } from "@mui/material";
import AppBarTop from "./AppBarTop";
import BottomNavBar from "./BottomNavBar";
import Sidebar from "./Sidebar";

const drawerWidth = 220;

const AppLayout = ({ children, darkMode, onToggleDarkMode }) => {
  const { pathname } = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const hideLayout = ["/login", "/register", "/forgot-password"].includes(pathname);

  const bottomNavHeight = isMobile && !hideLayout ? 64 : 0;

  // Get toolbar height from theme or fallback
  const toolbarHeight =
    (theme.components?.MuiToolbar?.styleOverrides?.regular?.minHeight &&
      (isMobile
        ? theme.components.MuiToolbar.styleOverrides.regular["@media (max-width:600px)"]
            ?.minHeight || 56
        : theme.components.MuiToolbar.styleOverrides.regular.minHeight)) || 
    (isMobile ? 56 : 70);

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBarTop darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />

      {/* Toolbar spacer for app bar height */}
      <Toolbar sx={{ minHeight: toolbarHeight }} />

      <Box
        sx={{
          display: "flex",
          flex: 1,
          paddingBottom: `${bottomNavHeight}px`,
          height: `calc(100vh - ${toolbarHeight}px - ${bottomNavHeight}px)`,
        }}
      >
        <Sidebar drawerWidth={drawerWidth} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            boxSizing: "border-box",
            background: theme.palette.background.default,
            minHeight: 0,
            height: "100%",
            px: isMobile ? 2 : 4,
            pb: 0,
            position: "relative",
            zIndex: 0,
          }}
        >
          {children}
        </Box>
      </Box>

      {!hideLayout && isMobile && <BottomNavBar />}
    </Box>
  );
};

export default AppLayout;