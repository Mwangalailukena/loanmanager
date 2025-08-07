// src/components/SplashScreen.jsx
import React, { useState, useEffect } from 'react';
import { Box, LinearProgress, Typography, keyframes, useTheme } from '@mui/material';

// Define keyframe animations
const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    visibility: hidden; /* Hide element completely after fade */
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// NEW: Keyframe for entry animation (slide and fade in)
const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// NEW: Keyframe for progress bar shimmer effect
const progressShimmer = keyframes`
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
`;

// NEW: Keyframe for a simple fade-in
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const SplashScreen = ({ onFadeOutComplete, duration = 3000 }) => {
  const theme = useTheme();
  const [progress, setProgress] = useState(0); // State for progress bar

  useEffect(() => {
    // Calculate how often to update the progress bar
    const intervalTime = duration / 100; // Update 100 times for 0-100%
    let currentProgress = 0;

    const timer = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(timer);
      }
    }, intervalTime);

    // Clean up the interval on component unmount
    return () => clearInterval(timer);
  }, [duration]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        // The main fade-out animation
        animation: `${fadeOut} 0.5s ease-out forwards`,
        animationDelay: `${(duration / 1000) - 0.5}s`,
        '@keyframes fadeOut': { from: { opacity: 1 }, to: { opacity: 0, visibility: 'hidden' } },
      }}
      onAnimationEnd={(e) => {
        if (e.animationName === fadeOut.name) {
          onFadeOutComplete();
        }
      }}
    >
      {/* Main centered content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* LOGO with pulse and slide-in-up animation */}
        <Box
          component="img"
          src="/android/android-launchericon-512-512.png"
          alt="Your App Logo"
          sx={{
            maxWidth: '200px',
            maxHeight: '200px',
            mb: 4,
            animation: `${pulse} 1.5s infinite ease-in-out, ${slideInUp} 0.5s ease-out forwards`,
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
              '100%': { transform: 'scale(1)' },
            },
            '@keyframes slideInUp': {
              from: { opacity: 0, transform: 'translateY(20px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        />

        {/* LOADING MESSAGE with slide-in-up animation and a slight delay */}
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            mb: 3,
            animation: `${slideInUp} 0.5s ease-out forwards`,
            animationDelay: '0.2s', // Staggered animation
            opacity: 0, // Start with opacity 0 so the animation works
          }}
        >
          Loading your application...
        </Typography>

        {/* PROGRESS BAR with shimmer effect and slide-in-up animation */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            width: '70%',
            maxWidth: '400px',
            height: 8,
            borderRadius: 5,
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
            animation: `${slideInUp} 0.5s ease-out forwards`,
            animationDelay: '0.4s', // Staggered animation
            opacity: 0,
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              // NEW: Shimmer effect on the progress bar
              background: `linear-gradient(
                to right,
                ${theme.palette.primary.main} 0%,
                ${theme.palette.primary.light} 50%,
                ${theme.palette.primary.main} 100%
              )`,
              backgroundSize: '200% 100%',
              animation: `${progressShimmer} 2s linear infinite`,
              '@keyframes progressShimmer': {
                '0%': { backgroundPosition: '100% 0' },
                '100%': { backgroundPosition: '-100% 0' },
              },
            },
          }}
        />
      </Box>

      {/* Credit text positioned absolutely at the bottom with a fade-in animation */}
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
          animationDelay: '0.5s', // Appear after the main content has started animating
          opacity: 0, // Start with opacity 0
          '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
        }}
      >
        Developed by JeoTronix Technologies Limited
      </Typography>
    </Box>
  );
};

export default SplashScreen;
