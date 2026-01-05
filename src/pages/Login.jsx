import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  Divider,
  CircularProgress,
  InputAdornment,
  IconButton,
  Paper,
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
  const [isLoading, setIsLoading] = useState(null);
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
    setIsLoading("email");

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
      setIsLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setResetMessage("");
    setIsLoading("google");

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
      setIsLoading(null);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setResetMessage("");
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }

    setIsLoading("reset");
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
      setIsLoading(null);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          component="section"
          sx={{
            p: 3,
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            borderTop: theme => `4px solid ${theme.palette.primary.main}`, // Subtle top border for visual anchor
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1 }}>
            <img src="/android/android-launchericon-512-512.png" alt="Loan Manager Logo" style={{ height: '36px' }} />
          </Box>
          <Typography variant="h4" component="h1" sx={{ textAlign: 'center', fontWeight: 600, color: 'text.primary', mb: 2, letterSpacing: '0.01em' }}>
            Welcome Back
          </Typography>

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
            <Box sx={{ mb: 3 }}> {/* Grouping TextFields and Forgot Password link */}
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
                sx={{ mb: 1.5 }} // Spacing between fields
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
              <Link
                component="button"
                type="button"
                variant="caption" // Smaller variant for de-emphasis
                onClick={handleResetPassword}
                disabled={!!isLoading}
                sx={{ alignSelf: 'flex-end', mt: 1, color: 'text.secondary' }} // More subtle color and top margin
              >
                {isLoading === 'reset' ? 'Sending email...' : 'Forgot password?'}
              </Link>
            </Box>

            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={!!isLoading}
              endIcon={isLoading === 'email' && <CircularProgress size={20} color="inherit" />}
              sx={{ height: 48, mb: 3 }} // Increased height, bottom margin for separation
            >
              {isLoading === 'email' ? "Logging In..." : "Log In"}
            </Button>

            <Divider sx={{ mb: 3 }}>OR</Divider> {/* Increased bottom margin for separation */}

            <Button
              variant="outlined"
              startIcon={<Google />}
              fullWidth
              onClick={handleGoogleLogin}
              disabled={!!isLoading}
              sx={{ mb: 3 }} // Bottom margin for separation
            >
              {isLoading === 'google' ? "Redirecting to Google..." : "Sign in with Google"}
            </Button>

            <Typography variant="body2" align="center">
              Don’t have an account?{" "}
              <Link component={RouterLink} to="/register" disabled={!!isLoading}>
                Register
              </Link>
            </Typography>
          </form>
        </Paper>
      </motion.div>
    </Box>
  );
}
