import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  // Removed AppBar, Toolbar, IconButton as they are not used internally for a dialog
  // Removed useTheme, useMediaQuery as isMobile is not used either
} from "@mui/material";
// Removed CloseIcon as it's not used internally anymore
import { auth } from "../firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

// Add onClose prop for when ChangePassword is rendered inside a Dialog
export default function ChangePassword({ onClose }) { // Ensure component is named ChangePassword
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Removed theme and isMobile declarations as they are no longer used
  // const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const user = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!user) {
      setErrorMsg("No authenticated user found. Please log in again.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("New password should be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setSuccessMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Optional: Close dialog after successful password change
      // if (onClose) onClose();
    } catch (error) {
      console.error("Password change error:", error);
      if (error.code === 'auth/wrong-password') {
        setErrorMsg('Invalid current password. Please try again.');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        setErrorMsg('User not found or invalid email. Please log in again.');
      } else if (error.code === 'auth/requires-recent-login') {
        setErrorMsg('Please log out and log in again to change your password.');
      }
      else {
        setErrorMsg("Failed to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 3, sm: 4 }, // Add padding directly to the main content box for dialogs
      }}
    >
      {/* Title for the dialog/page */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Change Password
      </Typography>

      {/* Alerts for messages */}
      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg("")} sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" onClose={() => setSuccessMsg("")} sx={{ mb: 2 }}>
          {successMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Current Password"
            type="password"
            required
            fullWidth
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setErrorMsg(""); setSuccessMsg(""); }}
            autoComplete="current-password"
            margin="normal"
          />
          <TextField
            label="New Password"
            type="password"
            required
            fullWidth
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setErrorMsg(""); setSuccessMsg(""); }}
            autoComplete="new-password"
            helperText="At least 6 characters"
            margin="normal"
          />
          <TextField
            label="Confirm New Password"
            type="password"
            required
            fullWidth
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(""); setSuccessMsg(""); }}
            autoComplete="new-password"
            margin="normal"
          />
          <Button type="submit" variant="contained" fullWidth disabled={loading} size="large">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
