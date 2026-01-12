import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  Typography,
  Paper,
  alpha,
  useTheme,
  Divider
} from '@mui/material';

export default function TopUpLoanDialog({ open, onClose, onConfirm, loading, loan }) {
  const theme = useTheme();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const topUpAmount = parseFloat(amount);
    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      setError('Please enter a valid top-up amount.');
      return;
    }
    onConfirm(topUpAmount);
  };

  const handleClose = () => {
    if (loading) return;
    setAmount('');
    setError('');
    onClose();
  };

  // Calculations for Preview
  const topUpVal = parseFloat(amount) || 0;
  const currentPrincipal = Number(loan?.principal || 0);
  const currentInterest = Number(loan?.interest || 0);
  
  // Effective rate based on existing loan ratio
  const effectiveRate = currentPrincipal > 0 ? (currentInterest / currentPrincipal) : 0;
  
  const newPrincipal = currentPrincipal + topUpVal;
  const newInterest = newPrincipal * effectiveRate;
  const newTotalRepayable = newPrincipal + newInterest;
  const additionalInterest = newInterest - currentInterest;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Loan Top-up</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
           Enter the amount to add to the existing principal. The interest will be recalculated using the existing rate ({(effectiveRate * 100).toFixed(1)}%).
        </Typography>
        
        <TextField
          autoFocus
          margin="dense"
          label="Top-up Amount"
          type="number"
          fullWidth
          variant="outlined"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (error) setError('');
          }}
          error={!!error}
          helperText={error}
          InputProps={{
            startAdornment: <InputAdornment position="start">ZMW</InputAdornment>,
          }}
          sx={{ mb: 2 }}
        />

        {loan && (
          <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05), borderLeft: `4px solid ${theme.palette.secondary.main}` }}>
             <Stack spacing={1}>
                 <Stack direction="row" justifyContent="space-between">
                     <Typography variant="caption" color="text.secondary">New Principal</Typography>
                     <Typography variant="body2" fontWeight="bold">ZMW {newPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                 </Stack>
                 <Stack direction="row" justifyContent="space-between">
                     <Typography variant="caption" color="text.secondary">Additional Interest</Typography>
                     <Typography variant="body2" fontWeight="bold" color="secondary.main">+ ZMW {additionalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                 </Stack>
                 <Divider sx={{ my: 0.5 }} />
                 <Stack direction="row" justifyContent="space-between">
                     <Typography variant="caption" color="text.secondary">New Total Repayable</Typography>
                     <Typography variant="h6" fontWeight="bold">ZMW {newTotalRepayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                 </Stack>
             </Stack>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={loading} variant="contained" color="primary">
          {loading ? <CircularProgress size={24} /> : 'Confirm Top-up'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}