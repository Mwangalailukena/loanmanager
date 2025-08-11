import React, { useState, useEffect } from 'react';
import {
  SwipeableDrawer,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  Dialog,
  Toolbar,
  Popover,
  Fade,
  Button
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Logout,
  Settings as SettingsIcon,
  LockReset as LockResetIcon,
  Notifications as NotificationsIcon,
  HelpOutline,
  AccountCircle as AccountCircleIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Close as CloseIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthProvider';
import { useFirestore } from '../contexts/FirestoreProvider';
import dayjs from 'dayjs';

import ChangePassword from "../pages/ChangePassword.jsx";
import HelpDialog from "./HelpDialog";
import Profile from "../pages/Profile";
import SettingsPage from "../pages/SettingsPage";

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

function stringToInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const MobileDrawer = ({ open, onClose, onOpen, darkMode, onToggleDarkMode, onOpenLoanDetail, onSearchOpen }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { loans } = useFirestore();

  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("readNotifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [allNotifications, setAllNotifications] = useState([]);

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
        notes.push({ id: `${loan.id}-upcoming`, message: `Loan for ${loan.borrower} is due on ${dueDate.format("MMM D")}.`, loanId: loan.id, isOverdue: false, });
      } else if (dueDate.isBefore(now, "day")) {
        notes.push({ id: `${loan.id}-overdue`, message: `Loan for ${loan.borrower} is overdue!`, loanId: loan.id, isOverdue: true, });
      }
    });
    setAllNotifications(notes);
  }, [loans]);

  const unreadNotifications = allNotifications.filter((note) => !readNotifications.includes(note.id));

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
  };

  const closeAllDialogs = () => {
    setProfileOpen(false);
    setSettingsOpen(false);
    setChangePasswordOpen(false);
    setHelpOpen(false);
    setNotificationAnchor(null);
  };
  
  const handleNotificationItemClick = (notificationId, loanId) => {
    onOpenLoanDetail(loanId);
    setReadNotifications((prev) => [...prev, notificationId]);
  };
  
  const handleMarkAllAsRead = () => {
    setReadNotifications(allNotifications.map(n => n.id));
    localStorage.setItem("readNotifications", JSON.stringify(allNotifications.map(n => n.id)));
  };

  const generalItems = [
    { text: 'Search', icon: <SearchIcon />, onClick: () => { onClose(); onSearchOpen(); } },
    { text: 'Notifications', icon: <NotificationsIcon />, onClick: (e) => setNotificationAnchor(e.currentTarget) },
    { text: 'Reports', icon: <AssessmentIcon />, onClick: () => { onClose(); navigate('/reports'); } },
    { text: 'Activity', icon: <HistoryIcon />, onClick: () => { onClose(); navigate('/activity'); } },
  ];

  const accountItems = [
    { text: 'Profile', icon: <AccountCircleIcon />, onClick: () => { onClose(); setProfileOpen(true); } },
    { text: 'Interest Rate/ Capital', icon: <SettingsIcon />, onClick: () => { onClose(); setSettingsOpen(true); } },
    { text: 'Change Password', icon: <LockResetIcon />, onClick: () => { onClose(); setChangePasswordOpen(true); } },
    { text: 'Help', icon: <HelpOutline />, onClick: () => { onClose(); setHelpOpen(true); } },
    { 
      text: darkMode ? 'Light Mode' : 'Dark Mode', 
      icon: darkMode ? <LightModeIcon /> : <DarkModeIcon />, 
      onClick: onToggleDarkMode 
    },
  ];

  return (
    <>
      <SwipeableDrawer
        anchor="left"
        open={open}
        onClose={onClose}
        onOpen={onOpen}
        disableSwipeToOpen={false}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 260,
            bgcolor: theme.palette.background.default,
          },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{ width: 40, height: 40, mr: 2 }}
              src={currentUser?.photoURL || ''}
            >
              {stringToInitials(currentUser?.displayName || "U")}
            </Avatar>
            <Typography variant="h6">
              Menu
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List>
          {generalItems.map((item) => (
            <ListItem key={item.text} disablePadding onClick={item.onClick}>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {item.text === "Notifications" && unreadNotifications.length > 0 && (
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "error.main",
                      animation: `${pulse} 1.5s infinite`,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {accountItems.map((item) => (
            <ListItem key={item.text} disablePadding onClick={item.onClick}>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <ListItem disablePadding onClick={handleLogout}>
          <ListItemButton>
            <ListItemIcon><Logout color="error" /></ListItemIcon>
            <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
          </ListItemButton>
        </ListItem>
      </SwipeableDrawer>
      
      {/* Notifications Popover */}
      <Popover
        open={openNotifications}
        anchorEl={notificationAnchor}
        onClose={closeAllDialogs}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            width: 320,
            p: 2,
            borderRadius: 2,
            boxShadow: theme.shadows[4],
            backdropFilter: 'blur(12px) saturate(180%)',
            backgroundColor: alpha(theme.palette.background.paper, 0.1),
            border: '1px solid ' + alpha(theme.palette.divider, 0.2),
          },
        }}
      >
        <Typography variant="h6">Notifications</Typography>
        {unreadNotifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No new notifications.</Typography>
        ) : (
          unreadNotifications.map(({ id, message, loanId }) => (
            <MenuItem key={id} onClick={() => handleNotificationItemClick(id, loanId)}>
              <Typography variant="body2">{message}</Typography>
            </MenuItem>
          ))
        )}
        <Button onClick={handleMarkAllAsRead} color="primary" sx={{ textTransform: 'none', mt: 2, width: '100%' }}>
            Mark all as read
        </Button>
      </Popover>
      
      <Dialog
        open={profileOpen}
        onClose={closeAllDialogs}
        maxWidth="sm"
        fullWidth
      >
        <Profile onClose={closeAllDialogs} />
      </Dialog>
      <Dialog
        open={settingsOpen}
        onClose={closeAllDialogs}
        maxWidth="sm"
        fullWidth
      >
        <SettingsPage onClose={closeAllDialogs} />
      </Dialog>
      <Dialog
        open={changePasswordOpen}
        onClose={closeAllDialogs}
        maxWidth="sm"
        fullWidth
      >
        <ChangePassword onClose={closeAllDialogs} />
      </Dialog>
      <Dialog
        open={helpOpen}
        onClose={closeAllDialogs}
        maxWidth="sm"
        fullWidth
      >
        <HelpDialog open={helpOpen} onClose={closeAllDialogs} />
      </Dialog>
    </>
  );
};

export default MobileDrawer;
