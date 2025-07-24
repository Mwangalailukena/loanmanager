import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Stack,
  Alert, // Added for message display
} from "@mui/material";
import { useAuth } from "../contexts/AuthProvider";
import { getAuth, updateProfile } from "firebase/auth";
// If you integrate Firebase Storage, you'll need these imports:
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { storage } from "../firebaseConfig"; // Assuming your firebase config is here

export default function Profile() {
  const { currentUser } = useAuth();
  const auth = getAuth();
  // const storage = getStorage(); // Initialize storage if you use it

  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [savingDisplayName, setSavingDisplayName] = useState(false); // New state for display name saving
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
      // --- START: Replace with actual Firebase Storage upload logic ---
      // Example of real Firebase Storage upload:
      // const storageRef = ref(storage, `profile_pictures/${currentUser.uid}/${file.name}`);
      // const snapshot = await uploadBytes(storageRef, file);
      // const uploadedPhotoURL = await getDownloadURL(snapshot.ref);

      // Current Simulated Logic:
      await new Promise((res) => setTimeout(res, 1500)); // Simulate upload delay
      const uploadedPhotoURL = URL.createObjectURL(file); // Get local URL for immediate display
      // --- END: Replace with actual Firebase Storage upload logic ---

      // Update Firebase Auth user profile photoURL
      await updateProfile(auth.currentUser, { photoURL: uploadedPhotoURL });

      setPhotoURL(uploadedPhotoURL);
      setMessage("Profile photo updated successfully!");
    } catch (error) {
      setMessage("Failed to upload photo. Please try again.");
      console.error("Photo upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setMessage("");
    setSavingDisplayName(true); // Set loading true for save button
    try {
      await updateProfile(auth.currentUser, { displayName });
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage("Failed to update profile.");
      console.error("Profile update error:", error);
    } finally {
      setSavingDisplayName(false); // Set loading false
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
          onClose={() => setMessage("")} // Allow user to dismiss
          sx={{ mb: 2 }}
        >
          {message}
        </Alert>
      )}

      <Stack spacing={2} alignItems="center" mb={3}>
        <Avatar
          src={photoURL}
          alt={displayName || "User Avatar"}
          sx={{ width: 100, height: 100 }}
        />
        {uploading && <CircularProgress size={24} />}
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
        disabled={savingDisplayName} // Disable while saving
      />

      <Button variant="contained" onClick={handleSave} fullWidth disabled={savingDisplayName} sx={{ mt: 2 }}>
        {savingDisplayName ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
      </Button>
    </Box>
  );
}
