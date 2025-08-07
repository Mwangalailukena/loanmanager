// src/components/AppBarTop.jsx

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
// NEW IMPORT: alpha is needed to create semi-transparent colors from the theme palette
import { alpha } from "@mui/material/styles";
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
  AccountCircle as AccountCircleIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import MenuIcon from "@mui/icons-material/Menu";
import Slide from "@mui/material/Slide";

import { useAuth } from "../contexts/AuthProvider";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

import SettingsPage from "../pages/SettingsPage";
import ChangePassword from "../pages/ChangePassword.jsx";
import HelpDialog from "./HelpDialog";
import Profile from "../pages/Profile";

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

const AppBarTop = ({ onToggleDarkMode, darkMode, onOpenLoanDetail, onSearchChange, onToggleDrawer }) => {
  const { currentUser } = useAuth();
  const { loans } = useFirestore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState([]);

  const [profileOpen, setProfileOpen] = useState(false);

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
    
    upcoming.forEach(loan => {
      notes.push({
        id: loan.id,
        message: `Loan for ${loan.borrower} is due on ${dayjs(loan.dueDate).format("MMM D")}.`,
        loanId: loan.id,
      });
    });

    overdue.forEach(loan => {
      notes.push({
        id: loan.id,
        message: `Loan for ${loan.borrower} is overdue!`,
        loanId: loan.id,
      });
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
    } else {
      if (window.location.pathname !== "/settings") {
        navigate("/settings");
      }
    }
  };

  const handleChangePasswordClick = () => {
    handleMenuClose();
    if (isMobile) {
      setChangePasswordOpen(true);
    } else {
      if (window.location.pathname !== "/change-password") {
        navigate("/change-password");
      }
    }
  };

  const handleProfileClick = () => {
    handleMenuClose();
    if (isMobile) {
      setProfileOpen(true);
    } else {
      if (window.location.pathname !== "/profile") {
        navigate("/profile");
      }
    }
  };
  const closeProfileDialog = () => setProfileOpen(false);

  const handleActivityClick = () => {
    handleMenuClose();
    if (window.location.pathname !== "/activity") {
      navigate("/activity");
    }
  };

  const handleReportsClick = () => {
    handleMenuClose();
    if (window.location.pathname !== "/reports") {
      navigate("/reports");
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
  const closeChangePasswordDialog = () => setChangePasswordOpen(false);

  const toggleSearch = () => {
    setSearchOpen((open) => !open);
    if (searchOpen) {
      setSearchTerm("");
      onSearchChange("");
    }
  };

  const handleNotificationItemClick = (loanId) => {
    onOpenLoanDetail(loanId);
    closeNotifications();
  };
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(12px) saturate(180%)',
          // UPDATED: Use theme colors with alpha utility
          backgroundColor: alpha(theme.palette.background.paper, 0.1),
          borderBottom: '1px solid ' + alpha(theme.palette.background.paper, 0.2),
          boxShadow: theme.shadows[3],
        }}
      >
        <Toolbar sx={{ px: isMobile ? 2 : 3 }}>
          <IconButton color="inherit" edge="start" onClick={onToggleDrawer} sx={{ mr: 1, color: theme.palette.text.primary }}>
            <MenuIcon />
          </IconButton>

          {!searchOpen && (
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                cursor: "pointer",
                fontWeight: 700,
                color: theme.palette.primary.main,
              }}
              onClick={() => navigate("/dashboard")}
            >
              Loan Manager
            </Typography>
          )}
          
          {searchOpen ? (
            <TextField
              size="small"
              variant="outlined"
              placeholder="Search loans..."
              value={searchTerm}
              onChange={handleSearchChange}
              autoFocus
              sx={{
                flexGrow: 1,
                width: isMobile ? "auto" : 250,
                // UPDATED: Use theme colors with alpha utility
                bgcolor: alpha(theme.palette.background.paper, 0.15),
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
          ) : (
            <Tooltip title="Search loans">
              <IconButton color="inherit" onClick={toggleSearch} sx={{ color: theme.palette.text.secondary }}>
                <SearchIcon />
              </IconButton>
            </Tooltip>
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
                src={currentUser?.photoURL || ''}
              >
                {stringToInitials(currentUser?.displayName || "U")}
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
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            Profile
          </Typography>
        </MenuItem>

        <MenuItem onClick={handleReportsClick}>
          <ListItemIcon>
            <AssessmentIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            Reports
          </Typography>
        </MenuItem>

        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            App Settings
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
          notifications.map(({ id, message, loanId }) => (
            <MenuItem
              key={id}
              onClick={() => handleNotificationItemClick(loanId)}
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

      {/* Dialogs (Settings, Change Password, Help, Profile) */}
      <Dialog
        open={settingsOpen}
        onClose={closeSettingsDialog}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}
      >
        <SettingsPage onClose={closeSettingsDialog} />
      </Dialog>

      <Dialog
        open={changePasswordOpen}
        onClose={closeChangePasswordDialog}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}
      >
        <ChangePassword onClose={closeChangePasswordDialog} />
      </Dialog>

      <HelpDialog open={helpOpen} onClose={closeHelpDialog} sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }} />

      <Dialog
        open={profileOpen}
        onClose={closeProfileDialog}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}
      >
        <Profile onClose={closeProfileDialog} />
      </Dialog>
    </>
  );
};

export default AppBarTop;
