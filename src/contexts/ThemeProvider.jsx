import React, { useMemo } from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

export default function AppThemeProvider({ darkMode, children }) {
  // Use useMemo to prevent the theme from being recreated on every render
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
          // Removed the manual light mode background overrides, as MUI handles this.
          // The palette.mode property automatically sets the correct
          // background and text colors for light and dark modes.
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                // Removed the manual body background color override.
                // MUI's theme handles this automatically based on palette.mode.
                // This ensures consistency across the entire theme.
                margin: 0,
                padding: 0,
              },
            },
          },
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
