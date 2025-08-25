import React, { useState, createContext, useContext, useMemo, useEffect } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";

// 1. Create the context
const ThemeContext = createContext();

// Function to get the complete theme object for a given mode
const getAppTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#0d77d4', 
        light: '#5d99ff',
        dark: '#004a9d',
        contrastText: '#fff',
      },
      secondary: {
        main: '#93c4c1',
        light: '#c5f7f3',
        dark: '#639491',
      },
      error: {
        main: '#f44336',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1d1d1d' : '#ffffff',
      },
    },
    typography: {
      fontFamily: ['Roboto', 'sans-serif'].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
      },
      button: {
        textTransform: 'none',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });

// 2. Create the provider component
export default function AppThemeProvider({ children }) {
  // Read initial state from local storage or default to system preference
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem("darkMode");
      return savedMode ? JSON.parse(savedMode) : false;
    } catch (error) {
      console.error("Failed to read from localStorage", error);
      return false;
    }
  });

  const onToggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Memoize the theme creation to avoid unnecessary re-renders
  const theme = useMemo(
    () => getAppTheme(darkMode ? "dark" : "light"),
    [darkMode]
  );

  // UseEffect to save the theme preference to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("darkMode", JSON.stringify(darkMode));
    } catch (error) {
      console.error("Failed to write to localStorage", error);
    }
  }, [darkMode]);
  
  // UseEffect to dynamically update the theme-color meta tag for PWA
  useEffect(() => {
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
      metaTag.setAttribute('content', theme.palette.primary.main);
    }
  }, [theme]);

  const value = useMemo(() => ({ darkMode, onToggleDarkMode }), [darkMode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

// 3. Create a custom hook to use the context
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a AppThemeProvider');
  }
  return context;
};
