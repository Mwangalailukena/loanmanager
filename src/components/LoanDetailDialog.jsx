// src/components/LoanDetailDialog.jsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Stack,
  Chip,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import dayjs from "dayjs";

// A reusable dialog component to show a single loan's details
export default function LoanDetailDialog({ open, onClose, loanId }) {
  // --- This is the only line that needs to change ---
  // We're removing `loadingLoans` because it's not used.
  const { loans, markLoanAsDefaulted } = useFirestore(); 
  // ----------------------------------------------------

  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDefaultOpen, setConfirmDefaultOpen] = useState(false);
  const [isMarkingDefault, setIsMarkingDefault] = useState(false);

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
    if (loan.status === "Defaulted") return "Defaulted";
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
      case "defaulted":
        return { label: "Defaulted", color: "warning" };
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
        {error ? (
          <Typography variant="body1" color="error" align="center" sx={{ py: 4 }}>
            {error}
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Borrower Name</Typography>
              <Typography variant="body1">
                {loading ? <Skeleton width="60%" /> : (loan?.borrower || "Unknown")}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Phone Number</Typography>
              <Typography variant="body1">
                {loading ? <Skeleton width="40%" /> : (loan?.phone || "N/A")}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Principal Amount</Typography>
              <Typography variant="body1">
                {loading ? <Skeleton width="30%" /> : `ZMW ${Number(loan?.principal || 0).toFixed(2)}`}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Repayable</Typography>
              <Typography variant="body1">
                {loading ? <Skeleton width="30%" /> : `ZMW ${Number(loan?.totalRepayable || 0).toFixed(2)}`}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Outstanding Amount</Typography>
              <Typography variant="body1" fontWeight="bold">
                {loading ? <Skeleton width="30%" /> : `ZMW ${(Number(loan?.totalRepayable || 0) - Number(loan?.repaidAmount || 0)).toFixed(2)}`}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Start Date</Typography>
              <Typography variant="body1">
                {loading ? <Skeleton width="40%" /> : (loan?.startDate || "N/A")}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Due Date</Typography>
              <Typography variant="body1">
                {loading ? <Skeleton width="40%" /> : (loan?.dueDate || "N/A")}
              </Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setConfirmDefaultOpen(true)}
          color="warning"
          disabled={calcStatus(loan) === "Paid" || calcStatus(loan) === "Defaulted"}
        >
          Mark as Defaulted
        </Button>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>

      {/* Confirmation Dialog for Defaulting */}
      <Dialog 
        open={confirmDefaultOpen} 
        onClose={() => setConfirmDefaultOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Default</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to mark this loan as <strong>Defaulted</strong>? This action will change the loan status and should only be done if the borrower is unable to repay.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDefaultOpen(false)} disabled={isMarkingDefault}>Cancel</Button>
          <Button 
            onClick={async () => {
              setIsMarkingDefault(true);
              try {
                await markLoanAsDefaulted(loanId);
                setConfirmDefaultOpen(false);
                onClose();
              } catch (err) {
                console.error("Error marking as defaulted:", err);
              } finally {
                setIsMarkingDefault(false);
              }
            }} 
            color="error" 
            variant="contained"
            disabled={isMarkingDefault}
          >
            {isMarkingDefault ? <CircularProgress size={20} color="inherit" /> : "Confirm Default"}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
