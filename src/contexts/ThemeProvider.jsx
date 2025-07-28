import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";

const ThemeContext = createContext();

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  // Check localStorage for saved preference or default to system preference
  const getInitialMode = () => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) return saved === "true";
    // fallback to system preference
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const [darkMode, setDarkMode] = useState(getInitialMode);

  // Save preference on change
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Create MUI theme based on darkMode state
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          ...(darkMode
            ? {
                // Standard Material-UI Dark Mode Palette
                primary: {
                  main: '#90caf9', // Light blue
                },
                secondary: {
                  main: '#f48fb1', // Light pink
                },
                background: {
                  default: '#121212', // Very dark grey
                  paper: '#1d1d1d',   // Slightly lighter dark grey for surfaces
                },
                text: {
                  primary: '#ffffff', // White
                  secondary: '#b0b0b0', // Light grey
                },
                divider: 'rgba(255, 255, 255, 0.12)',
                success: { main: '#66bb6a' },
                info: { main: '#29b6f6' },
                warning: { main: '#ffa726' },
                error: { main: '#ef5350' },
              }
            : {
                // All-White Light Mode Palette (Default Material-UI feel)
                primary: {
                  main: '#1976d2', // Standard Material-UI blue
                },
                secondary: {
                  main: '#dc004e', // Standard Material-UI pink
                },
                background: {
                  default: '#ffffff', // Pure white for the main app background
                  paper: '#ffffff',   // Pure white for cards, sidebar, etc.
                },
                text: {
                  primary: 'rgba(0, 0, 0, 0.87)', // Standard dark text for contrast on white
                  secondary: 'rgba(0, 0, 0, 0.6)', // Standard muted text
                },
                divider: 'rgba(0, 0, 0, 0.12)',
                success: { main: '#4caf50' },
                info: { main: '#2196f3' },
                warning: { main: '#ff9800' },
                error: { main: '#f44336' },
              }),
        },
        typography: {
          fontFamily: 'Roboto, sans-serif',
          // optional typography overrides here
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: ({ theme }) => ({
                // *** CHANGE HERE: Set AppBar background to paper color in light mode ***
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.background.paper,
                // You might want to adjust shadow if white on white is hard to distinguish
                boxShadow: theme.shadows[theme.palette.mode === 'dark' ? 0 : 1], // Changed to shadow 1 for subtle elevation
              }),
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: ({ theme }) => ({
                backgroundColor: theme.palette.background.paper,
                borderRight: `1px solid ${theme.palette.divider}`,
              }),
            },
          },
          MuiCard: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundColor: theme.palette.background.paper,
              }),
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: ({ theme }) => ({
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.palette.primary.light + '20',
                  color: theme.palette.primary.main,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                },
                '&.Mui-selected:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : theme.palette.primary.light + '30',
                },
                color: theme.palette.text.secondary,
                '& .MuiListItemIcon-root': {
                  color: theme.palette.text.secondary,
                },
              }),
            },
          },
          MuiToolbar: {
            styleOverrides: {
                root: ({ theme }) => ({
                    // Toolbar background also matches paper in light mode now
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.background.paper,
                }),
            },
          },
        },
      }),
    [darkMode]
  );

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
