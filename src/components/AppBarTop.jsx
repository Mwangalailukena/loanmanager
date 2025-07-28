// ... (imports remain the same) ...
import {
  // ... existing imports ...
  Dialog, // Ensure Dialog is imported
} from "@mui/material";

// ... (other imports) ...
import ChangePasswordPage from "../pages/ChangePasswordPage"; // Import the ChangePasswordPage component

// ... (stringToInitials, Transition components) ...

const AppBarTop = ({ onToggleDarkMode, darkMode }) => {
  // ... (existing state variables) ...

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false); // New state for Change Password dialog
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState([]);

  // ... (useEffect for notifications) ...

  // ... (handleMenuClick, handleMenuClose, handleLogout) ...

  const handleSettingsClick = () => {
    handleMenuClose();
    if (isMobile) {
      setSettingsOpen(true);
    } else if (window.location.pathname !== "/settings") {
      navigate("/settings");
    }
  };

  // Modified handleChangePasswordClick to open dialog
  const handleChangePasswordClick = () => {
    handleMenuClose();
    if (isMobile) {
      setChangePasswordOpen(true); // Open dialog on mobile
    } else if (window.location.pathname !== "/change-password") {
      navigate("/change-password"); // Navigate to page on desktop
    }
  };

  const handleActivityClick = () => {
    handleMenuClose();
    if (window.location.pathname !== "/activity") {
      navigate("/activity");
    }
  };

  const openHelpDialog = () => {
    handleMenuClose();
    setHelpOpen(true);
  };

  const handleNotificationsClick = (e) => {
    setNotificationAnchor(e.currentTarget);
  };
  const closeNotifications = () => setNotificationAnchor(null);
  const closeSettingsDialog = () => setSettingsOpen(false);
  const closeHelpDialog = () => setHelpOpen(false);
  const closeChangePasswordDialog = () => setChangePasswordOpen(false); // New close function for dialog

  // ... (toggleSearch, performSearch, handleSearchKeyDown, handleNotificationItemClick) ...

  return (
    <>
      {/* ... (existing AppBar, Toolbar, Menu, Popover for notifications) ... */}

      {/* Settings Dialog (non-fullscreen) */}
      <Dialog
        open={settingsOpen}
        onClose={closeSettingsDialog}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}
      >
        <SettingsPage onClose={closeSettingsDialog} />
      </Dialog>

      {/* NEW: Change Password Dialog (non-fullscreen) */}
      <Dialog
        open={changePasswordOpen} // Use new state
        onClose={closeChangePasswordDialog} // Use new close function
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, mx: 2 } }}
      >
        <ChangePasswordPage onClose={closeChangePasswordDialog} /> {/* Pass onClose prop */}
      </Dialog>

      {/* Help Dialog */}
      <HelpDialog open={helpOpen} onClose={closeHelpDialog} sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }} />
    </>
  );
};

export default AppBarTop;
