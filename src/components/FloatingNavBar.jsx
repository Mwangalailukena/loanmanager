import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  IconButton,
  useTheme,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  Avatar,
  TextField,
  Dialog,
  Popover,
  Fade,
} from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import {
  Logout,
  Settings as SettingsIcon,
  LockReset as LockResetIcon,
  Notifications as NotificationsIcon,
  HelpOutline,
  Search as SearchIcon,
  Close as CloseIcon,
  AccountCircle as AccountCircleIcon,
  Assessment as AssessmentIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  ListAlt as ListAltIcon,
  AttachMoney as AttachMoneyIcon,
  History as HistoryIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon, // New: Import ReceiptIcon for Expenses
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthProvider";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useSearch } from "../contexts/SearchContext"; // Add useSearch

import SettingsPage from "../pages/SettingsPage";
import ChangePassword from "../pages/ChangePassword.jsx";
import HelpDialog from "./HelpDialog";
import Profile from "../pages/Profile";
import SearchResults from "./SearchResults";

function stringToInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const FloatingNavBar = ({ darkMode, onToggleDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { loans, borrowers } = useFirestore();

  // Consume search context
  const {
    searchTerm,
    handleSearchChange,
    openLoanDetail,
  } = useSearch();

  const [anchorEl, setAnchorEl] = useState(null);
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loanManagementAnchor, setLoanManagementAnchor] = useState(null);
  const [analyticsReportingAnchor, setAnalyticsReportingAnchor] = useState(null);
  const [accountSettingsAnchor, setAccountSettingsAnchor] = useState(null);
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
      }, 100); // A small delay to ensure the element is in the DOM
    }
  }, [isSearchOpen]);

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
  };

  const navItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Borrowers", icon: <PeopleIcon />, path: "/borrowers" },
    {
      text: "Loan Management",
      icon: <ListAltIcon />,
      children: [
        { text: "Add Loan", icon: <AddIcon />, path: "/add-loan" },
        { text: "Add Payment", icon: <AttachMoneyIcon />, path: "/add-payment" },
        { text: "Loan Records", icon: <ListAltIcon />, path: "/loans" },
        { text: "Expenses", icon: <ReceiptIcon />, path: "/expenses" },
      ],
    },
    {
      text: "Analytics & Reporting",
      icon: <AssessmentIcon />,
      children: [
        { text: "Reports", icon: <AssessmentIcon />, path: "/reports" },
        { text: "Activity", icon: <HistoryIcon />, path: "/activity" },
      ],
    },
  ];

  useEffect(() => {
    if (!loans || !borrowers) return;
    const now = dayjs();
    const notes = [];
    
    loans.forEach(loan => {
      if (loan.status === "Paid") return;

      // Find the borrower for the current loan
      const borrower = borrowers.find(b => b.id === loan.borrowerId);
      const borrowerName = borrower ? borrower.name : "A borrower";

      const dueDate = dayjs(loan.dueDate);
      const diffInDays = dueDate.diff(now, "day");
      if (diffInDays < 3 && diffInDays >= 0) {
        notes.push({ id: `${loan.id}-upcoming`, message: `Loan for ${borrowerName} is due on ${dueDate.format("MMM D")}.`, loanId: loan.id, isOverdue: false, });
      } else if (dueDate.isBefore(now, "day")) {
        notes.push({ id: `${loan.id}-overdue`, message: `Loan for ${borrowerName} is overdue!`, loanId: loan.id, isOverdue: true, });
      }
    });
    setAllNotifications(notes);
  }, [loans, borrowers]);

  const unreadNotifications = allNotifications.filter((note) => !readNotifications.includes(note.id));

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/login"));
  };
  const handleProfileClick = () => setProfileOpen(true);
  const handleSettingsClick = () => setSettingsOpen(true);
  const handleChangePasswordClick = () => setChangePasswordOpen(true);
  const openHelpDialog = () => setHelpOpen(true);
  const closeNotifications = () => setNotificationAnchor(null);
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
    setReadNotifications(allNotifications.map(n => n.id));
    localStorage.setItem("readNotifications", JSON.stringify(allNotifications.map(n => n.id)));
  };

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
          borderRadius: 16,
          backdropFilter: "blur(16px) saturate(180%)",
          backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.6 : 0.8),
          border: "1px solid " + (theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.08) : alpha(theme.palette.common.black, 0.04)),
          boxShadow: theme.palette.mode === 'dark' 
            ? "0 8px 32px rgba(0, 0, 0, 0.4)" 
            : "0 8px 32px rgba(0, 0, 0, 0.05)",
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
            bgcolor: alpha(theme.palette.text.primary, 0.03),
          }}
        >
          {navItems.map((item) => {
            const isActive = item.children 
              ? item.children.some(child => location.pathname.startsWith(child.path))
              : location.pathname.startsWith(item.path);

            return item.children ? (
              <React.Fragment key={item.text}>
                <Button
                  onClick={(e) => {
                    if (item.text === "Loan Management") setLoanManagementAnchor(e.currentTarget);
                    if (item.text === "Analytics & Reporting") setAnalyticsReportingAnchor(e.currentTarget);
                  }}
                  sx={{
                    textTransform: "none",
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    borderRadius: 10,
                    px: 2,
                    py: 1,
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
                <Menu
                  anchorEl={item.text === "Loan Management" ? loanManagementAnchor : analyticsReportingAnchor}
                  open={item.text === "Loan Management" ? Boolean(loanManagementAnchor) : Boolean(analyticsReportingAnchor)}
                  onClose={() => {
                    if (item.text === "Loan Management") setLoanManagementAnchor(null);
                    if (item.text === "Analytics & Reporting") setAnalyticsReportingAnchor(null);
                  }}
                  TransitionComponent={Fade}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      mt: 1.5,
                      borderRadius: 3,
                      backdropFilter: 'blur(16px) saturate(180%)',
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      border: '1px solid ' + alpha(theme.palette.divider, 0.1),
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    },
                  }}
                  transformOrigin={{ horizontal: "left", vertical: "top" }}
                  anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
                >
                  {item.children.map((child) => (
                    <MenuItem
                      key={child.text}
                      onClick={() => {
                        navigate(child.path);
                        if (item.text === "Loan Management") setLoanManagementAnchor(null);
                        if (item.text === "Analytics & Reporting") setAnalyticsReportingAnchor(null);
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mx: 1,
                        my: 0.5,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                      }}
                    >
                      <ListItemIcon sx={{ color: location.pathname === child.path ? 'primary.main' : 'inherit' }}>{child.icon}</ListItemIcon>
                      <Typography variant="body2" sx={{ fontWeight: location.pathname === child.path ? 600 : 400 }}>
                        {child.text}
                      </Typography>
                    </MenuItem>
                  ))}
                </Menu>
              </React.Fragment>
            ) : (
              <Button
                key={item.text}
                onClick={() => navigate(item.path)}
                sx={{
                  textTransform: "none",
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                  borderRadius: 10,
                  px: 2,
                  py: 1,
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
          <IconButton onClick={toggleSearch} sx={{ mx: 0.5, borderRadius: "50%", p: 1, bgcolor: theme.palette.action.hover, transition: "all 0.2s ease-in-out", "&:hover": { transform: "scale(1.1)" } }}>
            {isSearchOpen ? <CloseIcon sx={{ color: theme.palette.text.secondary }} /> : <SearchIcon sx={{ color: theme.palette.text.secondary }} />}          </IconButton>
          {/* Search Field (if open) */}
          <TextField
            inputRef={searchInputRef}
            size="small"
            variant="outlined"
            placeholder="Search loans..."
            onChange={(e) => handleSearchChange(e.target.value)} // Use handleSearchChange from context
            value={searchTerm} // Use searchTerm from context
            autoFocus
            aria-label="Search loans, borrowers, and payments"
            sx={{
              ml: 1,
              width: isSearchOpen ? 200 : 0, // Use isSearchOpen from context
              opacity: isSearchOpen ? 1 : 0, // Use isSearchOpen from context
              transition: "width 0.3s ease-in-out, opacity 0.3s ease-in-out",
              overflow: "hidden",
            }}
          />

          {/* Notifications Button */}
          <Tooltip title="Notifications">
            <IconButton onClick={(e) => setNotificationAnchor(e.currentTarget)} sx={{ mx: 0.5, borderRadius: "50%", p: 1, bgcolor: theme.palette.action.hover, position: "relative", transition: "all 0.2s ease-in-out", "&:hover": { transform: "scale(1.1)" } }}>
              <NotificationsIcon sx={{ color: theme.palette.text.secondary }} />
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
                    animation: `${pulse} 1.5s infinite`,
                  }}
                />
              )}
            </IconButton>
          </Tooltip>

          {/* Settings/Account Button */}
          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ mx: 0.5, borderRadius: "50%", p: 1, bgcolor: theme.palette.action.hover, transition: "all 0.2s ease-in-out", "&:hover": { transform: "scale(1.1)" } }}>
              <Avatar
                sx={{ width: 24, height: 24, fontSize: "0.75rem", bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}
                src={currentUser?.photoURL || ''}
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
            borderRadius: 3,
            backdropFilter: 'blur(16px) saturate(180%)',
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            border: '1px solid ' + alpha(theme.palette.divider, 0.1),
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
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
        <MenuItem onClick={handleProfileClick} sx={{ mx: 1, borderRadius: 1.5 }}><ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>Profile</MenuItem>
        
        <MenuItem onClick={(e) => setAccountSettingsAnchor(e.currentTarget)} sx={{ mx: 1, borderRadius: 1.5 }}>
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            Settings
        </MenuItem>
        <Menu
          anchorEl={accountSettingsAnchor}
          open={Boolean(accountSettingsAnchor)}
          onClose={() => setAccountSettingsAnchor(null)}
          TransitionComponent={Fade}
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1.5,
              borderRadius: 3,
              backdropFilter: 'blur(16px) saturate(180%)',
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              border: '1px solid ' + alpha(theme.palette.divider, 0.1),
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            },
          }}
          transformOrigin={{ horizontal: "left", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleSettingsClick} sx={{ mx: 1, borderRadius: 1.5 }}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>Interest Rate/ Capital</MenuItem>
          <MenuItem onClick={handleChangePasswordClick} sx={{ mx: 1, borderRadius: 1.5 }}><ListItemIcon><LockResetIcon fontSize="small" /></ListItemIcon>Change Password</MenuItem>
          <MenuItem onClick={openHelpDialog} sx={{ mx: 1, borderRadius: 1.5 }}><ListItemIcon><HelpOutline fontSize="small" /></ListItemIcon>Help</MenuItem>
        </Menu>
        
        {/* NEW: Dark Mode Toggle */}
        <MenuItem onClick={onToggleDarkMode} sx={{ mx: 1, borderRadius: 1.5 }}>
          <ListItemIcon>
            {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </ListItemIcon>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </MenuItem>

        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleLogout} sx={{ mx: 1, borderRadius: 1.5 }}><ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>Logout</MenuItem>
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
            width: 320,
            p: 1,
            borderRadius: 3,
            backdropFilter: 'blur(16px) saturate(180%)',
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            border: '1px solid ' + alpha(theme.palette.divider, 0.1),
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Notifications</Typography>
          {unreadNotifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No new notifications.</Typography>
          ) : (
            unreadNotifications.map(({ id, message, loanId }) => (
              <MenuItem key={id} onClick={() => handleNotificationItemClick(id, loanId)} sx={{ borderRadius: 2, mb: 0.5, whiteSpace: 'normal' }}>
                <Typography variant="body2">{message}</Typography>
              </MenuItem>
            ))
          )}
          <Button onClick={handleMarkAllAsRead} color="primary" variant="text" sx={{ textTransform: 'none', mt: 1, width: '100%', borderRadius: 2 }}>
              Mark all as read
          </Button>
        </Box>
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

export default FloatingNavBar;
