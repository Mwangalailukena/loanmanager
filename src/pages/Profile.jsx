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
} from "@mui/material";
import { useAuth } from "../contexts/AuthProvider";
import { getAuth, updateProfile } from "firebase/auth";

export default function Profile() {
  const { currentUser } = useAuth();
  const auth = getAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || "");
      setPhotoURL(currentUser.photoURL || "");
    }
  }, [currentUser]);

  // Simulated photo upload handler
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMessage("");

    try {
      // Simulate upload delay - replace this with your actual upload logic to Firebase Storage or elsewhere
      await new Promise((res) => setTimeout(res, 1500));

      // Simulate uploaded photo URL (usually from your storage upload)
      const uploadedPhotoURL = URL.createObjectURL(file);

      // Update Firebase Auth user profile photoURL
      await updateProfile(auth.currentUser, { photoURL: uploadedPhotoURL });

      setPhotoURL(uploadedPhotoURL);
      setMessage("Profile photo updated.");
    } catch (error) {
      setMessage("Failed to upload photo.");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setMessage("");
    try {
      await updateProfile(auth.currentUser, { displayName });
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage("Failed to update profile.");
      console.error(error);
    }
  };

  return (
    <Box maxWidth={400} mx="auto" p={3}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Stack spacing={2} alignItems="center">
        <Avatar
          src={photoURL}
          alt={displayName || "User Avatar"}
          sx={{ width: 100, height: 100 }}
        />
        {uploading && <CircularProgress />}
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
      />

      <Button variant="contained" onClick={handleSave} fullWidth>
        Save Profile
      </Button>

      {message && (
        <Typography
          mt={2}
          color={message.includes("successfully") ? "green" : "error"}
          textAlign="center"
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}

