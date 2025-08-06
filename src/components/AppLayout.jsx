// src/components/AppLayout.jsx

import React, { useState } from "react";
import { Box, Toolbar, useTheme } from "@mui/material";
import AppBarTop from "./AppBarTop";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();

  // NEW: State to hold the global search term
  const [searchTerm, setSearchTerm] = useState("");

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // NEW: Use React.cloneElement to pass the searchTerm prop to children
  const childrenWithProps = React.Children.map(children, child => {
    // Check if the child is a valid React element before cloning
    if (React.isValidElement(child)) {
      // Pass the searchTerm prop to the child component (e.g., LoanList)
      return React.cloneElement(child, { globalSearchTerm: searchTerm });
    }
    return child;
  });

  return (
    <Box sx={{ display: "flex" }}>
      <AppBarTop onDrawerToggle={handleDrawerToggle} onSearchChange={setSearchTerm} />
      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${240}px)` },
          [theme.breakpoints.up("sm")]: { ml: `${240}px` },
        }}
      >
        <Toolbar />
        {childrenWithProps}
      </Box>
    </Box>
  );
}
