import React, { useState, useEffect, useRef } from "react";
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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useAuth } from "../contexts/AuthProvider";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { alpha } from '@mui/material/styles';

export default function Login() {
  const { 
    login, 
    loginWithGoogle, 
    resetPassword, 
    currentUser, 
    setAuthPersistence, 
    browserLocalPersistence, 
    browserSessionPersistence 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isLoading, setIsLoading] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rateLimitTimer, setRateLimitTimer] = useState(0);

  const emailInputRef = useRef(null);

  // Auto-focus email input on mount
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  // Handle Rate Limit Countdown
  useEffect(() => {
    let timer;
    if (rateLimitTimer > 0) {
      timer = setInterval(() => {
        setRateLimitTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [rateLimitTimer]);

  // Handle Persistence proactively when checkbox changes
  useEffect(() => {
    const type = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    setAuthPersistence(type).catch(err => console.error("Persistence failed", err));
  }, [rememberMe, setAuthPersistence, browserLocalPersistence, browserSessionPersistence]);

  useEffect(() => {
    if (currentUser) {
      // Smart Redirect: Go to the intended page or default to dashboard
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (rateLimitTimer > 0) return;

    setError("");
    setResetMessage("");
    setIsLoading("email");

    try {
      // Input UX: Trim whitespace
      await login(email.trim(), password);
      // Navigation handled by useEffect
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/too-many-requests') {
        // 2. Rate Limiting
        setError("Too many login attempts. Please wait 30 seconds.");
        setRateLimitTimer(30);
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
      // Navigation handled by useEffect
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // Don't show an error if the user intentionally closes the popup
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        // 5. Account Linking Error
        setError("An account with this email already exists using a different sign-in method (e.g., password). Please log in with your email and password first.");
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
      await resetPassword(email.trim());
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
        background: (theme) => theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${theme.palette.background.default} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${theme.palette.background.default} 100%)`,
        p: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Paper
          elevation={0}
          component="section"
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            maxWidth: '450px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            borderRadius: 4,
            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(20px)',
            background: (theme) => alpha(theme.palette.background.paper, 0.8),
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1 }}>
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 0.2 }}
             >
                <img src="/android/android-launchericon-512-512.png" alt="Loan Manager Logo" style={{ height: '48px', marginBottom: '16px' }} />
             </motion.div>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please enter your details to sign in.
            </Typography>
          </Box>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} aria-live="polite">
                  {error}
                </Alert>
              </motion.div>
            )}
            {resetMessage && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} aria-live="polite">
                  {resetMessage}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                inputRef={emailInputRef}
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                variant="outlined"
                disabled={!!isLoading || rateLimitTimer > 0}
                placeholder="your@email.com"
                InputProps={{
                  sx: { borderRadius: 1.5 }
                }}
              />
              <Box>
                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  variant="outlined"
                  disabled={!!isLoading || rateLimitTimer > 0}
                  placeholder="••••••••"
                  InputProps={{
                    sx: { borderRadius: 1.5 },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                   <FormControlLabel
                      control={<Checkbox size="small" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} disabled={!!isLoading || rateLimitTimer > 0} />}
                      label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
                   />
                   <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={handleResetPassword}
                    disabled={!!isLoading || rateLimitTimer > 0}
                    sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {isLoading === 'reset' ? 'Sending...' : 'Forgot password?'}
                  </Link>
                </Box>
              </Box>

              <Button
                variant="contained"
                type="submit"
                fullWidth
                disabled={!!isLoading || rateLimitTimer > 0}
                endIcon={isLoading === 'email' && <CircularProgress size={20} color="inherit" />}
                sx={{ 
                  height: 48, 
                  borderRadius: 2, 
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                  }
                }}
              >
                {isLoading === 'email' ? "Signing in..." : rateLimitTimer > 0 ? `Wait ${rateLimitTimer}s` : "Sign in"}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ mx: 2 }}>OR</Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>

            <Button
              variant="outlined"
              fullWidth
              onClick={handleGoogleLogin}
              disabled={!!isLoading || rateLimitTimer > 0}
              sx={{ 
                height: 48, 
                borderRadius: 2, 
                textTransform: 'none', 
                fontWeight: 500, // Google uses medium weight
                color: 'rgba(0, 0, 0, 0.54)', // Official Google text color
                backgroundColor: '#ffffff',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'transparent' : '#dadce0',
                boxShadow: '0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3.1px 1px rgba(60,64,67,0.15)',
                '&:hover': {
                   backgroundColor: '#f8f9fa',
                   borderColor: '#d2e3fc',
                   boxShadow: '0 1px 3px 0 rgba(60,64,67,0.30), 0 4px 8px 3px rgba(60,64,67,0.15)',
                },
                display: 'flex',
                justifyContent: 'center',
                gap: 1.5,
              }}
            >
              {isLoading === 'google' ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <>
                  <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'inherit' }}>
                    Sign in with Google
                  </Typography>
                </>
              )}
            </Button>

            <Typography variant="body2" align="center" sx={{ mt: 3, color: 'text.secondary' }}>
              Don’t have an account?{" "}
              <Link component={RouterLink} to="/register" sx={{ fontWeight: 600, textDecoration: 'none', color: 'primary.main' }}>
                Sign up
              </Link>
            </Typography>
          </form>
        </Paper>
      </motion.div>
    </Box>
  );
}
