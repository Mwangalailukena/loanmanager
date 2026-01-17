import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

const ChartsSkeleton = () => {
  return (
    <Paper sx={{ borderRadius: 4, p: { xs: 2, md: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ width: '40%' }}>
          <Skeleton variant="text" width="80%" height={32} />
          <Skeleton variant="text" width="60%" height={20} />
        </Box>
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rectangular" width={80} height={40} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width={80} height={40} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width={80} height={40} sx={{ borderRadius: 2 }} />
        </Stack>
      </Box>
      <Skeleton variant="rectangular" width="100%" height={350} sx={{ borderRadius: 2 }} />
    </Paper>
  );
};

export default ChartsSkeleton;
