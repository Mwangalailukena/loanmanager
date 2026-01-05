
import React, { useState } from 'react';
import { Box, Typography, TextField, Grid, Paper } from '@mui/material';
import { useFirestore } from '../contexts/FirestoreProvider';
import { usePortfolioCalculations } from '../hooks/dashboard/usePortfolioCalculations';
import dayjs from 'dayjs';

export default function PortfolioView() {
  const { loans } = useFirestore();
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'year').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  const portfolioData = usePortfolioCalculations(loans, startDate, endDate);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Portfolio View</Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid xs={6}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid xs={6}>
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      {portfolioData && (
        <Grid container spacing={2}>
          <Grid xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Global Metrics</Typography>
              <Typography>Total Disbursed: {portfolioData.totalDisbursed}</Typography>
              <Typography>Total Collected: {portfolioData.totalCollected}</Typography>
              <Typography>Total Outstanding: {portfolioData.totalOutstanding}</Typography>
              <Typography>Average Loan Size: {portfolioData.averageLoanSize}</Typography>
              <Typography>Average Loan Duration: {portfolioData.averageLoanDuration}</Typography>
            </Paper>
          </Grid>
          <Grid xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Portfolio Health</Typography>
              <Typography>Portfolio Yield (Annualized): {portfolioData.portfolioYield}</Typography>
              <Typography>Repayment Rate: {portfolioData.repaymentRate}</Typography>
              <Typography>Default Rate: {portfolioData.defaultRate}</Typography>
            </Paper>
          </Grid>
          <Grid xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Risks</Typography>
              <Typography>Number of Overdue Loans: {portfolioData.numberOfOverdueLoans}</Typography>
              <Typography>Value of Overdue Loans: {portfolioData.valueOfOverdueLoans}</Typography>
              <Typography>Overdue Breakdown:</Typography>
              <Typography>1-30 days: {portfolioData.overdueBreakdown['1-30']}</Typography>
              <Typography>31-60 days: {portfolioData.overdueBreakdown['31-60']}</Typography>
              <Typography>60+ days: {portfolioData.overdueBreakdown['60+']}</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
