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
          backdropFilter: "blur(12px) saturate(180%)",
          backgroundColor: alpha(theme.palette.background.paper, 0.1),
          border: "1px solid " + alpha(theme.palette.divider, 0.2),
          boxShadow: theme.shadows[3],
          zIndex: theme.zIndex.appBar + 1,
          transform: barVisible ? "translateY(0)" : "translateY(-100px)",
          opacity: barVisible ? 1 : 0,
          transition: "transform 0.5s ease-out, opacity 0.5s ease-out",
        }}
      >
        {/* Navigation Links */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 0.5,
            borderRadius: 12,
            bgcolor: alpha(theme.palette.grey[800], 0.2),
          }}
        >
          {navItems.map((item) => (
            item.children ? (
              <React.Fragment key={item.text}>
                <Button
                  onClick={(e) => {
                    if (item.text === "Loan Management") setLoanManagementAnchor(e.currentTarget);
                    if (item.text === "Analytics & Reporting") setAnalyticsReportingAnchor(e.currentTarget);
                  }}
                  sx={{
                    textTransform: "none",
                    color: theme.palette.text.secondary,
                    borderRadius: 12,
                    px: 2,
                    py: 1,
                    fontWeight: 500,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.grey[900], 0.1),
                      transform: "scale(1.02)",
                      boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                    },
                    // Add active styling if any child path is active
                    ...((item.children.some(child => location.pathname.startsWith(child.path))) && {
                      bgcolor: theme.palette.grey[900],
                      color: theme.palette.common.white,
                      "&:hover": { bgcolor: theme.palette.grey[900] },
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
                    elevation: 4,
                    sx: {
                      mt: 1.5,
                      borderRadius: 2,
                      backdropFilter: 'blur(12px) saturate(180%)',
                      backgroundColor: alpha(theme.palette.background.paper, 0.1),
                      border: '1px solid ' + alpha(theme.palette.divider, 0.2),
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
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      {child.text}
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
                  color: theme.palette.text.secondary,
                  borderRadius: 12,
                  px: 2,
                  py: 1,
                  fontWeight: 500,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.grey[900], 0.1),
                    transform: "scale(1.02)",
                    boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                  ...(location.pathname.startsWith(item.path) && {
                    bgcolor: theme.palette.grey[900],
                    color: theme.palette.common.white,
                    "&:hover": { bgcolor: theme.palette.grey[900] },
                  }),
                }}
              >
                {item.text}
              </Button>
            )
          ))}
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
          elevation: 4,
          sx: {
            mt: 1.5,
            borderRadius: 2,
            backdropFilter: 'blur(12px) saturate(180%)',
            backgroundColor: alpha(theme.palette.background.paper, 0.1),
            border: '1px solid ' + alpha(theme.palette.divider, 0.2),
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
        <MenuItem onClick={handleProfileClick}><ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>Profile</MenuItem>
        
        <MenuItem onClick={(e) => setAccountSettingsAnchor(e.currentTarget)}>
            <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
            Settings
        </MenuItem>
        <Menu
          anchorEl={accountSettingsAnchor}
          open={Boolean(accountSettingsAnchor)}
          onClose={() => setAccountSettingsAnchor(null)}
          TransitionComponent={Fade}
          PaperProps={{
            elevation: 4,
            sx: {
              mt: 1.5,
              borderRadius: 2,
              backdropFilter: 'blur(12px) saturate(180%)',
              backgroundColor: alpha(theme.palette.background.paper, 0.1),
              border: '1px solid ' + alpha(theme.palette.divider, 0.2),
            },
          }}
          transformOrigin={{ horizontal: "left", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleSettingsClick}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>Interest Rate/ Capital</MenuItem>
          <MenuItem onClick={handleChangePasswordClick}><ListItemIcon><LockResetIcon fontSize="small" /></ListItemIcon>Change Password</MenuItem>
          <MenuItem onClick={openHelpDialog}><ListItemIcon><HelpOutline fontSize="small" /></ListItemIcon>Help</MenuItem>
        </Menu>
        
        {/* NEW: Dark Mode Toggle */}
        <MenuItem onClick={onToggleDarkMode}>
          <ListItemIcon>
            {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </ListItemIcon>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </MenuItem>

        <Divider />
        <MenuItem onClick={handleLogout}><ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>Logout</MenuItem>
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

export default FloatingNavBar;
