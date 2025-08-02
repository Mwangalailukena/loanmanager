// src/components/SplashScreen.jsx
import React, { useState, useEffect } from 'react';
import { Box, LinearProgress, Typography, keyframes, useTheme, Paper } from '@mui/material'; // <-- Add Paper here

// Define keyframe animations
const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    visibility: hidden;
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const SplashScreen = ({ onFadeOutComplete, duration = 3000 }) => {
  const theme = useTheme();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const intervalTime = duration / 100;
    let currentProgress = 0;

    const timer = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(timer);
      }
    }, intervalTime);

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
      {/* Use Paper to create a card-like container for the splash screen content */}
      <Paper
        elevation={3} // Adjust the shadow depth (0-24)
        sx={{
          padding: { xs: 4, md: 6 }, // Use responsive padding
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '16px', // Rounded corners
          backgroundColor: theme.palette.background.paper, // Use the paper background color
          width: { xs: '90%', sm: 'auto' }, // Make it responsive
          maxWidth: '500px', // Set a max-width
        }}
      >
        <Box
          component="img"
          src="/android/android-launchericon-512-512.png"
          alt="Your App Logo"
          sx={{
            maxWidth: '200px',
            maxHeight: '200px',
            mb: 4,
            animation: `${pulse} 1.5s infinite ease-in-out`,
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
              '100%': { transform: 'scale(1)' },
            },
          }}
        />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Loading your application...
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            width: '100%', // Use 100% width of the Paper container
            height: 8,
            borderRadius: 5,
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              backgroundColor: theme.palette.primary.main,
            },
          }}
        />
      </Paper>

      {/* Credit text positioned absolutely at the bottom */}
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{
          position: 'absolute',
          bottom: theme.spacing(2),
          width: '100%',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        Developed by JeoTronix Technologies Limited
      </Typography>
    </Box>
  );
};

export default SplashScreen;
