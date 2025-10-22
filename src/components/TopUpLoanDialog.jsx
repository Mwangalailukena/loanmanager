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
} from '@mui/material';

export default function TopUpLoanDialog({ open, onClose, onConfirm, loading }) {
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Loan Top-up</DialogTitle>
      <DialogContent>
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
        />
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
