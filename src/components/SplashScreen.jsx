// src/components/SplashScreen.jsx
import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, keyframes } from '@mui/material';

// --- Animations ---
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const gentlePulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    visibility: hidden;
  }
`;

const SplashScreen = ({ isLoaded }) => {
  const [dots, setDots] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setIsExiting(true);
    }
  }, [isLoaded]);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 400);
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        animation: isExiting ? `${fadeOut} 0.5s ease-out forwards` : 'none',
        zIndex: (theme) => theme.zIndex.modal + 1,
      }}
    >
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={140}
          sx={{
            position: 'absolute',
            color: 'grey.300',
          }}
        />
        <CircularProgress
          size={140}
          disableShrink
          sx={{
            color: 'primary.main',
            animation: 'spin 1.5s linear infinite',
            '@keyframes spin': {
              '0%': {
                transform: 'rotate(0deg)',
              },
              '100%': {
                transform: 'rotate(360deg)',
              },
            },
          }}
        />
        <Box
          component="img"
          src="/android/android-launchericon-192-192.png"
          alt="App Logo"
          sx={{
            width: 100,
            height: 100,
            position: 'absolute',
            animation: `${fadeIn} 1s ease-out, ${gentlePulse} 2.5s ease-in-out infinite`,
          }}
        />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.secondary', animation: `${fadeIn} 1s ease-out` }}>
        Loading{dots}
      </Typography>
       <Typography variant="caption" sx={{ position: 'absolute', bottom: 20, color: 'text.disabled' }}>
        Developed by JeoTronix Technologies Limited
      </Typography>
    </Box>
  );
};

export default SplashScreen;

