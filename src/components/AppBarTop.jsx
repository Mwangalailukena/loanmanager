import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  Divider,
  ListItemIcon,
  Dialog,
  useMediaQuery,
  useTheme,
  Popover,
  TextField,
  InputAdornment,
  Box,
} from "@mui/material";
import {
  Logout,
  Settings as SettingsIcon,
  LockReset as LockResetIcon,
  Notifications as NotificationsIcon,
  HelpOutline,
  History,
  Search as SearchIcon,
  Close as CloseIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from "@mui/icons-material";
import MenuIcon from "@mui/icons-material/Menu";
import Slide from "@mui/material/Slide";
import { useAuth } from "../contexts/AuthProvider";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import SettingsPage from "../pages/SettingsPage";
import HelpDialog from "./HelpDialog";
import dayjs from "dayjs";

function stringToInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AppBarTop = ({ onToggleDarkMode, darkMode }) => {
  const { user } = useAuth();
  const { loans } = useFirestore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState([]);

  const openMenu = Boolean(anchorEl);
  const openNotifications = Boolean(notificationAnchor);

  // Update notifications based on loans
  useEffect(() => {
    if (!loans) return;
    const now = dayjs();
    const upcoming = loans.filter(
      (loan) =>
        loan.status !== "Paid" &&
        dayjs(loan.dueDate).isAfter(now) &&
        dayjs(loan.dueDate).diff(now, "day") < 3
    );
    const overdue = loans.filter(
      (loan) => loan.status !== "Paid" && dayjs(loan.dueDate).isBefore(now)
    );

    const notes = [];
    if (upcoming.length)
      notes.push({
        id: "upcoming",
        message: `${upcoming.length} loan(s) due within 3 days`,
        link: "/loans?filter=upcoming",
      });
    if (overdue.length)
      notes.push({
        id: "overdue",
        message: `${overdue.length} overdue loan(s)`,
        link: "/loans?filter=overdue",
      });

    setNotifications(notes);
  }, [loans]);

  // Handlers
  const handleMenuClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/login"));
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    if (isMobile) {
      setSettingsOpen(true);
    } else if (window.location.pathname !== "/settings") {
      navigate("/settings");
    }
  };

  const handleChangePasswordClick = () => {
    handleMenuClose();
    navigate("/change-password");
  };

  const handleActivityClick = () => {
    handleMenuClose();
    if (window.location.pathname !== "/activity") {
      navigate("/activity");
    }
  };

  const openHelpDialog = () => {
    handleMenuClose();
    setHelpOpen(true);
  };

  const handleNotificationsClick = (e) => {
    setNotificationAnchor(e.currentTarget);
  };
  const closeNotifications = () => setNotificationAnchor(null);
  const closeSettingsDialog = () => setSettingsOpen(false);
  const closeHelpDialog = () => setHelpOpen(false);

  // Search handlers
  const toggleSearch = () => {
    setSearchOpen((open) => !open);
    setSearchTerm("");
  };

  const performSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/loans?search=${encodeURIComponent(searchTerm.trim())}`);
      toggleSearch();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") performSearch();
    if (e.key === "Escape") toggleSearch();
  };

  // Notifications popover item click
  const handleNotificationItemClick = (link) => {
    navigate(link);
    closeNotifications();
  };

  return (
    <>
      <AppBar position="fixed" elevation={1} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: "pointer" }}
            onClick={() => navigate("/dashboard")}
          >
            Loan Manager
          </Typography>

          {/* Search bar toggle */}
          {!searchOpen ? (
            <Tooltip title="Search loans">
              <IconButton color="inherit" onClick={toggleSearch}>
                <SearchIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              autoFocus
              sx={{
                width: isMobile ? "60vw" : 250,
                bgcolor: "background.paper",
                borderRadius: 1,
                mr: 1,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={toggleSearch} size="small">
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotificationsClick} sx={{ position: 'relative' }}>
              <NotificationsIcon
                color={notifications.length > 0 ? "error" : "inherit"}
              />
              {notifications.length > 0 && (
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
                  }}
                />
              )}
            </IconButton>
          </Tooltip>

          {/* Dark Mode Toggle */}
          <Tooltip title={`Switch to ${darkMode ? "light" : "dark"} mode`}>
            <IconButton onClick={onToggleDarkMode} color="inherit" sx={{ ml: 1 }}>
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          {/* Account Menu */}
          <Tooltip title="Account">
            <IconButton onClick={handleMenuClick} size="small" sx={{ ml: 1 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {stringToInitials(user?.displayName || "U")}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Account Menu */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleChangePasswordClick}>
          <ListItemIcon>
            <LockResetIcon fontSize="small" />
          </ListItemIcon>
          Change Password
        </MenuItem>
        <MenuItem onClick={handleActivityClick}>
          <ListItemIcon>
            <History fontSize="small" />
          </ListItemIcon>
          Activity Log
        </MenuItem>
        <MenuItem onClick={openHelpDialog}>
          <ListItemIcon>
            <HelpOutline fontSize="small" />
          </ListItemIcon>
          Help
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Popover */}
      <Popover
        open={openNotifications}
        anchorEl={notificationAnchor}
        onClose={closeNotifications}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { width: 320, maxHeight: "60vh", overflowY: "auto", p: 2 } }}
      >
        <Typography variant="h6" mb={1}>
          Notifications
        </Typography>
        {notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No new notifications.
          </Typography>
        ) : (
          notifications.map(({ id, message, link }) => (
            <MenuItem
              key={id}
              onClick={() => handleNotificationItemClick(link)}
              sx={{ whiteSpace: "normal" }}
            >
              {message}
            </MenuItem>
          ))
        )}
        {notifications.length > 0 && (
          <MenuItem
            onClick={() => {
              navigate("/activity");
              closeNotifications();
            }}
            sx={{ justifyContent: "center", mt: 1 }}
          >
            View all activity
          </MenuItem>
        )}
      </Popover>

      {/* Mobile Settings Dialog */}
      <Dialog
        fullScreen
        open={settingsOpen}
        onClose={closeSettingsDialog}
        TransitionComponent={Transition}
      >
        <SettingsPage onClose={closeSettingsDialog} />
      </Dialog>

      {/* Help Dialog */}
      <HelpDialog open={helpOpen} onClose={closeHelpDialog} />
    </>
  );
};

export default AppBarTop;

