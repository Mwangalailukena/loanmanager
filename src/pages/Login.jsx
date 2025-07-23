// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Link,
  Divider,
} from "@mui/material";
import { useAuth } from "../contexts/AuthProvider";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Google } from "@mui/icons-material";

export default function Login() {
  const { login, loginWithGoogle, resetPassword, currentUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Failed to login. Check your credentials.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch {
      setError("Google sign-in failed.");
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setResetMessage("");
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }
    try {
      await resetPassword(email);
      setResetMessage("Password reset email sent.");
    } catch {
      setError("Failed to send reset email.");
    }
  };

  return (
    <Box height="100vh" display="flex" justifyContent="center" alignItems="center" bgcolor="#e0f2f1" p={2}>
      <Box maxWidth={400} width="100%" bgcolor="white" p={4} borderRadius={2} boxShadow={3}>
        <Typography variant="h4" mb={3} color="primary">
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {resetMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {resetMessage}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button variant="contained" type="submit" fullWidth>
              Log In
            </Button>

            <Link component="button" variant="body2" onClick={handleResetPassword}>
              Forgot password?
            </Link>

            <Divider>OR</Divider>

            <Button
              variant="outlined"
              startIcon={<Google />}
              fullWidth
              onClick={handleGoogleLogin}
            >
              Sign in with Google
            </Button>

            <Typography variant="body2" align="center">
              Don’t have an account?{" "}
              <Link component={RouterLink} to="/register">
                Register
              </Link>
            </Typography>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}

