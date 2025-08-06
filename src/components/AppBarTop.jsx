// src/components/AppBarTop.jsx

import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  InputBase,
  Box,
  Badge,
  useTheme,
  alpha,
  useMediaQuery,
  styled,
TextField, 
  InputAdornment,
} from "@mui/material";
import {
  Menu,
  AccountCircle,
  Mail,
  Notifications,
  Search,
} from "@mui/icons-material";

// REMOVED: No longer needs to import useFirestore
// import { useFirestore } from "../contexts/FirestoreProvider";

const SearchContainer = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(3),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
}));

// UPDATED: Now accepts an onSearchChange prop from its parent
export default function AppBarTop({ onDrawerToggle, onSearchChange }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  // NEW: Local state for the search input value
  const [searchValue, setSearchValue] = useState("");

  // Handler for when the search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    // NEW: Call the parent's function to update the global search state
    onSearchChange(value);
  };

  // REMOVED: This function is no longer needed here
  // const { loans } = useFirestore();

  return (
    <AppBar position="fixed" elevation={1}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2 }}
        >
          <Menu />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ display: { xs: "none", sm: "block" } }}>
          Loan Tracker
        </Typography>

        {/* UPDATED: Search field is now a controlled component */}
        <Box sx={{ flexGrow: 1 }} />
        <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={searchValue}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'white' }} />
                </InputAdornment>
              ),
              sx: {
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
              }
            }}
          />
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton size="large" aria-label="show 4 new mails" color="inherit">
            <Badge badgeContent={4} color="error">
              <Mail />
            </Badge>
          </IconButton>
          <IconButton size="large" aria-label="show 17 new notifications" color="inherit">
            <Badge badgeContent={17} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton size="large" edge="end" aria-label="account of current user" color="inherit">
            <AccountCircle />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
