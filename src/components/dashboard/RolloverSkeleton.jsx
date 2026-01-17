import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

const RolloverSkeleton = () => {
  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Skeleton variant="text" width="40%" height={24} />
        <Skeleton variant="text" width="70%" height={20} />
      </Box>
      <Skeleton variant="rectangular" width={120} height={32} borderRadius={1} />
    </Paper>
  );
};

export default RolloverSkeleton;
