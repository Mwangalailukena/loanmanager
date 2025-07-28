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
        animation: `${fadeOut} 0.5s ease-out forwards`, // Apply fade-out animation
        animationDelay: `${(duration / 1000) - 0.5}s`, // Start fade-out 0.5s before total duration
        '@keyframes fadeOut': { from: { opacity: 1 }, to: { opacity: 0, visibility: 'hidden' } },
      }}
      // Call callback when the fade-out animation ends
      onAnimationEnd={(e) => {
        if (e.animationName === fadeOut.name) {
          onFadeOutComplete();
        }
      }}
    >
      <Box
        component="img"
        src="/android/android-launchericon-512-512.png" // Path to your logo in the public folder
        alt="Your App Logo"
        sx={{
          maxWidth: '200px',
          maxHeight: '200px',
          mb: 4, // Increased margin-bottom for spacing with progress bar
          animation: `${pulse} 1.5s infinite ease-in-out`, // Optional pulse animation for logo
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
        variant="determinate" // Use determinate variant for controlled progress
        value={progress}
        sx={{
          width: '70%', // Width of the progress bar
          maxWidth: '400px', // Max width for larger screens
          height: 8, // Thicker progress bar
          borderRadius: 5, // Rounded corners
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
            backgroundColor: theme.palette.primary.main, // Color of the progress indicator
          },
        }}
      />
    </Box>
  );
};

export default SplashScreen;
