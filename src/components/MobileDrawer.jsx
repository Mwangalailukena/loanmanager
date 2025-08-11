import React, { useState } from 'react';
import {
  SwipeableDrawer, // Use SwipeableDrawer
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout,
  Settings as SettingsIcon,
  LockReset as LockResetIcon,
  Notifications as NotificationsIcon,
  HelpOutline,
  AccountCircle as AccountCircleIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  ListAlt as ListAltIcon,
  AttachMoney as AttachMoneyIcon,
  History as HistoryIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthProvider';

import ChangePassword from "../pages/ChangePassword.jsx";
import HelpDialog from "./HelpDialog";
import Profile from "../pages/Profile";
import SettingsPage from "../pages/SettingsPage";

const MobileDrawer = ({ open, onClose, onOpen, darkMode, onToggleDarkMode }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser } = useAuth();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
  };

  const handleProfileClick = () => setProfileOpen(true);
  const handleSettingsClick = () => setSettingsOpen(true);
  const handleChangePasswordClick = () => setChangePasswordOpen(true);
  const openHelpDialog = () => setHelpOpen(true);
  
  const closeAllDialogs = () => {
    setProfileOpen(false);
    setSettingsOpen(false);
    setChangePasswordOpen(false);
    setHelpOpen(false);
  };
  
  const drawerItems = [
    { text: 'Profile', icon: <AccountCircleIcon />, onClick: handleProfileClick },
    { text: 'Interest Rate/ Capital', icon: <SettingsIcon />, onClick: handleSettingsClick },
    { text: 'Change Password', icon: <LockResetIcon />, onClick: handleChangePasswordClick },
    { text: 'Help', icon: <HelpOutline />, onClick: openHelpDialog },
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
            />
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
          {drawerItems.map((item, index) => (
            <ListItem key={item.text} disablePadding onClick={item.onClick}>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider />
          <ListItem disablePadding onClick={handleLogout}>
            <ListItemButton>
              <ListItemIcon><Logout color="error" /></ListItemIcon>
              <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </SwipeableDrawer>
      
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
