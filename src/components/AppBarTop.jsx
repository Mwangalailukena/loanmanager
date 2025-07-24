// src/components/AppBarTop.jsx
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Box,
  Dialog,
  useMediaQuery,
  useTheme,
  TextField,
  Badge,
  Button,
  Popover,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import BuildIcon from "@mui/icons-material/Build";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import SettingsPage from "../pages/SettingsPage";
import { useFirestore } from "../contexts/FirestoreProvider";
import dayjs from "dayjs";

export default function AppBarTop() {
  const { user } = useAuth(); // 'user' directly contains displayName from Firebase Auth
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { loans } = useFirestore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const openNotifications = Boolean(notificationAnchor);
  const notificationsId = openNotifications ? "notifications-popover" : undefined;

  const [dateTime, setDateTime] = useState(dayjs());

  // --- MODIFIED LINE HERE ---
  const userDisplayLabel = user?.displayName || user?.email?.split("@")[0] || "User"; // Changed "Agent" to "User"
  // --- END MODIFIED LINE ---


  // Update date and time every minute
  useEffect(() => {
    const interval = setInterval(() => setDateTime(dayjs()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Generate notifications based on loan data
  useEffect(() => {
    if (!loans) return;
    const now = dayjs();
    const notes = [];

    const upcoming = loans.filter(
      (l) =>
        l.status !== "Paid" &&
        dayjs(l.dueDate).isAfter(now, "day") &&
        dayjs(l.dueDate).diff(now, "day") < 3
    );

    const overdue = loans.filter(
      (l) => l.status !== "Paid" && dayjs(l.dueDate).isBefore(now, "day")
    );

    if (upcoming.length > 0) {
      notes.push({
        id: "upcoming",
        message: `${upcoming.length} loan(s) due within 3 days`,
      });
    }
    if (overdue.length > 0) {
      notes.push({
        id: "overdue",
        message: `${overdue.length} overdue loan(s)`,
      });
    }
    setNotifications(notes);
  }, [loans]);

  // Handlers for menu and dialogs
  const handleLogout = async () => {
    handleMenuClose();
    try {
      await signOut(auth);
      navigate("/login");
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
      console.error("Logout error:", error);
    }
  };

  const handleMenuClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleSettingsClick = () => {
    handleMenuClose();
    isMobile ? setSettingsOpen(true) : navigate("/settings");
  };
  const closeSettingsDialog = () => setSettingsOpen(false);

  const handleHelpClick = () => setHelpOpen(true);
  const handleHelpClose = () => setHelpOpen(false);

  // Search bar functionality
  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
    setSearchTerm("");
  };
  const performSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/loans?search=${encodeURIComponent(searchTerm.trim())}`);
      toggleSearch();
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") performSearch();
    if (e.key === "Escape") toggleSearch();
  };

  // Notification Popover handlers
  const handleNotificationsClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };
  const handleNotificationsClose = () => {
    setNotificationAnchor(null);
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="primary"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ flexWrap: "wrap", gap: 1 }}>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: "pointer", fontSize: { xs: "1rem", sm: "1.25rem" } }}
            onClick={() => navigate("/dashboard")}
          >
            Loan Manager
          </Typography>

          <Typography
            variant="body2"
            sx={{ display: { xs: "none", sm: "block" }, mr: 2, fontFamily: "monospace" }}
          >
            {dateTime.format("ddd, MMM D, YYYY h:mm A")}
          </Typography>

          {/* Search Button / TextField */}
          {!searchOpen ? (
            <Tooltip title="Search">
              <IconButton color="inherit" onClick={toggleSearch}>
                <SearchIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <TextField
              autoFocus
              size="small"
              variant="outlined"
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{
                width: isMobile ? "65vw" : 250,
                mr: 1,
                bgcolor: "background.paper",
                borderRadius: 1,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "transparent",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "transparent",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "transparent",
                },
              }}
              InputProps={{
                endAdornment: (
                  <IconButton size="small" onClick={toggleSearch} sx={{ color: "text.secondary" }}>
                    <CloseIcon />
                  </IconButton>
                ),
              }}
            />
          )}

          {/* Notifications Icon with Badge */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              aria-describedby={notificationsId}
              onClick={handleNotificationsClick}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Help & Support Icon */}
          <Tooltip title="Help & Support">
            <IconButton onClick={handleHelpClick} color="inherit">
              <PhoneIcon />
            </IconButton>
          </Tooltip>

          {/* User Role Display - UPDATED TO REFLECT userDisplayLabel */}
          <Typography
            variant="body2"
            sx={{ ml: 2, mr: 1, display: { xs: "none", sm: "block" }, fontWeight: "600" }}
          >
            User: {userDisplayLabel} {/* Changed from Agent: {userRole} */}
          </Typography>

          {/* Main Menu Icon */}
          <Tooltip title="Menu">
            <IconButton onClick={handleMenuClick} color="inherit">
              <BuildIcon />
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            PaperProps={{ sx: { mt: 1.5 } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              {user?.displayName || user?.email}
            </MenuItem>
            <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate("/profile"); }}>Profile</MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate("/change-password"); }}>Change Password</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Notifications Popover */}
      <Popover
        id={notificationsId}
        open={openNotifications}
        anchorEl={notificationAnchor}
        onClose={handleNotificationsClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            mt: 1,
            maxHeight: "80vh",
            overflowY: "auto",
            minWidth: 250,
          },
        }}
      >
        <Box p={2}>
          <Typography variant="h6" mb={1}>
            Notifications
          </Typography>
          {notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No new notifications.
            </Typography>
          ) : (
            <>
              {notifications.map((note) => (
                <MenuItem
                  key={note.id}
                  onClick={() => {
                    navigate("/loans");
                    handleNotificationsClose();
                  }}
                  sx={{ whiteSpace: "normal", py: 1 }}
                >
                  <Typography variant="body2">{note.message}</Typography>
                </MenuItem>
              ))}
              <MenuItem
                onClick={() => {
                  navigate("/activity");
                  handleNotificationsClose();
                }}
                sx={{ mt: 1, justifyContent: 'center' }}
              >
                <Typography variant="button" color="primary">View all activity</Typography>
              </MenuItem>
            </>
          )}
        </Box>
      </Popover>

      {/* Settings Dialog (for mobile) */}
      <Dialog fullScreen open={settingsOpen} onClose={closeSettingsDialog}>
        <SettingsPage onClose={closeSettingsDialog} />
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onClose={handleHelpClose} maxWidth="xs" fullWidth>
        <Box p={3}>
          <Typography variant="h6" gutterBottom>
            Help & Support
          </Typography>
          <Typography>
            <strong>Mwangala Ilukena</strong>
          </Typography>
          <Typography>Phone: 0974103004</Typography>
          <Typography>Email: ilukenamwangala@gmail.com</Typography>
          <Box mt={3} textAlign="right">
            <Button onClick={handleHelpClose} variant="contained">
              Close
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
