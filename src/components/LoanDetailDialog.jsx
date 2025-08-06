// src/components/LoanDetailDialog.jsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Stack,
  Chip,
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import dayjs from "dayjs";

// A reusable dialog component to show a single loan's details
export default function LoanDetailDialog({ open, onClose, loanId }) {
  const { loans, loadingLoans } = useFirestore();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset state when dialog is opened with a new loanId
    if (open && loanId) {
      setLoading(true);
      setError(null);
      const foundLoan = loans.find((l) => l.id === loanId);
      if (foundLoan) {
        setLoan(foundLoan);
        setLoading(false);
      } else {
        setError("Loan not found.");
        setLoading(false);
      }
    } else if (!open) {
      // Clear data when the dialog is closed
      setLoan(null);
    }
  }, [open, loanId, loans]);

  const calcStatus = (loan) => {
    if (!loan) return "Unknown";
    const totalRepayable = Number(loan.totalRepayable || 0);
    const repaidAmount = Number(loan.repaidAmount || 0);

    if (repaidAmount >= totalRepayable && totalRepayable > 0) {
      return "Paid";
    }
    const now = dayjs();
    const due = dayjs(loan.dueDate);
    if (due.isBefore(now, "day")) {
      return "Overdue";
    }
    return "Active";
  };

  const getStatusChipProps = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "paid":
        return { label: "Paid", color: "success" };
      case "overdue":
        return { label: "Overdue", color: "error" };
      case "active":
      default:
        return { label: "Active", color: "primary" };
    }
  };

  if (!loanId || (!open && !loan)) {
    return null; // Don't render if there's no loan ID or if it's closed and data is cleared
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Loan Details</Typography>
          {loan && <Chip size="small" {...getStatusChipProps(calcStatus(loan))} />}
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography variant="body1" color="error" align="center">
            {error}
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Borrower Name</Typography>
              <Typography variant="body1">{loan.borrower}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Phone Number</Typography>
              <Typography variant="body1">{loan.phone}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Principal Amount</Typography>
              <Typography variant="body1">ZMW {Number(loan.principal).toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Repayable</Typography>
              <Typography variant="body1">ZMW {Number(loan.totalRepayable).toFixed(2)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Outstanding Amount</Typography>
              <Typography variant="body1" fontWeight="bold">
                ZMW {(Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0)).toFixed(2)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Start Date</Typography>
              <Typography variant="body1">{loan.startDate}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Due Date</Typography>
              <Typography variant="body1">{loan.dueDate}</Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
