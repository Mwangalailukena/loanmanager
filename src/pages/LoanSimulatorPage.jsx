import React, { useState } from 'react';
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

export default function LoanSimulatorPage() {
  const { settings } = useFirestore();
  const [principal, setPrincipal] = useState(1000);
  const [duration, setDuration] = useState(1);

  const interestRates = settings.interestRates || {
    1: 0.15,
    2: 0.2,
    3: 0.3,
    4: 0.3,
  };

  const interest = principal * (interestRates[duration] || 0);
  const totalRepayable = principal + interest;

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
              <MenuItem value={1}>1 Week</MenuItem>
              <MenuItem value={2}>2 Weeks</MenuItem>
              <MenuItem value={3}>3 Weeks</MenuItem>
              <MenuItem value={4}>4 Weeks</MenuItem>
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
      </Grid>
    </Paper>
  );
}
