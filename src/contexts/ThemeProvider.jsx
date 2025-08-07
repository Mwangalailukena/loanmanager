// src/contexts/ThemeProvider.jsx

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
          primary: {
            main: darkMode ? '#8561c5' : '#6c63ff',
            light: darkMode ? '#b68efc' : '#8e88ff',
            dark: darkMode ? '#3e3776' : '#5750cc',
            contrastText: '#ffffff',
          },
          secondary: {
            main: darkMode ? '#a7c0f1' : '#42a5f5',
            light: darkMode ? '#d9efff' : '#81d4fa',
            dark: darkMode ? '#5979bb' : '#1976d2',
            contrastText: '#ffffff',
          },
          background: {
            default: darkMode ? '#121212' : '#E8F5E9',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
          text: {
            primary: darkMode ? '#ffffff' : '#212121',
            secondary: darkMode ? '#b0b0b0' : '#757575',
            disabled: darkMode ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.38)',
          },
          divider: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
          success: {
            main: darkMode ? '#69f0ae' : '#4caf50',
            light: darkMode ? '#9ff2c8' : '#81c784',
            dark: darkMode ? '#3e9c71' : '#388e3c',
          },
          info: {
            main: darkMode ? '#82b1ff' : '#2196f3',
            light: darkMode ? '#b3caff' : '#64b5f6',
            dark: darkMode ? '#5c7cc9' : '#1976d2',
          },
          warning: {
            main: darkMode ? '#ffea00' : '#ff9800',
            light: darkMode ? '#ffed5d' : '#ffb74d',
            dark: darkMode ? '#c7ab00' : '#f57c00',
          },
          error: {
            main: darkMode ? '#ff8a80' : '#f44336',
            light: darkMode ? '#ffb9b3' : '#e57373',
            dark: darkMode ? '#c75956' : '#d32f2f',
          },
        },
        typography: {
          fontFamily: 'Inter, Roboto, sans-serif',
          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 700 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: ({ theme }) => ({
                // Removed the conflicting backgroundColor style
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
                borderRadius: theme.shape.borderRadius,
                boxShadow: `0px 4px 20px rgba(0, 0, 0, 0.05)`,
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
                // Removed the conflicting backgroundColor style
              }),
            },
          },
          MuiButton: {
            styleOverrides: {
              containedPrimary: ({ theme }) => ({
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                borderRadius: theme.shape.borderRadius,
              }),
              containedSecondary: ({ theme }) => ({
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.secondary.dark,
                },
                borderRadius: theme.shape.borderRadius,
              }),
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: ({ theme }) => ({
                borderRadius: theme.shape.borderRadius,
                '&.MuiAlert-standardSuccess': {
                  backgroundColor: theme.palette.success.light,
                  color: theme.palette.success.dark,
                  '& .MuiAlert-icon': { color: theme.palette.success.main },
                },
                '&.MuiAlert-standardInfo': {
                  backgroundColor: theme.palette.info.light,
                  color: theme.palette.info.dark,
                  '& .MuiAlert-icon': { color: theme.palette.info.main },
                },
                '&.MuiAlert-standardWarning': {
                  backgroundColor: theme.palette.warning.light,
                  color: theme.palette.warning.dark,
                  '& .MuiAlert-icon': { color: theme.palette.warning.main },
                },
                '&.MuiAlert-standardError': {
                  backgroundColor: theme.palette.error.light,
                  color: theme.palette.error.dark,
                  '& .MuiAlert-icon': { color: theme.palette.error.main },
                },
              }),
            },
          },
          MuiAccordion: {
            styleOverrides: {
              root: ({ theme }) => ({
                borderRadius: theme.shape.borderRadius,
                overflow: 'hidden',
                boxShadow: `0px 4px 20px rgba(0, 0, 0, 0.05)`,
                '&.Mui-expanded': {
                  margin: '0 !important',
                },
                '&:before': {
                  display: 'none',
                },
              }),
            },
          },
          MuiAccordionSummary: {
            styleOverrides: {
              root: ({ theme }) => ({
                backgroundColor: theme.palette.background.paper,
                borderBottom: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
                minHeight: '64px',
                '&.Mui-expanded': {
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }),
            },
          },
          MuiLinearProgress: {
            styleOverrides: {
              root: ({ theme }) => ({
                borderRadius: 5,
                backgroundColor: theme.palette.action.disabledBackground,
              }),
            },
          },
          MuiFab: {
            styleOverrides: {
              root: {
                boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
              },
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
