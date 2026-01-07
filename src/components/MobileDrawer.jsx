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
  
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
  };

  const closeAllDialogs = () => {
    setSettingsOpen(false);
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
    { text: 'Settings', icon: <SettingsIcon />, onClick: () => { onClose(); setSettingsOpen(true); } },
  ];

  const listItemSx = {
    borderRadius: theme.shape.borderRadius,
    mx: 1, my: 0.8, // Increased vertical margin
    py: 0.5, // Added vertical padding
    transition: theme.transitions.create(['background-color', 'color', 'padding-left']),
    '& .MuiListItemIcon-root': { transition: theme.transitions.create(['transform']), },
    '&:hover': { '& .MuiListItemIcon-root': { transform: 'scale(1.1)', }, },
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity - 0.04), // Subtler background
      color: theme.palette.primary.main,
      paddingLeft: '16px', // Adjusted padding after removing border
      // Removed borderLeft
      '& .MuiListItemIcon-root': { color: theme.palette.primary.main, },
    },
    '&.Mui-selected:hover': { backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity - 0.04), }
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
            backgroundColor: alpha(theme.palette.background.paper, 0.9), // Increased opacity
            backdropFilter: 'blur(16px)', // Increased blur
            borderRadius: '0 16px 16px 0', // Rounded corners on the right side
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`, // Subtler border
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ px: 2, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, py: 1 }}>
            <Avatar sx={{ width: 48, height: 48, mr: 2, flexShrink: 0 }} src={currentUser?.photoURL || ''}>
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

        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1, py: 1 }}>
          <List component="nav" subheader={<ListSubheader sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.8rem' }}>Main</ListSubheader>}>
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
          <List component="nav" subheader={<ListSubheader sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.8rem' }}>Analytics</ListSubheader>}>
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
          <List component="nav" subheader={<ListSubheader sx={{ fontWeight: 'bold', color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.8rem' }}>Account</ListSubheader>}>
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

        <Box sx={{ mt: 'auto', p: 2, display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
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

      <Dialog open={settingsOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth><SettingsPage onClose={closeAllDialogs} /></Dialog>
    </>
  );
};

export default MobileDrawer;