// src/components/SplashScreen.jsx
import React from 'react';
import { Box, LinearProgress, Typography, keyframes } from '@mui/material';

// Animations
const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; visibility: hidden; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const slideInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// New prop 'isLoaded' will control when the splash screen fades out.
const SplashScreen = ({ isLoaded }) => {
  const [dots, setDots] = React.useState('');

  // Loading dots animation remains, as it's a visual effect
  React.useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 500);
    return () => clearInterval(dotTimer);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        // Apply fadeOut animation only when 'isLoaded' is true
        animation: isLoaded ? `${fadeOut} 0.5s ease-out forwards` : 'none',
        // Optional: you can add a small delay to make the transition smoother
        animationDelay: '0.2s',
      }}
    >
      {/* Logo with fade-in + bounce */}
      <Box
        component="img"
        src="/android/android-launchericon-512-512.png"
        alt="Your App Logo"
        sx={{
          maxWidth: '220px',
          maxHeight: '220px',
          mb: 4,
          animation: `${fadeIn} 0.8s ease forwards, ${bounce} 2s ease-in-out infinite`,
        }}
      />

      {/* Animated loading text */}
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{
          mb: 3,
          animation: `${slideInUp} 0.5s ease-out forwards`,
          animationDelay: '0.2s',
          opacity: 0,
        }}
      >
        Loading your application{dots}
      </Typography>

      {/* A simple, non-deterministic loader is better for dynamic loading */}
      <LinearProgress
        sx={{
          width: '70%',
          maxWidth: '400px',
          height: 10,
          borderRadius: 5,
          backgroundColor: '#eee',
          animation: `${slideInUp} 0.5s ease-out forwards`,
          animationDelay: '0.4s',
          opacity: 0,
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
            backgroundColor: '#1976d2',
          },
        }}
      />

      {/* Credit text */}
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{
          position: 'absolute',
          bottom: 16,
          width: '100%',
          textAlign: 'center',
          lineHeight: 1.2,
          animation: `${fadeIn} 0.5s ease-in forwards`,
          animationDelay: '0.6s',
          opacity: 0,
        }}
      >
        Developed by JeoTronix Technologies Limited
      </Typography>
    </Box>
  );
};

export default SplashScreen;
