import React from 'react';
import { Card, CardContent, Grid, Skeleton, Box } from '@mui/material';

const DashboardCardSkeleton = () => {
  return (
    <Card>
      <CardContent>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Skeleton variant="circular" width={32} height={32} />
          </Grid>
          <Grid item>
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
