import React from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

export default function AppThemeProvider({ darkMode, children }) {
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: "#0d77d4",
      },
      secondary: {
        main: "#93c4c1",
      },
      background: {
        default: "#ffffff", // All white background
        paper: "#ffffff",   // Paper also white
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: "#ffffff", // White body background
            margin: 0,
            padding: 0,
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}