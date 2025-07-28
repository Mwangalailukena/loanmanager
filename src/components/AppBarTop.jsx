import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography, // Make sure Typography is imported
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

  useEffect(() => {
    if (!loans) return;
    const now = dayjs();
    const upcoming = loans.filter(
      (loan) =>
        loan.status !== "Paid" &&
        dayjs(loan.dueDate).isAfter(now) &&
        dayjs(loan.dueDate).diff(now, "day") < 3 &&
        dayjs(loan.dueDate).diff(now, "day") >= 0
    );
    const overdue = loans.filter(
      (loan) => loan.status !== "Paid" && dayjs(loan.dueDate).isBefore(now, "day")
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

  const handleNotificationItemClick = (link) => {
    navigate(link);
    closeNotifications();
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ px: isMobile ? 2 : 3 }}>
          {isMobile && (
            <IconButton color="inherit" edge="start" sx={{ mr: 1, color: theme.palette.text.primary }}>
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              cursor: "pointer",
              // --- CHANGES START HERE ---
              fontWeight: 700, // Make it bold
              color: theme.palette.primary.main, // Use the primary color from your theme (which is typically blue)
              // --- CHANGES END HERE ---
            }}
            onClick={() => navigate("/dashboard")}
          >
            Loan Manager
          </Typography>

          {!searchOpen ? (
            <Tooltip title="Search loans">
              <IconButton color="inherit" onClick={toggleSearch} sx={{ color: theme.palette.text.secondary }}>
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
                bgcolor: theme.palette.action.hover,
                borderRadius: 2,
                mr: 1,
                "& .MuiOutlinedInput-root": {
                  paddingRight: theme.spacing(1),
                  borderRadius: 2,
                  "& fieldset": { borderColor: "transparent !important" },
                },
                "& input": {
                  color: theme.palette.text.primary,
                },
                "& ::placeholder": {
                  color: theme.palette.text.secondary,
                  opacity: 1,
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

          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={handleNotificationsClick}
              sx={{ position: "relative", color: theme.palette.text.secondary }}
            >
              <NotificationsIcon color={notifications.length > 0 ? "error" : "inherit"} />
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

          <Tooltip title={`Switch to ${darkMode ? "light" : "dark"} mode`}>
            <IconButton onClick={onToggleDarkMode} color="inherit" sx={{ ml: 1, color: theme.palette.text.secondary }}>
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Account">
            <IconButton onClick={handleMenuClick} size="small" sx={{ ml: 1 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                {stringToInitials(user?.displayName || "U")}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 4,
          sx: {
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            borderRadius: 2,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&::before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
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
          <Typography variant="body2" color="text.primary">
            Settings
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleChangePasswordClick}>
          <ListItemIcon>
            <LockResetIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            Change Password
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleActivityClick}>
          <ListItemIcon>
            <History fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            Activity Log
          </Typography>
        </MenuItem>
        <MenuItem onClick={openHelpDialog}>
          <ListItemIcon>
            <HelpOutline fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            Help
          </Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <Typography variant="body2" color="error">
            Logout
          </Typography>
        </MenuItem>
      </Menu>

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
            borderRadius: 2,
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <Typography variant="h6" mb={1} sx={{ fontWeight: 600 }}>
          Notifications
        </Typography>
        {notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: "center" }}>
            No new notifications.
          </Typography>
        ) : (
          notifications.map(({ id, message, link }) => (
            <MenuItem
              key={id}
              onClick={() => handleNotificationItemClick(link)}
              sx={{ whiteSpace: "normal", borderRadius: 1, mb: 0.5, "&:last-child": { mb: 0 } }}
            >
              <Typography variant="body2" color="text.primary">
                {message}
              </Typography>
            </MenuItem>
          ))
        )}
        {notifications.length > 0 && (
          <MenuItem
            onClick={() => {
              navigate("/activity");
              closeNotifications();
            }}
            sx={{ justifyContent: "center", mt: 1, bgcolor: theme.palette.action.hover, borderRadius: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              View all activity
            </Typography>
          </MenuItem>
        )}
      </Popover>

      <Dialog
        fullScreen
        open={settingsOpen}
        onClose={closeSettingsDialog}
        TransitionComponent={Transition}
      >
        <SettingsPage onClose={closeSettingsDialog} />
      </Dialog>

      <HelpDialog open={helpOpen} onClose={closeHelpDialog} sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }} />
    </>
  );
};

export default AppBarTop;
