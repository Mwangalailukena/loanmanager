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
import SettingsPage from "../pages/SettingsPage"; // Assuming SettingsPage takes an onClose prop
import HelpDialog from "./HelpDialog"; // Assuming HelpDialog takes open and onClose props
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
        dayjs(loan.dueDate).diff(now, "day") < 3 &&
        dayjs(loan.dueDate).diff(now, 'day') >= 0 // Ensure it's not overdue but within 3 days
    );
    const overdue = loans.filter(
      (loan) => loan.status !== "Paid" && dayjs(loan.dueDate).isBefore(now, 'day')
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
      <AppBar
        position="fixed"
        elevation={0} // Reduced elevation for a softer look
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: theme.palette.background.paper, // Use paper background for consistency
          borderBottom: `1px solid ${theme.palette.divider}`, // Subtle bottom border
        }}
      >
        <Toolbar sx={{ px: isMobile ? 2 : 3 }}> {/* Adjusted horizontal padding */}
          {isMobile && (
            <IconButton color="inherit" edge="start" sx={{ mr: 1, color: theme.palette.text.primary }}> {/* Inherit color for menu icon */}
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              cursor: "pointer",
              fontWeight: 600, // Make title bolder
              color: theme.palette.text.primary, // Ensure title color is consistent
            }}
            onClick={() => navigate("/dashboard")}
          >
            Loan Manager
          </Typography>

          {/* Search bar toggle */}
          {!searchOpen ? (
            <Tooltip title="Search loans">
              <IconButton color="inherit" onClick={toggleSearch} sx={{ color: theme.palette.text.secondary }}> {/* Inherit color for search icon */}
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
                bgcolor: theme.palette.action.hover, // A slightly different background for the search bar
                borderRadius: 2, // Rounded corners for search
                mr: 1,
                "& .MuiOutlinedInput-root": {
                  paddingRight: theme.spacing(1), // Adjust padding
                  borderRadius: 2, // Ensure inner input is also rounded
                  "& fieldset": { borderColor: "transparent !important" }, // Hide default border
                },
                "& input": {
                  color: theme.palette.text.primary, // Ensure text is readable
                },
                "& ::placeholder": {
                  color: theme.palette.text.secondary, // Placeholder color
                  opacity: 1, // Ensure placeholder is visible
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={toggleSearch} size="small" sx={{ color: theme.palette.text.secondary }}>
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotificationsClick} sx={{ position: 'relative', color: theme.palette.text.secondary }}>
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
            <IconButton onClick={onToggleDarkMode} color="inherit" sx={{ ml: 1, color: theme.palette.text.secondary }}>
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          {/* Account Menu */}
          <Tooltip title="Account">
            <IconButton onClick={handleMenuClick} size="small" sx={{ ml: 1 }}>
              <Avatar sx={{
                width: 36, // Slightly larger avatar
                height: 36,
                bgcolor: theme.palette.primary.main, // Consistent primary color
                color: theme.palette.primary.contrastText, // Text color for contrast
                fontSize: '0.875rem', // Adjust font size
                fontWeight: 600, // Make initials bolder
              }}>
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
        PaperProps={{
          elevation: 4, // More pronounced shadow for menus
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            borderRadius: 2, // Rounded menu corners
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">Settings</Typography>
        </MenuItem>
        <MenuItem onClick={handleChangePasswordClick}>
          <ListItemIcon>
            <LockResetIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">Change Password</Typography>
        </MenuItem>
        <MenuItem onClick={handleActivityClick}>
          <ListItemIcon>
            <History fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">Activity Log</Typography>
        </MenuItem>
        <MenuItem onClick={openHelpDialog}>
          <ListItemIcon>
            <HelpOutline fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">Help</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <Typography variant="body2" color="error">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Notifications Popover */}
      <Popover
        open={openNotifications}
        anchorEl={notificationAnchor}
        onClose={closeNotifications}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
            sx: {
                width: 320,
                maxHeight: "60vh",
                overflowY: "auto",
                p: 2,
                borderRadius: 2, // Rounded popover corners
                boxShadow: theme.shadows[4], // Consistent shadow
            }
        }}
      >
        <Typography variant="h6" mb={1} sx={{ fontWeight: 600 }}>
          Notifications
        </Typography>
        {notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
            No new notifications.
          </Typography>
        ) : (
          notifications.map(({ id, message, link }) => (
            <MenuItem
              key={id}
              onClick={() => handleNotificationItemClick(link)}
              sx={{ whiteSpace: "normal", borderRadius: 1, mb: 0.5, '&:last-child': { mb: 0 } }} // Rounded and spaced menu items
            >
              <Typography variant="body2" color="text.primary">{message}</Typography>
            </MenuItem>
          ))
        )}
        {notifications.length > 0 && (
          <MenuItem
            onClick={() => {
              navigate("/activity");
              closeNotifications();
            }}
            sx={{ justifyContent: "center", mt: 1, bgcolor: theme.palette.action.hover, borderRadius: 1 }} // Style "View all" button
          >
            <Typography variant="body2" color="text.secondary">View all activity</Typography>
          </MenuItem>
        )}
      </Popover>

      {/* Mobile Settings Dialog */}
      <Dialog
        fullScreen
        open={settingsOpen}
        onClose={closeSettingsDialog}
        TransitionComponent={Transition}
        // Since it's fullScreen, border radius on the dialog paper itself
        // is less noticeable, but any content inside SettingsPage should adopt rounding.
      >
        <SettingsPage onClose={closeSettingsDialog} />
      </Dialog>

      {/* Help Dialog */}
      <HelpDialog
        open={helpOpen}
        onClose={closeHelpDialog}
        sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }} // Apply border radius to the help dialog
      />
    </>
  );
};

export default AppBarTop;
