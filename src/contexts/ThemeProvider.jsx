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
                // Dark Mode Palette: Vibrant Purple & Amber Accent
                primary: {
                  main: '#ce93d8', // Light Purple
                  light: '#ffe4ff',
                  dark: '#9c64a6',
                },
                secondary: {
                  main: '#ffc107', // Vibrant Amber Accent
                  light: '#fff350',
                  dark: '#c79100',
                },
                background: {
                  default: '#1a1a2e',
                  paper: '#2a2a47',
                },
                text: {
                  primary: '#ffffff',
                  secondary: '#d1d1d1',
                },
                divider: 'rgba(255, 255, 255, 0.15)',
                success: { main: '#69f0ae' },
                info: { main: '#82b1ff' },
                warning: { main: '#ffea00' },
                error: { main: '#ff8a80' },
              }
            : {
                // Light Mode Palette: Deep Purple & Amber Accent
                primary: {
                  main: '#9c27b0', // Deep Purple
                  light: '#d05ce3',
                  dark: '#6a0080',
                },
                secondary: {
                  main: '#ffc107', // Vibrant Amber Accent
                  light: '#fff350',
                  dark: '#c79100',
                },
                background: {
                  default: '#f3f6f9',
                  paper: '#ffffff',
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
          // New override to demonstrate the accent color on buttons
          MuiButton: {
            styleOverrides: {
              containedSecondary: ({ theme }) => ({
                // Use the secondary color for contained buttons
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.secondary.dark,
                },
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
