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
        main: '#1976d2',
        light: '#63a4ff',
        dark: '#004ba0',
        contrastText: '#fff',
      },
      secondary: {
        main: '#009688',
        light: '#52c7b8',
        dark: '#00675b',
        contrastText: '#fff',
      },
      error: {
        main: '#f44336',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1d1d1d' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#212121',
        secondary: mode === 'dark' ? '#bdbdbd' : '#757575',
      }
    },
    typography: {
      fontFamily: ['Roboto', 'sans-serif'].join(','),
      h1: {
        fontFamily: ['Montserrat', 'sans-serif'].join(','),
        fontSize: '2.5rem',
        fontWeight: 700,
      },
      h2: {
        fontFamily: ['Montserrat', 'sans-serif'].join(','),
        fontSize: '2rem',
        fontWeight: 700,
      },
      h3: {
        fontFamily: ['Montserrat', 'sans-serif'].join(','),
        fontSize: '1.75rem',
        fontWeight: 600,
      },
      h4: {
        fontFamily: ['Montserrat', 'sans-serif'].join(','),
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h5: {
        fontFamily: ['Montserrat', 'sans-serif'].join(','),
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h6: {
        fontFamily: ['Montserrat', 'sans-serif'].join(','),
        fontSize: '1rem',
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
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
            borderRadius: 12,
            boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
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
