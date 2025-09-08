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
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useAuth } from "../contexts/AuthProvider";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Google, Visibility, VisibilityOff } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const { login, loginWithGoogle, resetPassword, currentUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // --- IMPROVEMENT 1: Granular loading state ---
  // Tracks which specific action is loading: 'email', 'google', 'reset', or null
  const [isLoading, setIsLoading] = useState(null);

  // --- IMPROVEMENT 2: Password visibility state ---
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setIsLoading("email"); // Set specific loading state

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many login attempts. Please try again later.");
      } else {
        setError("Failed to log in. Please check your internet connection and try again.");
      }
    } finally {
      setIsLoading(null); // Reset loading state
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setResetMessage("");
    setIsLoading("google"); // Set specific loading state

    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // Don't show an error if the user intentionally closes the popup
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setIsLoading(null); // Reset loading state
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setResetMessage("");
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }

    setIsLoading("reset"); // Set specific loading state
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
      setIsLoading(null); // Reset loading state
    }
  };

  return (
    <Box height="100vh" display="flex" justifyContent="center" alignItems="center" bgcolor="#e0f2f1" p={2}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box maxWidth={400} width="100%" bgcolor="white" p={4} borderRadius={2} boxShadow={3}>
          {/* --- IMPROVEMENT 3: Added Logo --- */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img src="/android/android-launchericon-512-512.png" alt="Loan Manager Logo" style={{ height: '50px' }} />
          </Box>
          <Typography variant="h5" component="h1" mb={3} color="primary" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            Welcome Back
          </Typography>

          {/* --- IMPROVEMENT 4: Animated Alerts --- */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Alert severity="error" sx={{ mb: 2 }} aria-live="polite">
                  {error}
                </Alert>
              </motion.div>
            )}
            {resetMessage && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Alert severity="success" sx={{ mb: 2 }} aria-live="polite">
                  {resetMessage}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

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
                disabled={!!isLoading}
              />
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                variant="outlined"
                aria-label="Password"
                disabled={!!isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                type="submit"
                fullWidth
                disabled={!!isLoading}
                endIcon={isLoading === 'email' && <CircularProgress size={20} color="inherit" />}
              >
                {isLoading === 'email' ? "Logging In..." : "Log In"}
              </Button>

              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handleResetPassword}
                disabled={!!isLoading}
                sx={{ alignSelf: 'flex-end' }}
              >
                {isLoading === 'reset' ? 'Sending email...' : 'Forgot password?'}
              </Link>

              <Divider>OR</Divider>

              <Button
                variant="outlined"
                startIcon={<Google />}
                fullWidth
                onClick={handleGoogleLogin}
                disabled={!!isLoading}
              >
                {/* No spinner here for a cleaner look during other operations */}
                {isLoading === 'google' ? "Redirecting to Google..." : "Sign in with Google"}
              </Button>

              <Typography variant="body2" align="center">
                Don’t have an account?{" "}
                <Link component={RouterLink} to="/register" disabled={!!isLoading}>
                  Register
                </Link>
              </Typography>
            </Stack>
          </form>
        </Box>
      </motion.div>
    </Box>
  );
}
