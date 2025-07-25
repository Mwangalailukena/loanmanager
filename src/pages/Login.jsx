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
  CircularProgress, // Import CircularProgress for loading indicators
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
  const [loading, setLoading] = useState(false); // New loading state for general operations
  const [isResetting, setIsResetting] = useState(false); // New loading state for password reset

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setLoading(true); // Set loading state to true

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      // More specific error handling
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many login attempts. Please try again later.");
      } else {
        setError("Failed to log in. Please check your internet connection and try again.");
      }
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  const handleGoogleLogin = async () => {
    setError(""); // Clear previous errors
    setLoading(true); // Set loading state to true

    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      // More specific error for Google login
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Google sign-in was cancelled.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Another Google sign-in request is already pending.");
      }
      else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setResetMessage("");
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }

    setIsResetting(true); // Set loading state for reset
    try {
      await resetPassword(email);
      setResetMessage("Password reset email sent. Check your inbox (and spam folder).");
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError("No account found with that email address.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsResetting(false); // Reset loading state
    }
  };

  return (
    <Box height="100vh" display="flex" justifyContent="center" alignItems="center" bgcolor="#e0f2f1" p={2}>
      <Box maxWidth={400} width="100%" bgcolor="white" p={4} borderRadius={2} boxShadow={3}>
        <Typography variant="h4" mb={3} color="primary" sx={{ textAlign: 'center' }}>
          Welcome Back!
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} aria-live="polite">
            {error}
          </Alert>
        )}
        {resetMessage && (
          <Alert severity="success" sx={{ mb: 2 }} aria-live="polite">
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
              fullWidth
              variant="outlined"
              aria-label="Email address"
              disabled={loading || isResetting} // Disable when any operation is ongoing
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              variant="outlined"
              aria-label="Password"
              disabled={loading || isResetting} // Disable when any operation is ongoing
            />
            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={loading || isResetting} // Disable button when loading or resetting
              endIcon={loading && <CircularProgress size={20} color="inherit" />} // Show loading indicator
            >
              {loading ? "Logging In..." : "Log In"}
            </Button>

            <Link
              component="button"
              variant="body2"
              onClick={handleResetPassword}
              disabled={loading || isResetting} // Disable link when loading or resetting
              sx={{ alignSelf: 'flex-end' }} // Align to the right
            >
              {isResetting ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
              Forgot password?
            </Link>

            <Divider>OR</Divider>

            <Button
              variant="outlined"
              startIcon={<Google />}
              fullWidth
              onClick={handleGoogleLogin}
              disabled={loading || isResetting} // Disable button when loading or resetting
              endIcon={loading && <CircularProgress size={20} color="inherit" />} // Show loading indicator
            >
              {loading ? "Signing In..." : "Sign in with Google"}
            </Button>

            <Typography variant="body2" align="center">
              Don’t have an account?{" "}
              <Link component={RouterLink} to="/register" disabled={loading || isResetting}>
                Register
              </Link>
            </Typography>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
