import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import Popover from "@mui/material/Popover";
import Fade from "@mui/material/Fade";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import { alpha, keyframes } from "@mui/material/styles";
import Logout from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HistoryIcon from "@mui/icons-material/History";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CalculateIcon from "@mui/icons-material/Calculate";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SnoozeIcon from "@mui/icons-material/Snooze";
import PaymentsIcon from "@mui/icons-material/Payments";
import WarningIcon from "@mui/icons-material/WarningAmber";
import ErrorIcon from "@mui/icons-material/ErrorOutline";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthProvider";
import { useSearch } from "../contexts/SearchContext";
import { useNotifications } from "../hooks/useNotifications";
import { generateWhatsAppLink } from "../utils/whatsapp";
import { deleteTokenFromFirestore } from "../utils/push";
import { motion, AnimatePresence } from "framer-motion";

import SettingsPage from "../pages/SettingsPage";
import SearchResults from "./SearchResults";

function stringToInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.4); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(211, 47, 47, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
`;

const FloatingNavBar = ({ darkMode, onToggleDarkMode, onOpenAddLoan, onOpenAddPayment, onOpenAddBorrower, onOpenLoanSimulator }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { currentUser } = useAuth();

  const {
    unreadNotifications,
    markAsRead,
    markAllAsRead,
    snoozeNotification,
  } = useNotifications();

  // Consume search context
  const {
    searchTerm,
    handleSearchChange,
    openLoanDetail,
  } = useSearch();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef();

  const openMenu = Boolean(anchorEl);
  const openNotifications = Boolean(notificationAnchor);

  useEffect(() => {
    setBarVisible(true);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100); 
    }
  }, [isSearchOpen]);

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
  };

  const navItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Borrowers", icon: <PeopleIcon />, path: "/borrowers" },
    { text: "Loans", icon: <ListAltIcon />, path: "/loans" },
    { text: "Expenses", icon: <ReceiptIcon />, path: "/expenses" },
    { text: "Reports", icon: <AssessmentIcon />, path: "/reports" },
    { text: "Activity", icon: <HistoryIcon />, path: "/activity" },
  ];

  const handleLogout = async () => {
    try {
      await deleteTokenFromFirestore();
    } catch (err) {
      console.warn("Non-critical: FCM token cleanup failed", err);
    }
    signOut(auth).then(() => navigate("/login"));
  };
  const handleSettingsClick = () => setSettingsOpen(true);
  const handleLoanSimulatorClick = () => {
    onOpenLoanSimulator();
    setAnchorEl(null);
  }
  const closeNotifications = () => setNotificationAnchor(null);
  const closeAllDialogs = () => {
    setSettingsOpen(false);
  };
  const handleNotificationItemClick = (notificationId, loanId) => {
    openLoanDetail(loanId);
    markAsRead(notificationId);
  };

  const hasCritical = unreadNotifications.some(n => n.type === 'overdue' || n.type === 'urgent');

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: 24,
          right: 24,
          left: "auto",
          p: 0.5,
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          width: "fit-content",
          maxWidth: "90%",
          borderRadius: 20, 
          backdropFilter: "blur(18px) saturate(180%)", 
          backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.5 : 0.7), 
          border: "1px solid " + (theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.03)), 
          boxShadow: theme.palette.mode === 'dark' 
            ? "0 6px 24px rgba(0, 0, 0, 0.3)" 
            : "0 6px 24px rgba(0, 0, 0, 0.03)", 
          zIndex: theme.zIndex.appBar + 1,
          transform: barVisible ? "translateY(0)" : "translateY(-100px)",
          opacity: barVisible ? 1 : 0,
          transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out",
        }}
      >
        {/* Navigation Links */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 0.5,
            borderRadius: 12,
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Button
                key={item.text}
                onClick={item.onClick ? item.onClick : () => navigate(item.path)}
                sx={{
                  textTransform: "none",
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  borderRadius: 10,
                  px: 2.5, 
                  py: 1.2, 
                  fontWeight: 600,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                  },
                  ...(isActive && {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }),
                }}
              >
                {item.text}
              </Button>
            );
          })}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
          {/* Search Button */}
          <IconButton onClick={toggleSearch} sx={{ mx: 0.5, borderRadius: "50%", p: 1, transition: "all 0.2s ease-in-out", "&:hover": { transform: "scale(1.1)" } }}>
            {isSearchOpen ? <CloseIcon sx={{ color: theme.palette.text.secondary }} /> : <SearchIcon sx={{ color: theme.palette.text.secondary }} />}          </IconButton>
          {/* Search Field (if open) */}
          <TextField
            inputRef={searchInputRef}
            size="small"
            variant="outlined"
            placeholder="Search loans..."
            onChange={(e) => handleSearchChange(e.target.value)} 
            value={searchTerm} 
            autoFocus
            aria-label="Search loans, borrowers, and payments"
            sx={{
              ml: 1,
              width: isSearchOpen ? 200 : 0, 
              opacity: isSearchOpen ? 1 : 0, 
              transition: "width 0.3s ease-in-out, opacity 0.3s ease-in-out",
              overflow: "hidden",
            }}
          />

          {/* Notifications Button */}
          <Tooltip title="Notifications">
            <IconButton 
              onClick={(e) => setNotificationAnchor(e.currentTarget)} 
              sx={{ 
                mx: 0.5, 
                borderRadius: "50%", 
                p: 1, 
                position: "relative", 
                transition: "all 0.2s ease-in-out", 
                "&:hover": { transform: "scale(1.1)" },
                ...(hasCritical && {
                  animation: `${pulse} 2s infinite ease-in-out`
                })
              }}
            >
              <Badge badgeContent={unreadNotifications.length} color="error">
                <NotificationsIcon sx={{ color: theme.palette.text.secondary }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Settings/Account Button */}
          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ mx: 0.5, borderRadius: "50%", p: 1, transition: "all 0.2s ease-in-out", "&:hover": { transform: "scale(1.1)" } }}>
              <Avatar
                sx={{ width: 24, height: 24, fontSize: "0.75rem", bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
                src={currentUser?.photoURL || ''}
                imgProps={{ referrerPolicy: "no-referrer" }}
              >
                {stringToInitials(currentUser?.displayName || "U")}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <SearchResults
        variant="popover"
        anchorEl={isSearchOpen ? searchInputRef.current : null}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Account Menu */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={() => setAnchorEl(null)}
        TransitionComponent={Fade}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1.5,
            borderRadius: 4, 
            backdropFilter: 'blur(18px) saturate(180%)', 
            backgroundColor: alpha(theme.palette.background.paper, 0.9), 
            border: '1px solid ' + alpha(theme.palette.divider, 0.1),
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)', 
            minWidth: 200,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Typography variant="subtitle1" sx={{ px: 2, pt: 1, fontWeight: 'bold' }}>
            {currentUser?.displayName || "User"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
            {currentUser?.email}
        </Typography>
        <Divider sx={{ my: 0.5 }} />
        
        <MenuItem onClick={handleSettingsClick} sx={{ mx: 1, borderRadius: 1.5, my: 0.7, py: 0.8 }}>
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            Settings
        </MenuItem>

        <MenuItem onClick={handleLoanSimulatorClick} sx={{ mx: 1, borderRadius: 1.5, my: 0.7, py: 0.8 }}>
            <ListItemIcon><CalculateIcon fontSize="small" /></ListItemIcon>
            Simulator
        </MenuItem>
        
        <MenuItem onClick={onToggleDarkMode} sx={{ mx: 1, borderRadius: 1.5, my: 0.7, py: 0.8 }}>
          <ListItemIcon>
            {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </ListItemIcon>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </MenuItem>

        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleLogout} sx={{ mx: 1, borderRadius: 1.5, my: 0.7, py: 0.8 }}><ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>Logout</MenuItem>
      </Menu>
      
      {/* Notifications Popover */}
      <Popover
        open={openNotifications}
        anchorEl={notificationAnchor}
        onClose={closeNotifications}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            p: 0,
            borderRadius: 4, 
            backdropFilter: 'blur(18px) saturate(180%)', 
            backgroundColor: alpha(theme.palette.background.paper, 0.95), 
            border: '1px solid ' + alpha(theme.palette.divider, 0.1),
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>Alert Center</Typography>
          {unreadNotifications.length > 0 && (
            <Chip 
              label={`${unreadNotifications.length} New`} 
              color="error" 
              size="small" 
              sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} 
            />
          )}
        </Box>

        <Box sx={{ overflowY: 'auto', flexGrow: 1, p: 1 }}>
          <AnimatePresence initial={false}>
            {unreadNotifications.length === 0 ? (
              <Box 
                component={motion.div}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}
              >
                <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
                <Typography variant="body2" color="text.secondary">All caught up!</Typography>
              </Box>
            ) : (
              unreadNotifications.map((note) => (
                <MenuItem 
                  key={note.id} 
                  component={motion.div}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => handleNotificationItemClick(note.id, note.loanId)} 
                  sx={{ 
                    borderRadius: 3, 
                    mb: 1, 
                    p: 1.5,
                    whiteSpace: 'normal', 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1,
                    borderLeft: `4px solid ${note.severity === 'error' ? theme.palette.error.main : theme.palette.warning.main}`,
                    bgcolor: (theme) => alpha(note.severity === 'error' ? theme.palette.error.main : theme.palette.warning.main, 0.04),
                    '&:hover': {
                      bgcolor: (theme) => alpha(note.severity === 'error' ? theme.palette.error.main : theme.palette.warning.main, 0.08),
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', width: '100%', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: alpha(note.severity === 'error' ? theme.palette.error.main : theme.palette.warning.main, 0.1), color: note.severity === 'error' ? 'error.main' : 'warning.main', width: 32, height: 32 }}>
                      {note.type === 'overdue' ? <ErrorIcon fontSize="small" /> : <WarningIcon fontSize="small" />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>
                          {note.borrowerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {note.fullDate.fromNow()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5, color: 'text.primary' }}>
                        {note.message}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, width: '100%', mt: 0.5 }}>
                    <Tooltip title="Message on WhatsApp">
                      <IconButton 
                        size="small" 
                        sx={{ bgcolor: alpha('#25D366', 0.1), color: '#25D366', '&:hover': { bgcolor: alpha('#25D366', 0.2) } }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(generateWhatsAppLink(note.borrowerPhone, `Hi ${note.borrowerName}, just a reminder about your loan payment of ZMW ${note.amount.toLocaleString()} due on ${note.fullDate.format('MMM DD')}.`), '_blank');
                        }}
                      >
                        <WhatsAppIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Snooze 24h">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          snoozeNotification(note.loanId);
                        }}
                      >
                        <SnoozeIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Button 
                      size="small" 
                      startIcon={<PaymentsIcon sx={{ fontSize: 14 }} />}
                      sx={{ ml: 'auto', textTransform: 'none', fontSize: '0.7rem', fontWeight: 700, borderRadius: 1.5 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openLoanDetail(note.loanId);
                        markAsRead(note.id);
                      }}
                    >
                      Process Payment
                    </Button>
                  </Box>
                </MenuItem>
              ))
            )}
          </AnimatePresence>
        </Box>

        {unreadNotifications.length > 0 && (
          <Box sx={{ p: 1.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', gap: 1 }}>
            <Button 
              fullWidth 
              size="small"
              variant="contained" 
              onClick={markAllAsRead}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none' }}
            >
              Mark all as read
            </Button>
          </Box>
        )}
      </Popover>

      <Dialog
        open={settingsOpen}
        onClose={closeAllDialogs}
        maxWidth="sm"
        fullWidth
      >
        <SettingsPage onClose={closeAllDialogs} />
      </Dialog>
    </>
  );
};

export default React.memo(FloatingNavBar);