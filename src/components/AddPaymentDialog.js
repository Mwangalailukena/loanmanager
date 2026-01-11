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
  InputAdornment,
  MenuItem,
} from '@mui/material';
import { useFirestore } from '../contexts/FirestoreProvider';

export default function AddPaymentDialog({ open, onClose, loanId }) {
  const { addPayment, loans, borrowers } = useFirestore();

  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Use the passed loanId or the one selected in the dialog
  const activeLoanId = loanId || selectedLoanId;
  const loan = loans.find(l => l.id === activeLoanId);
  const outstandingBalance = loan ? (Number(loan.totalRepayable) - Number(loan.repaidAmount || 0)) : 0;

  const handleSubmit = async () => {
    setError('');
    const amount = parseFloat(paymentAmount);

    if (!activeLoanId) {
      setError('Please select a loan.');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    if (amount > outstandingBalance + 0.01) {
      setError(`Amount cannot be more than the outstanding balance of ZMW ${outstandingBalance.toLocaleString()}.`);
      return;
    }

    setLoading(true);
    try {
      await addPayment(activeLoanId, amount);
      handleClose();
    } catch (err) {
      console.error('Failed to add payment:', err);
      setError('Failed to add payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentAmount('');
    setSelectedLoanId(null);
    setError('');
    onClose();
  };

  // Only show selection if loanId wasn't passed as a prop
  const showSelection = !loanId;
  const activeLoans = loans.filter(l => (Number(l.totalRepayable) - Number(l.repaidAmount || 0)) > 0);

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 3 } }} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight="bold">Record Payment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ py: 1.5 }}>
          {showSelection && (
            <TextField
              select
              label="Select Active Loan"
              value={selectedLoanId || ''}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              fullWidth
              disabled={loading}
            >
              {activeLoans.map((l) => {
                const b = borrowers.find(borrower => borrower.id === l.borrowerId);
                const bal = Number(l.totalRepayable) - Number(l.repaidAmount || 0);
                return (
                  <MenuItem key={l.id} value={l.id}>
                    {b?.name || 'Unknown'} - ZMW {bal.toLocaleString()} (Due: {l.dueDate})
                  </MenuItem>
                );
              })}
              {activeLoans.length === 0 && <MenuItem disabled>No active loans found</MenuItem>}
            </TextField>
          )}

          {loan && (
            <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
              <Typography variant="caption" display="block">Borrower: <strong>{borrowers.find(b => b.id === loan.borrowerId)?.name}</strong></Typography>
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
            disabled={loading || (!loan && showSelection)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button 
                    size="small" 
                    onClick={() => setPaymentAmount(outstandingBalance.toFixed(2))}
                    sx={{ whiteSpace: 'nowrap', minWidth: 'fit-content' }}
                    disabled={!loan}
                  >
                    Full
                  </Button>
                </InputAdornment>
              )
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="secondary"
          disabled={loading || !paymentAmount || (!loan && showSelection)}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Processing...' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}