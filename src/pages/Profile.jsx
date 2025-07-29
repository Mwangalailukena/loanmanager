// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Stack,
  Alert,
} from "@mui/material";
import { useAuth } from "../contexts/AuthProvider";
import { getAuth, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // <-- Import Storage functions
import app from "../firebase"; // Assuming your firebase app instance is here

export default function Profile() {
  const { currentUser, refreshUser } = useAuth(); // Also get refreshUser
  const auth = getAuth(app); // Ensure auth is initialized with app
  const storage = getStorage(app); // Initialize storage with app

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

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMessage("");
    setUploading(true);

    try {
      // Create a storage reference: profile_pictures/{user_id}/profile.jpg (or original file name)
      // Using user.uid ensures each user has their own folder
      const storageRef = ref(storage, `profile_pictures/${currentUser.uid}/${file.name}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);

      // Get the download URL
      const newPhotoURL = await getDownloadURL(snapshot.ref);

      // Update Firebase Auth user profile with the new photoURL
      await updateProfile(auth.currentUser, { photoURL: newPhotoURL });

      // Update local state and trigger context refresh
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
      // Check if display name has actually changed to avoid unnecessary API calls
      if (displayName !== currentUser?.displayName) {
        await updateProfile(auth.currentUser, { displayName });
        await refreshUser(); // Refresh user in AuthProvider to get latest data
        setMessage("Profile updated successfully.");
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
    <Box maxWidth={400} mx="auto" p={3}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

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
          src={photoURL || currentUser?.photoURL || 'https://via.placeholder.com/100?text=No+Photo'} // Fallback for no photo
          alt={displayName || "User Avatar"}
          sx={{ width: 100, height: 100 }}
        />
        {uploading && <CircularProgress size={24} sx={{ mt: 1 }} />} {/* Adjusted margin */}
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
        disabled={savingDisplayName || displayName === currentUser?.displayName} // Disable if no changes
        sx={{ mt: 2 }}
      >
        {savingDisplayName ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
      </Button>
    </Box>
  );
}
