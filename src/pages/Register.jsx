// src/pages/Register.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Link,
  CircularProgress, // Import CircularProgress
} from "@mui/material";
import { useAuth } from "../contexts/AuthProvider";
import { useNavigate, Link as RouterLink } from "react-router-dom";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(""); // New: State for name
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // New: State for loading

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true); // Set loading true when registration starts

    try {
      // Pass the name, email, and password to the register function
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      // Improved error message for Firebase Auth errors
      setError(err.message || "Failed to create an account. Please try again.");
      console.error("Registration error:", err); // Log for debugging
    } finally {
      setLoading(false); // Always set loading false
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
      <Box maxWidth={400} width="100%" bgcolor="white" p={4} borderRadius={2} boxShadow={3}>
        <Typography variant="h4" mb={3} color="primary" align="center">
          Register
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleRegister}>
          <Stack spacing={2}>
            {/* New: Name TextField */}
            <TextField
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              fullWidth
            />

            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={loading} // Disable button when loading
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Register"}
            </Button>

            <Typography variant="body2" align="center" mt={2}>
              Already have an account?{" "}
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
