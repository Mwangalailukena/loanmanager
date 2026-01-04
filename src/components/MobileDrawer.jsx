import { useState } from 'react';
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
  useTheme,
  Dialog,
  ListSubheader,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  Logout,
  Settings as SettingsIcon,
  LockReset as LockResetIcon,
  HelpOutline,
  AccountCircle as AccountCircleIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Close as CloseIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon,
  AttachMoney as AttachMoneyIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthProvider';
import ChangePassword from "../pages/ChangePassword.jsx";
import HelpDialog from "./HelpDialog";
import Profile from "../pages/Profile";
import SettingsPage from "../pages/SettingsPage";

// --- Animation Variants for Framer Motion ---

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};



function stringToInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

const MobileDrawer = ({ open, onClose, onOpen, darkMode, onToggleDarkMode }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();
  const { currentUser } = useAuth();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
  };

  const closeAllDialogs = () => {
    setProfileOpen(false);
    setSettingsOpen(false);
    setChangePasswordOpen(false);
    setHelpOpen(false);
  };


  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Borrowers', icon: <PeopleIcon />, path: '/borrowers' },
    { text: 'Loans', icon: <AttachMoneyIcon />, path: '/loans' },
    { text: 'Expenses', icon: <ReceiptIcon />, path: '/expenses' },
    { text: 'Add Loan', icon: <AddIcon />, path: '/add-loan', isPrimary: true }, // Example of a primary action
  ];

  const analyticsItems = [
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Activity', icon: <HistoryIcon />, path: '/activity' },
    { text: 'Simulator', icon: <CalculateIcon />, path: '/simulator' },
  ];

  const accountItems = [
    { text: 'Profile', icon: <AccountCircleIcon />, onClick: () => { onClose(); setProfileOpen(true); } },
    { text: 'Settings', icon: <SettingsIcon />, onClick: () => { onClose(); setSettingsOpen(true); } },
    { text: 'Change Password', icon: <LockResetIcon />, onClick: () => { onClose(); setChangePasswordOpen(true); } },
    { text: 'Help', icon: <HelpOutline />, onClick: () => { onClose(); setHelpOpen(true); } },
  ];

  const listItemSx = {
    borderRadius: theme.shape.borderRadius,
    mx: 1, my: 0.5,
    transition: theme.transitions.create(['background-color', 'color', 'padding-left']),
    '& .MuiListItemIcon-root': { transition: theme.transitions.create(['transform']), },
    '&:hover': { '& .MuiListItemIcon-root': { transform: 'scale(1.1)', }, },
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
      color: theme.palette.primary.main,
      paddingLeft: '13px',
      borderLeft: `3px solid ${theme.palette.primary.main}`,
      '& .MuiListItemIcon-root': { color: theme.palette.primary.main, },
    },
    '&.Mui-selected:hover': { backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity), }
  };

  return (
    <>
      <SwipeableDrawer
        anchor="left" open={open} onClose={onClose} onOpen={onOpen}
        disableSwipeToOpen={false} ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 260, // Keep fixed width for consistency
            backgroundColor: alpha(theme.palette.background.paper, 0.95), // Slightly more opaque
            backdropFilter: 'blur(12px)', // Slightly more blur
            borderRadius: '0 16px 16px 0', // Rounded corners on the right side
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.2)}`, // Subtle border
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <Avatar sx={{ width: 40, height: 40, mr: 2, flexShrink: 0 }} src={currentUser?.photoURL || ''}>
              {stringToInitials(currentUser?.displayName || "U")}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" noWrap>{currentUser?.displayName || "User"}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>{currentUser?.email || ""}</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} aria-label="Close drawer"><CloseIcon /></IconButton>
                </Box>
                <Divider />

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <List component="nav" subheader={<ListSubheader>Main</ListSubheader>}>
            {menuItems.map(item => (
              <motion.div variants={itemVariants} key={item.text}>
                <ListItem
                  disablePadding
                  onClick={() => {
                    if (item.path) navigate(item.path);
                    onClose();
                  }}
                >
                  <ListItemButton selected={item.path === pathname} sx={listItemSx}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              </motion.div>
            ))}
          </List>
          <Divider />
          <List component="nav" subheader={<ListSubheader>Analytics</ListSubheader>}>
            {analyticsItems.map(item => (
              <motion.div variants={itemVariants} key={item.text}>
                <ListItem
                  disablePadding
                  onClick={() => {
                    if (item.path) navigate(item.path);
                    onClose();
                  }}
                >
                  <ListItemButton selected={item.path === pathname} sx={listItemSx}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              </motion.div>
            ))}
          </List>
          <Divider />
          <List component="nav" subheader={<ListSubheader>Account</ListSubheader>}>
            {accountItems.map(item => (
              <motion.div variants={itemVariants} key={item.text}>
                <ListItem
                  disablePadding
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    // Don't close drawer for theme toggle, it's instant
                    if (item.text !== 'Light Mode' && item.text !== 'Dark Mode') {
                      onClose();
                    }
                  }}
                >
                  <ListItemButton selected={item.path === pathname} sx={listItemSx}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              </motion.div>
            ))}
          </List>
        </Box>

        <Box sx={{ mt: 'auto', p: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
          <IconButton onClick={onToggleDarkMode} color="inherit" aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            {darkMode ? (
              <LightModeIcon sx={{ color: theme.palette.primary.main }} />
            ) : (
              <DarkModeIcon sx={{ color: theme.palette.text.primary }} />
            )}
          </IconButton>
          <IconButton onClick={handleLogout} color="inherit" aria-label="Logout">
            <Logout color="error" />
          </IconButton>
        </Box>
      </SwipeableDrawer>

      <Dialog open={profileOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth><Profile onClose={closeAllDialogs} /></Dialog>
      <Dialog open={settingsOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth><SettingsPage onClose={closeAllDialogs} /></Dialog>
      <Dialog open={changePasswordOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth><ChangePassword onClose={closeAllDialogs} /></Dialog>
      <Dialog open={helpOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth><HelpDialog open={helpOpen} onClose={closeAllDialogs} /></Dialog>
    </>
  );
};

export default MobileDrawer;