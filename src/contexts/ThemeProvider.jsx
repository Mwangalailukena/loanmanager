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
          // Only define specific background colors for the 'light' mode.
          // When in 'dark' mode, MUI will automatically apply its default
          // dark background colors.
          ...(darkMode
            ? {
                // Dark mode specific palette overrides can go here if needed
                // For example:
                // background: {
                //   default: '#121212',
                //   paper: '#1e1e1e',
                // },
              }
            : {
                // Light mode specific palette overrides
                background: {
                  default: "#ffffff",
                  paper: "#ffffff",
                },
              }),
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                // Set the body background color based on the current theme.
                // This will be '#ffffff' in light mode and MUI's default
                // dark background color in dark mode.
                backgroundColor: darkMode
                  ? "hsl(0, 0%, 15%)" // Example dark background color
                  : "#ffffff",
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
