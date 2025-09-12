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
  Popover,
  Fade,
  Button,
  CircularProgress,
  Collapse,
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
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthProvider';
import { useFirestore } from '../contexts/FirestoreProvider';
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

const MobileDrawer = ({ open, onClose, onOpen, darkMode, onToggleDarkMode, onOpenLoanDetail, onSearchOpen }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { loans, loadingLoans } = useFirestore();

  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [generalOpen, setGeneralOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("readNotifications");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [allNotifications, setAllNotifications] = useState([]);

  const openNotifications = Boolean(notificationAnchor);

  useEffect(() => {
    if (!loans) return;
    const now = dayjs();
    const notes = [];
    loans.forEach(loan => {
      const borrowerName = loan.borrower?.name || 'a borrower';
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
    const allIds = allNotifications.map(n => n.id);
    setReadNotifications(allIds);
    localStorage.setItem("readNotifications", JSON.stringify(allIds));
  };

  const generalItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Borrowers', icon: <PeopleIcon />, path: '/borrowers' },
    { text: 'Loans', icon: <AttachMoneyIcon />, path: '/loans' },
    { text: 'Add Loan', icon: <AddIcon />, path: '/add-loan' },
    { text: 'Expenses', icon: <ReceiptIcon />, path: '/expenses' },
    { text: 'Activity', icon: <HistoryIcon />, path: '/activity' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Notifications', icon: <NotificationsIcon />, onClick: (e) => setNotificationAnchor(e.currentTarget) },
    { text: 'Search', icon: <SearchIcon />, onClick: () => { onClose(); onSearchOpen(); } },
  ];

  const accountItems = [
    { text: 'Profile', icon: <AccountCircleIcon />, onClick: () => { onClose(); setProfileOpen(true); } },
    { text: 'Interest Rate/ Capital', icon: <SettingsIcon />, onClick: () => { onClose(); setSettingsOpen(true); } },
    { text: 'Change Password', icon: <LockResetIcon />, onClick: () => { onClose(); setChangePasswordOpen(true); } },
    { text: 'Help', icon: <HelpOutline />, onClick: () => { onClose(); setHelpOpen(true); } },
    { text: darkMode ? 'Light Mode' : 'Dark Mode', icon: darkMode ? <LightModeIcon /> : <DarkModeIcon />, onClick: onToggleDarkMode },
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
            width: 260,
            backgroundColor: alpha(theme.palette.background.default, 0.9),
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        <Divider />

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <List>
            <ListItemButton onClick={() => setGeneralOpen(!generalOpen)}>
              <ListItemText primary="General" sx={{ pl: 1, '& .MuiTypography-root': { fontWeight: 'bold', color: 'text.secondary' } }} />
              <motion.div animate={{ rotate: generalOpen ? 180 : 0 }}><ExpandMore /></motion.div>
            </ListItemButton>
            <Collapse in={generalOpen} timeout="auto" unmountOnExit>
              <motion.div initial="hidden" animate="visible" variants={listVariants}>
                <List component="div" disablePadding>
                  {generalItems.map((item) => (
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
                          {item.text === "Notifications" && unreadNotifications.length > 0 && (
                            <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "error.main", animation: `${pulse} 1.5s infinite`, }} />
                          )}
                        </ListItemButton>
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              </motion.div>
            </Collapse>
          </List>
          <Divider />

          <List>
            <ListItemButton onClick={() => setAccountOpen(!accountOpen)}>
              <ListItemText primary="Account" sx={{ pl: 1, '& .MuiTypography-root': { fontWeight: 'bold', color: 'text.secondary' } }} />
              <motion.div animate={{ rotate: accountOpen ? 180 : 0 }}><ExpandMore /></motion.div>
            </ListItemButton>
            <Collapse in={accountOpen} timeout="auto" unmountOnExit>
              <motion.div initial="hidden" animate="visible" variants={listVariants}>
                <List component="div" disablePadding>
                  {accountItems.map((item) => (
                    <motion.div variants={itemVariants} key={item.text}>
                      <ListItem disablePadding onClick={() => { item.onClick(); onClose(); }}>
                        <ListItemButton sx={listItemSx}>
                          <ListItemIcon>{item.icon}</ListItemIcon>
                          <ListItemText primary={item.text} />
                        </ListItemButton>
                      </ListItem>
                    </motion.div>
                  ))}
                </List>
              </motion.div>
            </Collapse>
          </List>
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

      <Popover open={openNotifications} anchorEl={notificationAnchor} onClose={closeAllDialogs} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} TransitionComponent={Fade} PaperProps={{ sx: { width: 320, p: 2, borderRadius: 2, boxShadow: theme.shadows[4], }, }} >
        <Typography variant="h6" sx={{ pb: 1 }}>Notifications</Typography>
        {loadingLoans ? (<Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>
        ) : unreadNotifications.length === 0 ? (<Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>No new notifications.</Typography>
        ) : (unreadNotifications.map(({ id, message, loanId }) => (<MenuItem key={id} onClick={() => handleNotificationItemClick(id, loanId)}><Typography variant="body2" component="span">{message}</Typography></MenuItem>))
        )}
        {unreadNotifications.length > 0 && <Button onClick={handleMarkAllAsRead} color="primary" sx={{ textTransform: 'none', mt: 1, width: '100%' }}>Mark all as read</Button>}
      </Popover>
      <Dialog open={profileOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth><Profile onClose={closeAllDialogs} /></Dialog>
      <Dialog open={settingsOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth><SettingsPage onClose={closeAllDialogs} /></Dialog>
      <Dialog open={changePasswordOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth><ChangePassword onClose={closeAllDialogs} /></Dialog>
      <Dialog open={helpOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth><HelpDialog open={helpOpen} onClose={closeAllDialogs} /></Dialog>
    </>
  );
};

export default MobileDrawer;
