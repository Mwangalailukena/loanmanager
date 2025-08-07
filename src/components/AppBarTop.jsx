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
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
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
  const [allNotifications, setAllNotifications] = useState([]);
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("readNotifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [allNotificationsDialogOpen, setAllNotificationsDialogOpen] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);

  const openMenu = Boolean(anchorEl);
  const openNotifications = Boolean(notificationAnchor);

  useEffect(() => {
    if (!loans) return;
    const now = dayjs();
    const notes = [];
    
    loans.forEach(loan => {
      if (loan.status === "Paid") return;

      const dueDate = dayjs(loan.dueDate);
      const diffInDays = dueDate.diff(now, "day");

      if (diffInDays < 3 && diffInDays >= 0) {
        notes.push({
          id: `${loan.id}-upcoming`,
          message: `Loan for ${loan.borrower} is due on ${dueDate.format("MMM D")}.`,
          loanId: loan.id,
          isOverdue: false,
        });
      } else if (dueDate.isBefore(now, "day")) {
        notes.push({
          id: `${loan.id}-overdue`,
          message: `Loan for ${loan.borrower} is overdue!`,
          loanId: loan.id,
          isOverdue: true,
        });
      }
    });

    setAllNotifications(notes);
  }, [loans]);

  const unreadNotifications = allNotifications.filter(
    (note) => !readNotifications.includes(note.id)
  );

  useEffect(() => {
    localStorage.setItem("readNotifications", JSON.stringify(readNotifications));
  }, [readNotifications]);


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
  const openAllNotificationsDialog = () => {
    closeNotifications();
    setAllNotificationsDialogOpen(true);
  };
  const closeAllNotificationsDialog = () => {
    setAllNotificationsDialogOpen(false);
  };
  const handleMarkAllAsRead = () => {
    const allIds = allNotifications.map(note => note.id);
    setReadNotifications(allIds);
  };

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

  const handleNotificationItemClick = (notificationId, loanId) => {
    onOpenLoanDetail(loanId);
    setReadNotifications((prev) => [...prev, notificationId]);
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
              <NotificationsIcon color={unreadNotifications.length > 0 ? "error" : "inherit"} />
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
            backdropFilter: 'blur(12px) saturate(180%)',
            backgroundColor: alpha(theme.palette.background.paper, 0.1),
            border: '1px solid ' + alpha(theme.palette.divider, 0.2),
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
              bgcolor: alpha(theme.palette.background.paper, 0.1),
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem 
          onClick={handleProfileClick}
          sx={{
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            Profile
          </Typography>
        </MenuItem>

        <MenuItem 
          onClick={handleReportsClick}
          sx={{
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <ListItemIcon>
            <AssessmentIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            Reports
          </Typography>
        </MenuItem>

        <MenuItem 
          onClick={handleSettingsClick}
          sx={{
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            App Settings
          </Typography>
        </MenuItem>
        <MenuItem 
          onClick={handleChangePasswordClick}
          sx={{
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <ListItemIcon>
            <LockResetIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            Change Password
          </Typography>
        </MenuItem>
        <MenuItem 
          onClick={handleActivityClick}
          sx={{
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <ListItemIcon>
            <History fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            Activity Log
          </Typography>
        </MenuItem>
        <MenuItem 
          onClick={openHelpDialog}
          sx={{
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <ListItemIcon>
            <HelpOutline fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          </ListItemIcon>
          <Typography variant="body2" color="text.primary">
            Help
          </Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5, bgcolor: alpha(theme.palette.divider, 0.4) }} />
        <MenuItem 
          onClick={handleLogout}
          sx={{
            "&:hover": {
              backgroundColor: alpha(theme.palette.error.main, 0.1),
            },
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <Typography variant="body2" color="error">
            Logout
          </Typography>
        </MenuItem>
      </Menu>

      {/* Unread Notifications Popover (for quick access) */}
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
            backdropFilter: 'blur(12px) saturate(180%)',
            backgroundColor: alpha(theme.palette.background.paper, 0.1),
            border: '1px solid ' + alpha(theme.palette.divider, 0.2),
          },
        }}
      >
        <Typography variant="h6" mb={1} sx={{ fontWeight: 600 }}>
          Notifications
        </Typography>
        {unreadNotifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: "center" }}>
            No new notifications.
          </Typography>
        ) : (
          unreadNotifications.map(({ id, message, loanId }) => (
            <MenuItem
              key={id}
              onClick={() => {
                handleNotificationItemClick(id, loanId);
                closeNotifications();
              }}
              sx={{ whiteSpace: "normal", borderRadius: 1, mb: 0.5, "&:last-child": { mb: 0 } }}
            >
              <Typography variant="body2" color="text.primary">
                {message}
              </Typography>
            </MenuItem>
          ))
        )}
        {allNotifications.length > 0 && (
          <MenuItem
            onClick={openAllNotificationsDialog}
            sx={{ justifyContent: "center", mt: 1, bgcolor: theme.palette.action.hover, borderRadius: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              View all notifications
            </Typography>
          </MenuItem>
        )}
      </Popover>

      {/* Dialog to show all notifications */}
      <Dialog
        open={allNotificationsDialogOpen}
        onClose={closeAllNotificationsDialog}
        TransitionComponent={Transition}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            mx: 2,
            p: 2,
            backdropFilter: 'blur(12px) saturate(180%)',
            backgroundColor: alpha(theme.palette.background.paper, 0.85),
            border: '1px solid ' + alpha(theme.palette.divider, 0.2),
            boxShadow: theme.shadows[12],
          }
        }}
      >
        <DialogTitle sx={{ p: 0, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>All Notifications</Typography>
          <IconButton onClick={closeAllNotificationsDialog}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, m: 0 }}>
          {allNotifications.length === 0 ? (
            <Box sx={{ py: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No notifications to display.
              </Typography>
            </Box>
          ) : (
            allNotifications.map(({ id, message, loanId, isOverdue }) => (
              <MenuItem
                key={id}
                onClick={() => {
                  handleNotificationItemClick(id, loanId);
                  closeAllNotificationsDialog();
                }}
                sx={{
                  whiteSpace: "normal",
                  borderRadius: 1,
                  mb: 1,
                  py: 1.5,
                  bgcolor: readNotifications.includes(id) ? 'transparent' : alpha(theme.palette.primary.main, 0.1),
                  "&:hover": {
                    bgcolor: readNotifications.includes(id) ? theme.palette.action.hover : alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <NotificationsIcon 
                    fontSize="small" 
                    color={isOverdue ? "error" : "primary"} 
                    sx={{ mr: 2, opacity: readNotifications.includes(id) ? 0.5 : 1 }} 
                  />
                  <Typography variant="body2" color="text.primary" sx={{ flexGrow: 1, opacity: readNotifications.includes(id) ? 0.5 : 1 }}>
                    {message}
                  </Typography>
                  {!readNotifications.includes(id) && (
                    <Box
                      component="span"
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "error.main",
                        ml: 2,
                        flexShrink: 0
                      }}
                    />
                  )}
                </Box>
              </MenuItem>
            ))
          )}
        </DialogContent>
        {allNotifications.length > 0 && (
          <DialogActions sx={{ p: 0, pt: 2, justifyContent: 'center' }}>
            <Button onClick={handleMarkAllAsRead} color="primary" sx={{ textTransform: 'none' }}>
              Mark all as read
            </Button>
          </DialogActions>
        )}
      </Dialog>


      {/* Other Dialogs */}
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
