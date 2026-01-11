import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useSnackbar } from "./SnackbarProvider";

export default function AddBorrowerDialog({ open, onClose }) {
  const { addBorrower, borrowers } = useFirestore();
  const showSnackbar = useSnackbar();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setNationalId("");
    setAddress("");
    setErrors({});
    setFormError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim() || !/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
      newErrors.name = "Name must be 2-50 characters, containing only letters and spaces.";
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!validate()) {
      showSnackbar("Please correct the errors before submitting.", "error");
      return;
    }

    if (borrowers.some((borrower) => borrower.phone === phone)) {
      setFormError("A borrower with this phone number already exists.");
      showSnackbar("A borrower with this phone number already exists.", "error");
      return;
    }

    setLoading(true);
    try {
      await addBorrower({ name, email, phone, nationalId, address });
      showSnackbar("Borrower added successfully!", "success");
      handleClose();
    } catch (err) {
      console.error("Failed to add borrower:", err);
      setFormError("Failed to add borrower. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="xs" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        New Borrower
        <IconButton size="small" onClick={handleClose} disabled={loading}>
            <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {formError && (
          <Alert severity="error" onClose={() => setFormError("")} sx={{ mb: 2, fontSize: '0.8rem' }}>
            {formError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ py: 1 }}>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              size="small"
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
            />
            <TextField
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              required
              size="small"
              inputProps={{ maxLength: 10, inputMode: "numeric" }}
              error={!!errors.phone}
              helperText={errors.phone}
              disabled={loading}
            />
            <TextField
              label="Email Address (Optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              fullWidth
              size="small"
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
            />
            <TextField
              label="National ID (Optional)"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
            />
            <TextField
              label="Address (Optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
              disabled={loading}
            />
          </Stack>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="secondary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? "Saving..." : "Add Borrower"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}