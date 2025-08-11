// src/components/SplashScreen.jsx
import React, { useState, useEffect } from 'react';
import { Box, LinearProgress, Typography, keyframes, useTheme } from '@mui/material';

// Animations
const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; visibility: hidden; }
`;

const pulseRotate = keyframes`
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.05) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); }
`;

const slideInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const progressShimmer = keyframes`
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Background pattern animation
const backgroundMove = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const SplashScreen = ({ onFadeOutComplete, duration = 5000 }) => {
  const theme = useTheme();
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
        // Main gradient background
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.background.default} 100%)`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        animation: `${fadeOut} 0.5s ease-out forwards`,
        animationDelay: `${Math.max((duration / 1000) - 0.5, 0)}s`,
      }}
      onAnimationEnd={(e) => {
        if (e.animationName === fadeOut.name) {
          onFadeOutComplete();
        }
      }}
    >
      {/* Animated radial glow background overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, ${theme.palette.primary.main}20 0%, transparent 70%)`,
          backgroundSize: '200% 200%',
          animation: `${backgroundMove} 10s ease-in-out infinite`,
          zIndex: 0,
        }}
      />

      {/* Foreground content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src="/android/android-launchericon-512-512.png"
          alt="Your App Logo"
          sx={{
            maxWidth: '220px',
            maxHeight: '220px',
            mb: 4,
            animation: `${pulseRotate} 2s infinite ease-in-out, ${slideInUp} 0.5s ease-out forwards`,
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

        {/* Glowing pill-shaped progress bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            width: '70%',
            maxWidth: '400px',
            height: 10,
            borderRadius: 5,
            backgroundColor:
              theme.palette.mode === 'light'
                ? theme.palette.grey[300]
                : theme.palette.grey[700],
            animation: `${slideInUp} 0.5s ease-out forwards`,
            animationDelay: '0.4s',
            opacity: 0,
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              background: `linear-gradient(
                to right,
                ${theme.palette.primary.main} 0%,
                ${theme.palette.primary.light} 50%,
                ${theme.palette.primary.main} 100%
              )`,
              backgroundSize: '200% 100%',
              animation: `${progressShimmer} 2s linear infinite`,
              boxShadow: `0 0 8px ${theme.palette.primary.light}`,
            },
          }}
        />
      </Box>

      {/* Credit text */}
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{
          position: 'absolute',
          bottom: theme.spacing(2),
          width: '100%',
          textAlign: 'center',
          lineHeight: 1.2,
          animation: `${fadeIn} 0.5s ease-in forwards`,
          animationDelay: '0.6s',
          opacity: 0,
          zIndex: 1,
        }}
      >
        Developed by JeoTronix Technologies Limited
      </Typography>
    </Box>
  );
};

export default SplashScreen;