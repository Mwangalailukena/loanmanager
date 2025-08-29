import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useSnackbar } from "../components/SnackbarProvider";

export default function AddBorrowerPage() {
  const { addBorrower, borrowers } = useFirestore();
  const showSnackbar = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

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
      const newBorrower = await addBorrower({ name, email, phone, nationalId, address });
      showSnackbar("Borrower added successfully!", "success");
      const from = location.state?.from;
      if (from) {
        navigate(from, { state: { newBorrowerId: newBorrower.id } });
      } else {
        navigate("/borrowers"); // Navigate to the borrowers list page
      }
    } catch (err) {
      console.error("Failed to add borrower:", err);
      setFormError("Failed to add borrower. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        maxWidth: 500,
        mx: "auto",
        mt: 4,
        p: 3,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'center' }}>
        Add New Borrower
      </Typography>

      {formError && (
        <Alert severity="error" onClose={() => setFormError("")} sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
          />
          <TextField
            label="Email Address (Optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            fullWidth
            error={!!errors.email}
            helperText={errors.email}
            disabled={loading}
          />
          <TextField
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            required
            inputProps={{ maxLength: 10, inputMode: "numeric" }}
            error={!!errors.phone}
            helperText={errors.phone}
            disabled={loading}
          />
          <TextField
            label="National ID (Optional)"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            fullWidth
            disabled={loading}
          />
          <TextField
            label="Address (Optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
            multiline
            rows={2}
            disabled={loading}
          />
          <Box sx={{ pt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              disabled={loading}
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? "Adding Borrower..." : "Add Borrower"}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}
