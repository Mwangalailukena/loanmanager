// src/components/AddPaymentDialog.js

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useSnackbar } from './SnackbarProvider';

export default function AddPaymentDialog({ open, onClose, loanId }) {
  const { addPayment, loans } = useFirestore();
  const showSnackbar = useSnackbar();

  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loan = loans.find(l => l.id === loanId);
  const outstandingBalance = loan ? (loan.outstandingBalance || loan.totalRepayable) : 0;

  const handleSubmit = async () => {
    setError('');
    const amount = parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    if (amount > outstandingBalance) {
      setError(`Amount cannot be more than the outstanding balance of ZMW ${outstandingBalance.toLocaleString()}.`);
      return;
    }

    setLoading(true);
    try {
      await addPayment({
        loanId: loanId,
        amount: amount,
        loanPrincipal: loan.principal, // Pass loan principal for activity log context
      });
      showSnackbar('Payment added successfully!', 'success');
      onClose();
      setPaymentAmount('');
    } catch (err) {
      console.error('Failed to add payment:', err);
      showSnackbar('Failed to add payment. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentAmount('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight="bold">Add Payment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ py: 1.5 }}>
          {loan && (
            <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
              Loan Principal: <Typography component="span" fontWeight="bold">ZMW {Number(loan.principal).toLocaleString()}</Typography><br/>
              Outstanding Balance: <Typography component="span" fontWeight="bold">ZMW {outstandingBalance.toLocaleString()}</Typography>
            </Alert>
          )}
          <TextField
            label="Payment Amount (ZMW)"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            fullWidth
            required
            error={!!error}
            helperText={error}
            disabled={loading}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="secondary"
          disabled={loading || !paymentAmount}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Adding Payment...' : 'Add Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}