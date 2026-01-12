import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/CloseRounded';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useCreditScore } from '../hooks/useCreditScore';
import dayjs from 'dayjs';

export default function LoanSimulatorDialog({ open, onClose }) {
  const { settings, loans: existingLoans } = useFirestore();
  const [principal, setPrincipal] = useState(1000);
  const [duration, setDuration] = useState(1);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPrincipal(1000);
      setDuration(1);
    }
  }, [open]);

  const currentMonthYear = dayjs().format("YYYY-MM");
  const monthlySettings = settings?.monthlySettings?.[currentMonthYear];

  const effectiveInterestRates = monthlySettings?.interestRates || settings?.interestRates || {
    1: 0.15,
    2: 0.2,
    3: 0.3,
    4: 0.3,
  };

  const selectedInterestRate = (effectiveInterestRates[duration] || 0);

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" fontWeight="bold">
          Loan Simulator
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
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
                <MenuItem value={1}>1 Week ({((effectiveInterestRates[1] * 100) || 0).toFixed(0)}%)</MenuItem>
                <MenuItem value={2}>2 Weeks ({((effectiveInterestRates[2] * 100) || 0).toFixed(0)}%)</MenuItem>
                <MenuItem value={3}>3 Weeks ({((effectiveInterestRates[3] * 100) || 0).toFixed(0)}%)</MenuItem>
                <MenuItem value={4}>4 Weeks ({((effectiveInterestRates[4] * 100) || 0).toFixed(0)}%)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Financial Breakdown
              </Typography>
              <Grid container spacing={2}>
                 <Grid item xs={6}>
                    <Typography variant="caption" display="block">Interest</Typography>
                    <Typography variant="body1" fontWeight="bold">ZMW {interest.toFixed(2)}</Typography>
                 </Grid>
                 <Grid item xs={6}>
                    <Typography variant="caption" display="block">Total Repayable</Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">ZMW {totalRepayable.toFixed(2)}</Typography>
                 </Grid>
              </Grid>
            </Box>
          </Grid>
          <Grid item xs={12}>
             <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                   Projected Credit Score: {hypotheticalScore} ({hypotheticalRemarks})
                </Typography>
                <Typography variant="caption">
                   This score estimates the impact of taking this loan and maintaining it in good standing.
                </Typography>
             </Alert>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
