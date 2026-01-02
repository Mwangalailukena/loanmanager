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
        main: '#10B981', // Fintech Emerald
        light: '#34D399',
        dark: '#059669',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#3B82F6', // Modern Blue
        light: '#60A5FA',
        dark: '#2563EB',
        contrastText: '#FFFFFF',
      },
      error: {
        main: mode === 'dark' ? '#F87171' : '#EF4444',
      },
      background: {
        default: mode === 'dark' ? '#0A0F1E' : '#F9FAFB', // Deep Navy for dark mode
        paper: mode === 'dark' ? '#161E31' : '#FFFFFF',  // Slightly lighter surface
      },
      text: {
        primary: mode === 'dark' ? '#F3F4F6' : '#111827',
        secondary: mode === 'dark' ? '#9CA3AF' : '#4B5563',
      },
      divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: ['"Inter"', '"Roboto"', 'sans-serif'].join(','),
      h1: {
        fontFamily: ['"Montserrat"', 'sans-serif'].join(','),
        fontSize: '2.5rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontFamily: ['"Montserrat"', 'sans-serif'].join(','),
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontFamily: ['"Montserrat"', 'sans-serif'].join(','),
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h4: {
        fontFamily: ['"Montserrat"', 'sans-serif'].join(','),
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h5: {
        fontFamily: ['"Montserrat"', 'sans-serif'].join(','),
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h6: {
        fontFamily: ['"Montserrat"', 'sans-serif'].join(','),
        fontSize: '1rem',
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.01em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            backgroundColor: 'transparent',
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 20px',
            boxShadow: 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              transform: 'translateY(-1px)',
            },
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: '#059669',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
              : '0 4px 20px rgba(0, 0, 0, 0.03)',
            border: mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.05)'
              : '1px solid rgba(0, 0, 0, 0.02)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
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
