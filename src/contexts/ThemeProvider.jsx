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
                // Dark Mode Palette: Modern Dark Blue/Green
                primary: {
                  main: '#80cbc4', // Teal/Aqua (lighter for contrast)
                  light: '#b2fef7',
                  dark: '#4f9a94',
                },
                secondary: {
                  main: '#f48fb1', // Light pink (retained for contrast/accent)
                  light: '#ffc1e3',
                  dark: '#be5f82',
                },
                background: {
                  default: '#1a202c', // Deeper, slightly bluish dark grey
                  paper: '#2d3748',   // Slightly lighter surface for cards
                },
                text: {
                  primary: '#e2e8f0', // Off-white
                  secondary: '#a0aec0', // Lighter grey
                },
                divider: 'rgba(255, 255, 255, 0.15)',
                success: { main: '#68d391' }, // Brighter green
                info: { main: '#63b3ed' },    // Muted blue
                warning: { main: '#f6ad55' }, // Muted orange
                error: { main: '#fc8181' },   // Muted red
              }
            : {
                // Light Mode Palette: Modern Muted Blue/Green
                primary: {
                  main: '#3182ce', // Moderate blue
                  light: '#63b3ed',
                  dark: '#2b6cb0',
                },
                secondary: {
                  main: '#d69e2e', // Muted orange/gold for secondary action
                  light: '#ecc94b',
                  dark: '#b7791f',
                },
                background: {
                  default: '#f7fafc', // Very light grey/off-white for main app background
                  paper: '#ffffff',   // Pure white for cards, sidebar
                },
                text: {
                  primary: 'rgba(23, 30, 46, 0.87)', // Very dark grey/blue text
                  secondary: 'rgba(23, 30, 46, 0.6)', // Muted dark grey/blue text
                },
                divider: 'rgba(0, 0, 0, 0.1)',
                success: { main: '#38a169' }, // Darker green
                info: { main: '#3182ce' },    // Same as primary
                warning: { main: '#d69e2e' }, // Same as secondary
                error: { main: '#e53e3e' },   // Muted red
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
