// src/components/SplashScreen.jsx
import React, { useState, useEffect } from 'react';
import { Box, LinearProgress, Typography, keyframes } from '@mui/material';

// --- Animations ---
// ... (fadeIn, pulse, reveal, etc.)

// NEW: An animation for the logo to exit
const scaleOut = keyframes`
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.8); opacity: 0; }
`;

// Keep the original fadeOut for the screen itself
const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; visibility: hidden; }
`;


const SplashScreen = ({ isLoaded }) => {
  const [dots, setDots] = useState('');
  // NEW STATE: To control the exit animation sequence
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      // When loading is done, start the exit sequence
      setIsExiting(true);
    }
  }, [isLoaded]);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 500);
    return () => clearInterval(dotTimer);
  }, []);

  return (
    <Box
      sx={{
        // ... (all your existing background and layout styles)
        // UPDATED: The main screen's fade-out is now triggered by 'isExiting'
        // and is delayed to let the logo finish its animation.
        animation: isExiting ? `${fadeOut} 0.5s ease-out forwards` : 'none',
        animationDelay: isExiting ? '0.4s' : '0s',
      }}
    >
      <Box
        component="img"
        src="/android/android-launchericon-512-512.png"
        alt="Your App Logo"
        sx={{
          // ... (existing styles)
          // UPDATED: Apply the exit animation when isExiting is true
          animation: isExiting
            ? `${scaleOut} 0.5s ease-in forwards`
            : `${fadeIn} 0.8s ease forwards, ${pulse} 2s ease-in-out infinite`,
        }}
      />

      {/* The rest of the content can just fade with the screen, no change needed */}
      <Typography /* ... */ >
        Loading your application{dots}
      </Typography>
      <LinearProgress /* ... */ />
      <Typography /* ... */ >
        Developed by JeoTronix Technologies Limited
      </Typography>
    </Box>
  );
};

export default SplashScreen;

