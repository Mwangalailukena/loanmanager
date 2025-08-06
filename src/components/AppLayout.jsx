// src/components/AppLayout.jsx

import React, { useState } from "react";
import { Box, Toolbar, useTheme } from "@mui/material";
import AppBarTop from "./AppBarTop";
import Sidebar from "./Sidebar";
import LoanList from "../pages/LoanList"; // Make sure to import LoanList to use its name for the check

export default function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();

  const [searchTerm, setSearchTerm] = useState("");

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // CORRECTED: Use React.Children.map to carefully pass the prop
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // We check if the child component is specifically the LoanList component
      // Only then do we inject the globalSearchTerm prop
      if (child.type.name === LoanList.name) {
        return React.cloneElement(child, { globalSearchTerm: searchTerm });
      }
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
