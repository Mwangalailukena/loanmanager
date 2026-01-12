import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  IconButton,
  useTheme,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  Avatar,
  TextField,
  Dialog,
  Popover,
  Fade,
} from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
  Logout,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  ListAlt as ListAltIcon,
  History as HistoryIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthProvider";
import { useSearch } from "../contexts/SearchContext";
import { useNotifications } from "../hooks/useNotifications";

import SettingsPage from "../pages/SettingsPage";
import SearchResults from "./SearchResults";

function stringToInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const FloatingNavBar = ({ darkMode, onToggleDarkMode, onOpenAddLoan, onOpenAddPayment, onOpenAddBorrower, onOpenLoanSimulator }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { currentUser } = useAuth();

  const {
    unreadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Consume search context
  const {
    searchTerm,
    handleSearchChange,
    openLoanDetail,
  } = useSearch();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef();

  const openMenu = Boolean(anchorEl);
  const openNotifications = Boolean(notificationAnchor);

  useEffect(() => {
    setBarVisible(true);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100); 
    }
  }, [isSearchOpen]);

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
  };

  const navItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Borrowers", icon: <PeopleIcon />, path: "/borrowers" },
    { text: "Loans", icon: <ListAltIcon />, path: "/loans" },
    { text: "Expenses", icon: <ReceiptIcon />, path: "/expenses" },
    { text: "Reports", icon: <AssessmentIcon />, path: "/reports" },
    { text: "Activity", icon: <HistoryIcon />, path: "/activity" },
  ];

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/login"));
  };
  const handleSettingsClick = () => setSettingsOpen(true);
  const handleLoanSimulatorClick = () => {
    onOpenLoanSimulator();
    setAnchorEl(null);
  }
  const closeNotifications = () => setNotificationAnchor(null);
  const closeAllDialogs = () => {
    setSettingsOpen(false);
  };
  const handleNotificationItemClick = (notificationId, loanId) => {
    openLoanDetail(loanId);
    markAsRead(notificationId);
  };

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: 24,
          right: 24,
          left: "auto",
          p: 0.5,
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          width: "fit-content",
          maxWidth: "90%",
          borderRadius: 20, 
          backdropFilter: "blur(18px) saturate(180%)", 
          backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.5 : 0.7), 
          border: "1px solid " + (theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.03)), 
          boxShadow: theme.palette.mode === 'dark' 
            ? "0 6px 24px rgba(0, 0, 0, 0.3)" 
            : "0 6px 24px rgba(0, 0, 0, 0.03)", 
          zIndex: theme.zIndex.appBar + 1,
          transform: barVisible ? "translateY(0)" : "translateY(-100px)",
          opacity: barVisible ? 1 : 0,
          transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out",
        }}
      >
        {/* Navigation Links */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 0.5,
            borderRadius: 12,
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Button
                key={item.text}
                onClick={item.onClick ? item.onClick : () => navigate(item.path)}
                sx={{
                  textTransform: "none",
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  borderRadius: 10,
                  px: 2.5, 
                  py: 1.2, 
                  fontWeight: 600,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                  },
                  ...(isActive && {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }),
                }}
              >
                {item.text}
              </Button>
            );
          })}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
          {/* Search Button */}
          <IconButton onClick={toggleSearch} sx={{ mx: 0.5, borderRadius: "50%", p: 1, transition: "all 0.2s ease-in-out", "&:hover": { transform: "scale(1.1)" } }}>
            {isSearchOpen ? <CloseIcon sx={{ color: theme.palette.text.secondary }} /> : <SearchIcon sx={{ color: theme.palette.text.secondary }} />}          </IconButton>
          {/* Search Field (if open) */}
          <TextField
            inputRef={searchInputRef}
            size="small"
            variant="outlined"
            placeholder="Search loans..."
            onChange={(e) => handleSearchChange(e.target.value)} 
            value={searchTerm} 
            autoFocus
            aria-label="Search loans, borrowers, and payments"
            sx={{
              ml: 1,
              width: isSearchOpen ? 200 : 0, 
              opacity: isSearchOpen ? 1 : 0, 
              transition: "width 0.3s ease-in-out, opacity 0.3s ease-in-out",
              overflow: "hidden",
            }}
          />

          {/* Notifications Button */}
          <Tooltip title="Notifications">
            <IconButton onClick={(e) => setNotificationAnchor(e.currentTarget)} sx={{ mx: 0.5, borderRadius: "50%", p: 1, position: "relative", transition: "all 0.2s ease-in-out", "&:hover": { transform: "scale(1.1)" } }}>
              <NotificationsIcon sx={{ color: theme.palette.text.secondary }} />
              {unreadNotifications.length > 0 && (
                <Box
                  component="span"
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "error.main",
                    animation: `${pulse} 1.5s infinite`,
                  }}
                />
              )}
            </IconButton>
          </Tooltip>

          {/* Settings/Account Button */}
          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ mx: 0.5, borderRadius: "50%", p: 1, transition: "all 0.2s ease-in-out", "&:hover": { transform: "scale(1.1)" } }}>
              <Avatar
                sx={{ width: 24, height: 24, fontSize: "0.75rem", bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
                src={currentUser?.photoURL || ''}
              >
                {stringToInitials(currentUser?.displayName || "U")}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <SearchResults
        variant="popover"
        anchorEl={isSearchOpen ? searchInputRef.current : null}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Account Menu */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={() => setAnchorEl(null)}
        TransitionComponent={Fade}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1.5,
            borderRadius: 4, 
            backdropFilter: 'blur(18px) saturate(180%)', 
            backgroundColor: alpha(theme.palette.background.paper, 0.9), 
            border: '1px solid ' + alpha(theme.palette.divider, 0.1),
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)', 
            minWidth: 200,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Typography variant="subtitle1" sx={{ px: 2, pt: 1, fontWeight: 'bold' }}>
            {currentUser?.displayName || "User"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
            {currentUser?.email}
        </Typography>
        <Divider sx={{ my: 0.5 }} />
        
        <MenuItem onClick={handleSettingsClick} sx={{ mx: 1, borderRadius: 1.5, my: 0.7, py: 0.8 }}>
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            Settings
        </MenuItem>

        <MenuItem onClick={handleLoanSimulatorClick} sx={{ mx: 1, borderRadius: 1.5, my: 0.7, py: 0.8 }}>
            <ListItemIcon><CalculateIcon fontSize="small" /></ListItemIcon>
            Simulator
        </MenuItem>
        
        <MenuItem onClick={onToggleDarkMode} sx={{ mx: 1, borderRadius: 1.5, my: 0.7, py: 0.8 }}>
          <ListItemIcon>
            {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </ListItemIcon>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </MenuItem>

        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleLogout} sx={{ mx: 1, borderRadius: 1.5, my: 0.7, py: 0.8 }}><ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>Logout</MenuItem>
      </Menu>
      
      {/* Notifications Popover */}
      <Popover
        open={openNotifications}
        anchorEl={notificationAnchor}
        onClose={closeNotifications}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            width: 320,
            p: 1,
            borderRadius: 4, 
            backdropFilter: 'blur(18px) saturate(180%)', 
            backgroundColor: alpha(theme.palette.background.paper, 0.9), 
            border: '1px solid ' + alpha(theme.palette.divider, 0.1),
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)', 
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Notifications</Typography>
          {unreadNotifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No new notifications.</Typography>
          ) : (
            unreadNotifications.map(({ id, message, loanId, severity }) => (
              <MenuItem key={id} onClick={() => handleNotificationItemClick(id, loanId)} sx={{ borderRadius: 2, mb: 0.5, whiteSpace: 'normal', borderLeft: `4px solid ${severity === 'error' ? theme.palette.error.main : theme.palette.warning.main}` }}>
                <Typography variant="body2">{message}</Typography>
              </MenuItem>
            ))
          )}
          <Button onClick={markAllAsRead} color="primary" variant="text" sx={{ textTransform: 'none', mt: 1, width: '100%', borderRadius: 2 }}>
              Mark all as read
          </Button>
        </Box>
      </Popover>

      <Dialog
        open={settingsOpen}
        onClose={closeAllDialogs}
        maxWidth="sm"
        fullWidth
      >
        <SettingsPage onClose={closeAllDialogs} />
      </Dialog>
    </>
  );
};

export default React.memo(FloatingNavBar);
