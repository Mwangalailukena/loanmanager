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
  MenuItem,
  useTheme,
  Dialog,
  Button,
  CircularProgress,
  Collapse,
  TextField,
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
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
  Dashboard as DashboardIcon,
  AttachMoney as AttachMoneyIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  ExpandMore,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthProvider';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useSearch } from '../contexts/SearchContext';
import dayjs from 'dayjs';

import ChangePassword from "../pages/ChangePassword.jsx";
import HelpDialog from "./HelpDialog";
import Profile from "../pages/Profile";
import SettingsPage from "../pages/SettingsPage";

// --- Animation Variants for Framer Motion ---
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Creates the cascade effect
    },
  },
};

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

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

function stringToInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

const MobileDrawer = ({ open, onClose, onOpen, darkMode, onToggleDarkMode, searchTerm, handleSearchChange }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { loans, borrowers, loadingLoans } = useFirestore();
  const { openLoanDetail } = useSearch();

  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false); // Declare notificationsOpen state
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("readNotifications");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [allNotifications, setAllNotifications] = useState([]);

  useEffect(() => {
    if (!loans || !borrowers) return;
    const now = dayjs();
    const notes = [];
    loans.forEach(loan => {
      const borrower = borrowers.find(b => b.id === loan.borrowerId);
      const borrowerName = borrower ? borrower.name : 'a borrower';
      if ((loan.repaidAmount || 0) >= (loan.totalRepayable || 0)) return;
      const dueDate = dayjs(loan.dueDate);
      const diffInDays = dueDate.diff(now, "day");
      if (diffInDays < 3 && diffInDays >= 0) {
        notes.push({ id: `${loan.id}-upcoming`, message: `Loan for ${borrowerName} is due on ${dueDate.format("MMM D")}.`, loanId: loan.id });
      } else if (dueDate.isBefore(now, "day")) {
        notes.push({ id: `${loan.id}-overdue`, message: `Loan for ${borrowerName} is overdue!`, loanId: loan.id });
      }
    });
    setAllNotifications(notes);
  }, [loans, borrowers]);

  const unreadNotifications = allNotifications.filter((note) => !readNotifications.includes(note.id));

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
  };

  const closeAllDialogs = () => {
    setProfileOpen(false);
    setSettingsOpen(false);
    setChangePasswordOpen(false);
    setHelpOpen(false);
  };

  const handleNotificationItemClick = (notificationId, loanId) => {
    openLoanDetail(loanId);
    setReadNotifications((prev) => [...prev, notificationId]);
  };

  const handleMarkAllAsRead = () => {
    const allIds = allNotifications.map(n => n.id);
    setReadNotifications(allIds);
    localStorage.setItem("readNotifications", JSON.stringify(allIds));
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', section: 'general' },
    { text: 'Borrowers', icon: <PeopleIcon />, path: '/borrowers', section: 'general' },
    { text: 'Add Loan', icon: <AddIcon />, path: '/add-loan', section: 'general' }, // Elevated Add Loan
    { text: 'Add Payment', icon: <AttachMoneyIcon />, path: '/add-payment', section: 'general' }, // Added Add Payment
    {
      text: 'Loan Management',
      icon: <AttachMoneyIcon />,
      section: 'general',
      children: [
        { text: 'Loans', icon: <AttachMoneyIcon />, path: '/loans' },
      ],
    },
    { text: 'Expenses', icon: <ReceiptIcon />, path: '/expenses', section: 'general' },
    {
      text: 'Analytics & Reporting',
      icon: <AssessmentIcon />,
      section: 'general',
      children: [
        { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
        { text: 'Activity', icon: <HistoryIcon />, path: '/activity' },
        { text: 'Simulator', icon: <CalculateIcon />, path: '/simulator' },
      ],
    },
    {
      text: 'Notifications',
      icon: <NotificationsIcon />,
      section: 'general',
      isNotifications: true, // Custom flag to identify notification item
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      section: 'account',
      children: [
        { text: 'Profile', icon: <AccountCircleIcon />, onClick: () => { onClose(); setProfileOpen(true); } },
        { text: 'Interest Rate/Capital', icon: <SettingsIcon />, onClick: () => { onClose(); setSettingsOpen(true); } },
        { text: 'Change Password', icon: <LockResetIcon />, onClick: () => { onClose(); setChangePasswordOpen(true); } },
        { text: 'Help', icon: <HelpOutline />, onClick: () => { onClose(); setHelpOpen(true); } },
        { text: darkMode ? 'Light Mode' : 'Dark Mode', icon: darkMode ? <LightModeIcon /> : <DarkModeIcon />, onClick: onToggleDarkMode },
      ],
    },
  ];

  // State to manage collapse for nested menus
  const [openSections, setOpenSections] = useState({
    'general': true,
    'Loan Management': false,
    'Analytics & Reporting': false,
    'account': true,
    'Settings': false,
  });

  const handleToggleSection = (sectionName) => {
    setOpenSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

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
            width: 260,
            backgroundColor: alpha(theme.palette.background.default, 0.9),
            backdropFilter: 'blur(8px)',
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
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ px: 2, pb: 2 }}>
            <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="Search loans..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                    ),
                    endAdornment: searchTerm && (
                        <IconButton
                            size="small"
                            onClick={() => handleSearchChange('')}
                            sx={{ visibility: searchTerm ? 'visible' : 'hidden' }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    ),
                }}
            />
        </Box>
        <Divider />

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            {menuItems.map((item, index) => (
                <List key={item.text}>
                    {item.section && index > 0 && item.section !== menuItems[index - 1].section && <Divider />} {/* Add divider between sections */}
                    
                    {item.children ? (
                        <>
                            <ListItemButton onClick={() => handleToggleSection(item.text)}>
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                                <motion.div animate={{ rotate: openSections[item.text] ? 180 : 0 }}><ExpandMore /></motion.div>
                            </ListItemButton>
                            <Collapse in={openSections[item.text]} timeout="auto" unmountOnExit>
                                <motion.div initial="hidden" animate="visible" variants={listVariants}>
                                    <List component="div" disablePadding>
                                        {item.children.map(child => (
                                            <motion.div variants={itemVariants} key={child.text}>
                                                <ListItem
                                                    disablePadding
                                                    onClick={(e) => {
                                                        if (child.path) { navigate(child.path); }
                                                        else if (child.onClick) { child.onClick(e); }
                                                        onClose();
                                                    }}
                                                >
                                                    <ListItemButton selected={child.path === pathname} sx={{ ...listItemSx, pl: 4 }}>
                                                        <ListItemIcon>{child.icon}</ListItemIcon>
                                                        <ListItemText primary={child.text} />
                                                    </ListItemButton>
                                                </ListItem>
                                            </motion.div>
                                        ))}
                                    </List>
                                </motion.div>
                            </Collapse>
                        </>
                    ) : item.isNotifications ? (
                        <>
                            <ListItemButton onClick={() => setNotificationsOpen(!notificationsOpen)}>
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                                {unreadNotifications.length > 0 && (
                                    <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "error.main", animation: `${pulse} 1.5s infinite`, }} />
                                )}
                                <motion.div animate={{ rotate: notificationsOpen ? 180 : 0 }}><ExpandMore /></motion.div>
                            </ListItemButton>
                            <Collapse in={notificationsOpen} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 2 }}>
                                    {loadingLoans ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>
                                    ) : unreadNotifications.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">No new notifications.</Typography>
                                    ) : (
                                        unreadNotifications.map(({ id, message, loanId }) => (
                                            <MenuItem key={id} onClick={() => handleNotificationItemClick(id, loanId)}>
                                                <Typography variant="body2" component="span">{message}</Typography>
                                            </MenuItem>
                                        ))
                                    )}
                                    {unreadNotifications.length > 0 && <Button onClick={handleMarkAllAsRead} color="primary" sx={{ textTransform: 'none', mt: 1, width: '100%' }}>Mark all as read</Button>}
                                </Box>
                            </Collapse>
                        </>
                    ) : (
                        <motion.div variants={itemVariants} key={item.text}>
                            <ListItem
                                disablePadding
                                onClick={(e) => {
                                    if (item.path) { navigate(item.path); }
                                    else if (item.onClick) { item.onClick(e); }
                                    onClose();
                                }}
                            >
                                <ListItemButton selected={item.path === pathname} sx={listItemSx}>
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        </motion.div>
                    )}
                </List>
            ))}
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Divider />
          <ListItem disablePadding onClick={handleLogout}>
            <ListItemButton sx={listItemSx}>
              <ListItemIcon><Logout color="error" /></ListItemIcon>
              <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
            </ListItemButton>
          </ListItem>
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