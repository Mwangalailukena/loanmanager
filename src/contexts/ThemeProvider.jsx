import React, { useState, createContext, useContext, useMemo, useEffect } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// 1. Create the context
const ThemeContext = createContext();

// Function to get the complete theme object for a given mode
const getAppTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#047857', // Accessible Fintech Emerald (Emerald 700)
        light: '#10B981',
        dark: '#064E3B',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#2563EB', // Accessible Modern Blue (Blue 600)
        light: '#60A5FA',
        dark: '#1E40AF',
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
      borderRadius: 16,
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
              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.2)',
              transform: 'translateY(-1px)',
            },
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: '#064E3B',
            },
          },
        },
      },
                  MuiPaper: {
                    styleOverrides: {
                      root: {
                        backgroundImage: 'none',
                        boxShadow: mode === 'dark'
                          ? '0px 1px 3px rgba(0, 0, 0, 0.6)'
                          : '0px 1px 3px rgba(0, 0, 0, 0.1)',
                        border: mode === 'dark'
                          ? '1px solid rgba(255, 255, 255, 0.15)'
                          : '1px solid rgba(0, 0, 0, 0.08)',
                      },
                    },
                  },
                  MuiBackdrop: {
                    styleOverrides: {
                      root: {
                        backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(8px)', // Global blur for all modals
                      },
                    },
                  },
                  MuiAlert: {        styleOverrides: {
          root: {
            // Ensures the text within the Alert uses the theme's text color for consistency
            '& .MuiAlert-message': {
              color: 'text.primary',
              fontWeight: 400,
            },
            // Reduce severity background opacity a bit
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            // Adjust border radius for consistency
            borderRadius: 10,
          },
          filledError: {
            backgroundColor: mode === 'dark' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.1)',
            color: mode === 'dark' ? '#F87171' : '#EF4444',
            '& .MuiAlert-icon': {
                color: mode === 'dark' ? '#F87171' : '#EF4444',
            },
          },
          filledSuccess: {
            backgroundColor: mode === 'dark' ? 'rgba(4, 120, 87, 0.2)' : 'rgba(4, 120, 87, 0.1)',
            color: mode === 'dark' ? '#047857' : '#047857',
             '& .MuiAlert-icon': {
                color: mode === 'dark' ? '#047857' : '#047857',
            },
          },
          filledInfo: {
            backgroundColor: mode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
            color: mode === 'dark' ? '#2563EB' : '#2563EB',
             '& .MuiAlert-icon': {
                color: mode === 'dark' ? '#2563EB' : '#2563EB',
            },
          },
          filledWarning: {
            backgroundColor: mode === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
            color: mode === 'dark' ? '#F59E0B' : '#F59E0B',
             '& .MuiAlert-icon': {
                color: mode === 'dark' ? '#F59E0B' : '#F59E0B',
            },
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
