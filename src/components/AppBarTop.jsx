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
  const { user } = useAuth();
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
  //const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [dateTime, setDateTime] = useState(dayjs());

  const userRole = user?.displayName || user?.email?.split("@")[0] || "Agent";

  useEffect(() => {
    const interval = setInterval(() => setDateTime(dayjs()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loans) return;
    const now = new Date();
    const upcoming = loans.filter(
      (l) =>
        l.status === "Active" &&
        new Date(l.dueDate) >= now &&
        new Date(l.dueDate) <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    );
    const overdue = loans.filter(
      (l) => l.status === "Active" && new Date(l.dueDate) < now
    );
    const notes = [];
    if (upcoming.length) {
      notes.push({
        id: "upcoming",
        message: `${upcoming.length} loan(s) due within 3 days`,
      });
    }
    if (overdue.length) {
      notes.push({
        id: "overdue",
        message: `${overdue.length} overdue loan(s)`,
      });
    }
    setNotifications(notes);
  }, [loans]);

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
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
  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
    setSearchTerm("");
  };
  const performSearch = () => {
    navigate(`/loans?search=${encodeURIComponent(searchTerm.trim())}`);
    toggleSearch();
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") performSearch();
    if (e.key === "Escape") toggleSearch();
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
              }}
              InputProps={{
                endAdornment: (
                  <IconButton size="small" onClick={toggleSearch}>
                    <CloseIcon />
                  </IconButton>
                ),
              }}
            />
          )}

          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Help & Support">
            <IconButton onClick={handleHelpClick} color="inherit">
              <PhoneIcon />
            </IconButton>
          </Tooltip>

          <Typography
            variant="body2"
            sx={{ ml: 2, mr: 1, display: { xs: "none", sm: "block" }, fontWeight: "600" }}
          >
            Agent: {userRole}
          </Typography>

          <Tooltip title="Menu">
            <IconButton onClick={handleMenuClick} color="inherit">
              <BuildIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            PaperProps={{ sx: { mt: 1.5 } }}
          >
            <MenuItem disabled>{user?.displayName || user?.email}</MenuItem>
            <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
            <MenuItem onClick={() => navigate("/profile")}>Profile</MenuItem>
            <MenuItem onClick={() => navigate("/change-password")}>Change Password</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Settings Dialog */}
      <Dialog fullScreen open={settingsOpen} onClose={closeSettingsDialog}>
        <SettingsPage />
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

