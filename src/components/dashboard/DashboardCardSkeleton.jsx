import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

const DashboardCardSkeleton = () => {
  return (
    <Card>
      <CardContent>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid>
            <Skeleton variant="circular" width={32} height={32} />
          </Grid>
          <Grid>
             <Skeleton variant="text" width={80} />
          </Grid>
        </Grid>
        <Box mt={1}>
          <Skeleton variant="rectangular" width="60%" height={28} />
        </Box>
        <Box mt={1}>
          <Skeleton variant="text" width="40%" />
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCardSkeleton;
