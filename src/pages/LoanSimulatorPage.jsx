import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useCreditScore } from '../hooks/useCreditScore';
import dayjs from 'dayjs';

export default function LoanSimulatorPage() {
  const { settings, loans: existingLoans } = useFirestore();
  const [principal, setPrincipal] = useState(1000);
  const [duration, setDuration] = useState(1);

  const currentMonthYear = dayjs().format("YYYY-MM");
  const monthlySettings = settings?.monthlySettings?.[currentMonthYear];

  const effectiveInterestRates = monthlySettings?.interestRates || {
    oneWeek: 0.15,
    twoWeeks: 0.2,
    threeWeeks: 0.3,
    fourWeeks: 0.3,
  };

  const interestRateKey = {
    1: 'oneWeek',
    2: 'twoWeeks',
    3: 'threeWeeks',
    4: 'fourWeeks',
  }[duration];

  const selectedInterestRate = (effectiveInterestRates[interestRateKey] || 0) / 100;

  const interest = principal * selectedInterestRate;
  const totalRepayable = principal + interest;

  const simulatedLoan = useMemo(() => ({
    principal,
    interest,
    totalRepayable,
    interestDuration: duration,
    startDate: dayjs().format('YYYY-MM-DD'),
    dueDate: dayjs().add(duration, 'week').format('YYYY-MM-DD'),
    status: 'Active',
    repaidAmount: 0,
    createdAt: dayjs().toDate(),
    updatedAt: dayjs().toDate(),
  }), [principal, duration, interest, totalRepayable]);

  const hypotheticalLoans = useMemo(() => [
    ...existingLoans,
    simulatedLoan,
  ], [existingLoans, simulatedLoan]);

  const { score: hypotheticalScore, remarks: hypotheticalRemarks } = useCreditScore(hypotheticalLoans);

  return (
    <Paper sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 3, borderRadius: 3 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Loan Simulator
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography gutterBottom>Loan Amount (ZMW)</Typography>
          <Slider
            value={principal}
            onChange={(e, newValue) => setPrincipal(newValue)}
            aria-labelledby="loan-amount-slider"
            valueLabelDisplay="auto"
            step={100}
            marks
            min={100}
            max={10000}
          />
          <TextField
            fullWidth
            variant="outlined"
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Loan Duration</InputLabel>
            <Select
              value={duration}
              label="Loan Duration"
              onChange={(e) => setDuration(e.target.value)}
            >
              <MenuItem value={1}>1 Week ({((effectiveInterestRates.oneWeek)).toFixed(0)}%)</MenuItem>
              <MenuItem value={2}>2 Weeks ({((effectiveInterestRates.twoWeeks)).toFixed(0)}%)</MenuItem>
              <MenuItem value={3}>3 Weeks ({((effectiveInterestRates.threeWeeks)).toFixed(0)}%)</MenuItem>
              <MenuItem value={4}>4 Weeks ({((effectiveInterestRates.fourWeeks)).toFixed(0)}%)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">Results</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography>Interest: ZMW {interest.toFixed(2)}</Typography>
            <Typography>Total Repayable: ZMW {totalRepayable.toFixed(2)}</Typography>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">What If Scenario (Credit Score)</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography>Hypothetical Credit Score: {hypotheticalScore} ({hypotheticalRemarks})</Typography>
            <Typography variant="body2" color="text.secondary">
              This is your estimated credit score if you were to take out this loan and repay it on time.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
