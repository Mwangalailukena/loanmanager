import React, { useState, createContext, useContext, useMemo } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";

// 1. Create the context
const ThemeContext = createContext();

// 2. Create the provider component
export default function AppThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false); // Manages the dark mode state

  const onToggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Memoize the theme creation to avoid unnecessary re-renders
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: {
            main: "#0d77d4",
          },
          secondary: {
            main: "#93c4c1",
          },
        },
      }),
    [darkMode]
  );

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
