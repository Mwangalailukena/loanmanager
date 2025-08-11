import React, { useState, useEffect } from 'react';
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

const SplashScreen = ({ onFadeOutComplete, duration = 5000 }) => {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');

  // Progress animation
  useEffect(() => {
    const intervalTime = duration / 100;
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);
      if (currentProgress >= 100) clearInterval(timer);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [duration]);

  // Loading dots animation
  useEffect(() => {
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
        animation: `${fadeOut} 0.5s ease-out forwards`,
        animationDelay: `${Math.max(duration / 1000 - 0.5, 0)}s`,
      }}
      onAnimationEnd={(e) => {
        if (e.animationName === fadeOut.name) {
          onFadeOutComplete();
        }
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

      {/* Simple progress bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
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