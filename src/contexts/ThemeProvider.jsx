import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";

const ThemeContext = createContext();

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const getInitialMode = () => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) return saved === "true";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const [darkMode, setDarkMode] = useState(getInitialMode);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          ...(darkMode
            ? {
                // Dark Mode Palette: Vibrant Purple & Orange
                primary: {
                  main: '#ce93d8', // Light Purple
                  light: '#ffe4ff',
                  dark: '#9c64a6',
                },
                secondary: {
                  main: '#ffab40', // Deep Orange Accent
                  light: '#ffdd71',
                  dark: '#c77c00',
                },
                background: {
                  default: '#1a1a2e', // Very dark blue/purple
                  paper: '#2a2a47',   // Slightly lighter blue/purple for surfaces
                },
                text: {
                  primary: '#ffffff', // White
                  secondary: '#d1d1d1', // Light grey
                },
                divider: 'rgba(255, 255, 255, 0.15)',
                success: { main: '#69f0ae' }, // Bright green
                info: { main: '#82b1ff' },    // Light blue
                warning: { main: '#ffea00' }, // Yellow
                error: { main: '#ff8a80' },   // Light red
              }
            : {
                // Light Mode Palette: Vibrant Purple & Orange
                primary: {
                  main: '#9c27b0', // Deep Purple
                  light: '#d05ce3',
                  dark: '#6a0080',
                },
                secondary: {
                  main: '#ff6f00', // Orange
                  light: '#ffa040',
                  dark: '#c43e00',
                },
                background: {
                  default: '#f3f6f9', // Very light grey
                  paper: '#ffffff',   // Pure white
                },
                text: {
                  primary: 'rgba(0, 0, 0, 0.87)',
                  secondary: 'rgba(0, 0, 0, 0.6)',
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
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.background.paper,
                boxShadow: theme.shadows[theme.palette.mode === 'dark' ? 0 : 1],
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
