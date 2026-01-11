import React, { useState } from 'react';
import {
  Drawer,
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
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  LogoutRounded as Logout,
  SettingsRounded as SettingsIcon,
  LightModeRounded as LightModeIcon,
  DarkModeRounded as DarkModeIcon,
  CloseRounded as CloseIcon,
  AssessmentRounded as AssessmentIcon,
  HistoryRounded as HistoryIcon,
  DashboardRounded as DashboardIcon,
  PriceCheckRounded as AttachMoneyIcon,
  PaymentsRounded as AddIcon,
  PeopleRounded as PeopleIcon,
  ReceiptRounded as ReceiptIcon,
  CalculateRounded as CalculateIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  ChevronRightRounded as ChevronRightIcon,
  PersonAddRounded as PersonAddIcon,
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

const MobileDrawer = ({ 
  open, 
  onClose, 
  onOpen, 
  darkMode, 
  onToggleDarkMode, 
  variant = "temporary", 
  sx = {},
  mini = false,
  onToggleMini,
  onOpenAddLoan,
  onOpenAddPayment,
  onOpenAddBorrower
}) => {
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
    { text: 'Add Loan', icon: <AddIcon />, onClick: onOpenAddLoan, isPrimary: true },
    { text: 'Add Borrower', icon: <PersonAddIcon />, onClick: onOpenAddBorrower },
    { text: 'Add Payment', icon: <AttachMoneyIcon />, onClick: onOpenAddPayment },
  ];

  const analyticsItems = [
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Activity', icon: <HistoryIcon />, path: '/activity' },
    { text: 'Simulator', icon: <CalculateIcon />, path: '/simulator' },
  ];

  const accountItems = [
    { text: 'Settings', icon: <SettingsIcon />, onClick: () => { onClose(); setSettingsOpen(true); } },
  ];

  const drawerWidth = mini ? 72 : 240;

  const listItemSx = {
    borderRadius: theme.shape.borderRadius,
    mx: 0.5, my: 0.4,
    py: 0.5,
    justifyContent: mini ? 'center' : 'initial',
    transition: theme.transitions.create(['background-color', 'color', 'padding-left', 'justify-content']),
    '& .MuiListItemIcon-root': { 
      transition: theme.transitions.create(['transform']),
      minWidth: mini ? 0 : 32,
      mr: mini ? 0 : 1.5,
      justifyContent: 'center',
    },
    '&:hover': { '& .MuiListItemIcon-root': { transform: 'scale(1.1)', }, },
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity - 0.04),
      color: theme.palette.primary.main,
      '& .MuiListItemIcon-root': { color: theme.palette.primary.main, },
    },
  };

    return (
      <>
      <Drawer
        anchor="left" 
        open={open} 
        onClose={onClose}
        variant={variant}
        sx={{
          ...sx,
          width: variant === 'permanent' ? drawerWidth : 0,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            borderRadius: variant === 'permanent' ? 0 : '0 12px 12px 0',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Box sx={{ 
          px: mini ? 1 : 2, 
          py: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: mini ? 'center' : 'space-between',
          minHeight: 64 
        }}>
          {!mini && (
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, py: 0.5 }}>
              <Avatar sx={{ width: 32, height: 32, mr: 1.5, flexShrink: 0 }} src={currentUser?.photoURL || ''}>
                {stringToInitials(currentUser?.displayName || "U")}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap fontWeight="bold">{currentUser?.displayName || "User"}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontSize: '0.6rem' }}>{currentUser?.email || ""}</Typography>
              </Box>
            </Box>
          )}
          
          {variant === 'permanent' ? (
            <IconButton size="small" onClick={onToggleMini}>
              {mini ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          ) : (
            <IconButton size="small" onClick={onClose} aria-label="Close drawer"><CloseIcon fontSize="small" /></IconButton>
          )}
        </Box>
        <Divider sx={{ opacity: 0.5 }} />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', px: 0.5, py: 1 }}>
          <List component="nav" subheader={!mini && <ListSubheader sx={{ fontWeight: 800, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.65rem', lineHeight: '24px', bgcolor: 'transparent' }}>Main</ListSubheader>}>
            {menuItems.map(item => (
              <motion.div variants={itemVariants} key={item.text}>
                <Tooltip title={mini ? item.text : ""} placement="right">
                  <ListItem disablePadding onClick={() => { if (item.onClick) item.onClick(); else if (item.path) navigate(item.path); if (variant !== 'permanent') onClose(); }}>
                    <ListItemButton selected={item.path === pathname} sx={listItemSx}>
                      <ListItemIcon>{React.cloneElement(item.icon, { sx: { fontSize: '1.2rem' } })}</ListItemIcon>
                      {!mini && <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: item.path === pathname ? 700 : 500 }} />}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              </motion.div>
            ))}
          </List>
          
          {!mini && <Box sx={{ my: 1 }}><Divider sx={{ opacity: 0.3 }} /></Box>}
          
          <List component="nav" subheader={!mini && <ListSubheader sx={{ fontWeight: 800, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.65rem', lineHeight: '24px', bgcolor: 'transparent' }}>Analytics</ListSubheader>}>
            {analyticsItems.map(item => (
              <motion.div variants={itemVariants} key={item.text}>
                <Tooltip title={mini ? item.text : ""} placement="right">
                  <ListItem disablePadding onClick={() => { if (item.onClick) item.onClick(); else if (item.path) navigate(item.path); if (variant !== 'permanent') onClose(); }}>
                    <ListItemButton selected={item.path === pathname} sx={listItemSx}>
                      <ListItemIcon>{React.cloneElement(item.icon, { sx: { fontSize: '1.2rem' } })}</ListItemIcon>
                      {!mini && <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: item.path === pathname ? 700 : 500 }} />}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              </motion.div>
            ))}
          </List>

          {!mini && <Box sx={{ my: 1 }}><Divider sx={{ opacity: 0.3 }} /></Box>}

          <List component="nav" subheader={!mini && <ListSubheader sx={{ fontWeight: 800, color: theme.palette.text.secondary, textTransform: 'uppercase', fontSize: '0.65rem', lineHeight: '24px', bgcolor: 'transparent' }}>Account</ListSubheader>}>
            {accountItems.map(item => (
              <motion.div variants={itemVariants} key={item.text}>
                <Tooltip title={mini ? item.text : ""} placement="right">
                  <ListItem disablePadding onClick={() => { if (item.onClick) item.onClick(); else if (item.path) navigate(item.path); if (variant !== 'permanent') onClose(); }}>
                    <ListItemButton sx={listItemSx}>
                      <ListItemIcon>{React.cloneElement(item.icon, { sx: { fontSize: '1.2rem' } })}</ListItemIcon>
                      {!mini && <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              </motion.div>
            ))}
          </List>
        </Box>

        <Box sx={{ 
          mt: 'auto', 
          p: 1.5, 
          display: 'flex', 
          flexDirection: mini ? 'column' : 'row', 
          gap: mini ? 1 : 0,
          justifyContent: 'space-around', 
          alignItems: 'center', 
          borderTop: `1px solid ${theme.palette.divider}` 
        }}>
          <Tooltip title={mini ? (darkMode ? "Light Mode" : "Dark Mode") : ""} placement="right">
            <IconButton size="small" onClick={onToggleDarkMode} color="inherit">
              {darkMode ? <LightModeIcon fontSize="small" sx={{ color: theme.palette.primary.main }} /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={mini ? "Logout" : ""} placement="right">
            <IconButton size="small" onClick={handleLogout} color="inherit">
              <Logout fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </Box>
      </Drawer>

      <Dialog open={settingsOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth><SettingsPage onClose={closeAllDialogs} /></Dialog>
    </>
  );
};

export default React.memo(MobileDrawer);