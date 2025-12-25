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
        main: '#6200EE', // Deep Purple
        light: '#BB86FC',
        dark: '#3700B3',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#03DAC6', // Vibrant Teal/Aqua
        light: '#66FAF1',
        dark: '#00B8AC',
        contrastText: '#000000', // Ensure good contrast
      },
      error: {
        main: mode === 'dark' ? '#CF6679' : '#f44336', // Slightly softer red for dark mode
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#F8F8F8', // Slightly lighter default for light mode
        paper: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
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
            borderRadius: 20, // More rounded (pill-shaped)
            boxShadow: '0 4px 10px 0 rgba(0,0,0,0.15)', // Slightly more pronounced shadow
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: '0 6px 12px 0 rgba(0,0,0,0.2)', // Lift effect on hover
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12, // Apply a consistent border radius to all Paper components
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)', // More noticeable but elegant shadow
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
