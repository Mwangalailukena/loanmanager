// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Link,
} from "@mui/material";
import { useAuth } from "../contexts/AuthProvider";
import { Link as RouterLink } from "react-router-dom";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      bgcolor="#e0f2f1"
      p={2}
    >
      <Box
        maxWidth={400}
        width="100%"
        bgcolor="white"
        p={4}
        borderRadius={2}
        boxShadow={3}
      >
        <Typography variant="h4" mb={3} color="primary" align="center">
          Reset Password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <form onSubmit={handleReset}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={loading}
            >
              Send Reset Email
            </Button>

            <Typography variant="body2" align="center">
              Remember your password?{" "}
              <Link component={RouterLink} to="/login">
                Login
              </Link>
            </Typography>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}

