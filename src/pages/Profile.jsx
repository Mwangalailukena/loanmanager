// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Stack,
  Alert,
} from "@mui/material";
import { useAuth } from "../contexts/AuthProvider";
import { getAuth, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "../firebase"; // Assuming your firebase app instance is here

// Accept onClose prop
export default function Profile({ onClose }) {
  const { currentUser, refreshUser } = useAuth();
  const auth = getAuth(app);
  const storage = getStorage(app);

  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [message, setMessage] = useState("");

  // Sync state with currentUser from context
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || "");
      setPhotoURL(currentUser.photoURL || "");
    }
  }, [currentUser]);

  // Optional: Clear messages when component mounts/unmounts or when dialog is re-opened
  // This helps ensure a clean state if the dialog is opened multiple times
  useEffect(() => {
    setMessage(""); // Clear message when component mounts or relevant props change
  }, [onClose]); // Or you might use a specific 'open' prop from the dialog host

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMessage("");
    setUploading(true);

    try {
      const storageRef = ref(storage, `profile_pictures/${currentUser.uid}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const newPhotoURL = await getDownloadURL(snapshot.ref);

      await updateProfile(auth.currentUser, { photoURL: newPhotoURL });

      setPhotoURL(newPhotoURL);
      await refreshUser(); // Important: Refresh user in AuthProvider to get latest data
      setMessage("Profile photo updated successfully!");
    } catch (error) {
      console.error("Photo upload error:", error);
      setMessage(`Failed to upload photo: ${error.message || "Unknown error"}.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setMessage("");
    setSavingDisplayName(true);
    try {
      if (displayName !== currentUser?.displayName) {
        await updateProfile(auth.currentUser, { displayName });
        await refreshUser();
        setMessage("Profile updated successfully.");
        // Optional: Close dialog on successful save
        // if (onClose) onClose();
      } else {
        setMessage("No changes to save.");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage(`Failed to update profile: ${error.message || "Unknown error"}.`);
    } finally {
      setSavingDisplayName(false);
    }
  };

  return (
    <Box maxWidth={400} mx="auto" p={1}> {/* Reduced padding */}
      {message && (
        <Alert
          severity={message.includes("successfully") ? "success" : "error"}
          onClose={() => setMessage("")}
          sx={{ mb: 2 }}
        >
          {message}
        </Alert>
      )}

      <Stack spacing={2} alignItems="center" mb={3}>
        <Avatar
          src={photoURL || currentUser?.photoURL || 'https://via.placeholder.com/100?text=No+Photo'}
          alt={displayName || "User Avatar"}
          sx={{ width: 100, height: 100 }}
        />
        {uploading && <CircularProgress size={24} sx={{ mt: 1 }} />}
        <Button variant="contained" component="label" disabled={uploading}>
          Upload New Photo
          <input type="file" hidden onChange={handlePhotoChange} accept="image/*" />
        </Button>
      </Stack>

      <TextField
        label="Display Name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        fullWidth
        margin="normal"
        disabled={savingDisplayName}
      />

      <Button
        variant="contained"
        onClick={handleSave}
        fullWidth
        disabled={savingDisplayName || displayName === currentUser?.displayName}
        sx={{ mt: 2 }}
      >
        {savingDisplayName ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
      </Button>
    </Box>
  );
}
