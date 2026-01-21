import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';

const InsightsSkeleton = () => {
  return (
    <Grid container spacing={2}>
      {[1, 2, 3].map((i) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
          <Card sx={{ mb: 2, borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1 }} />
                <Skeleton variant="text" width="40%" />
              </Box>
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="80%" />
              <Box mt={2}>
                <Skeleton variant="rectangular" width={100} height={30} sx={{ borderRadius: 1 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default InsightsSkeleton;
