import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  useTheme,
  Divider,
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import dayjs from "dayjs";

const getTextFieldStyles = (theme) => ({
  "& .MuiOutlinedInput-root": {
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.secondary.main,
    },
    "& .MuiInputBase-input": { padding: "10px 12px", fontSize: "0.875rem" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.secondary.main },
  "& .MuiInputLabel-root": { fontSize: "0.875rem", transform: "translate(12px, 12px) scale(1)" },
  "& .MuiInputLabel-shrink": { transform: "translate(12px, -9px) scale(0.75)" },
  "& .MuiFormHelperText-root": { fontSize: "0.75rem" },
});

export default function RefinanceLoanDialog({ open, onClose, loan }) {
  const theme = useTheme();
  const { refinanceLoan } = useFirestore();

  const [refinancePrincipal, setRefinancePrincipal] = useState("");
  const [refinanceInterestRate, setRefinanceInterestRate] = useState(""); // In percentage
  const [refinanceStartDate, setRefinanceStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [refinanceDueDate, setRefinanceDueDate] = useState("");
  const [isRefinancing, setIsRefinancing] = useState(false);
  const [error, setError] = useState("");

  const outstandingBalance = loan ? (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0)) : 0;
  const originalRate = loan ? ((Number(loan.interest || 0) / Number(loan.principal || 1)) * 100) : 0;

  useEffect(() => {
    if (open && loan) {
      // Default suggested principal to the outstanding amount
      setRefinancePrincipal(outstandingBalance.toFixed(2));
      setRefinanceInterestRate(originalRate.toFixed(2));
      setRefinanceStartDate(dayjs().format("YYYY-MM-DD"));
      
      // Default due date to same duration as before
      const duration = loan.interestDuration || 1;
      setRefinanceDueDate(dayjs().add(duration, 'week').format("YYYY-MM-DD"));
      
      setError("");
    }
  }, [open, loan, originalRate, outstandingBalance]);

  const handleSubmit = async () => {
    if (!refinanceStartDate || !refinanceDueDate || !refinancePrincipal || Number(refinancePrincipal) <= 0) {
      setError("Principal, start date, and due date are required.");
      return;
    }

    setIsRefinancing(true);
    try {
      // Calculate rate as decimal
      const rateDecimal = Number(refinanceInterestRate) / 100;
      
      await refinanceLoan(
        loan.id,
        refinanceStartDate,
        refinanceDueDate,
        parseFloat(refinancePrincipal),
        null, // No preset duration
        rateDecimal // Pass manual rate
      );
      onClose();
    } catch (err) {
      console.error("Error refinancing loan:", err);
      setError(err.message || "Failed to refinance loan. Please try again.");
    } finally {
      setIsRefinancing(false);
    }
  };

  const textFieldStyles = getTextFieldStyles(theme);

  // Preview calculations
  const previewPrincipal = Number(refinancePrincipal) || 0;
  const previewInterest = previewPrincipal * (Number(refinanceInterestRate) / 100);
  const previewTotal = previewPrincipal + previewInterest;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight="bold">Refinance Loan</DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Stack spacing={2} mt={1}>
          {loan && (
            <Box>
              <Alert severity="info" sx={{ mb: 1 }}>
                <Typography variant="body2">Outstanding Balance: <strong>ZMW {outstandingBalance.toFixed(2)}</strong></Typography>
                <Typography variant="body2">Original Interest Rate: <strong>{originalRate.toFixed(2)}%</strong></Typography>
              </Alert>
            </Box>
          )}

          <TextField
            label="New Principal"
            type="number"
            value={refinancePrincipal}
            onChange={(e) => setRefinancePrincipal(e.target.value)}
            size="small"
            fullWidth
            sx={textFieldStyles}
            InputProps={{
              startAdornment: (<InputAdornment position="start">ZMW</InputAdornment>),
            }}
            helperText={`Defaults to Outstanding Balance (ZMW ${outstandingBalance.toFixed(2)})`}
          />

          <TextField
            label="New Interest Rate (%)"
            type="number"
            value={refinanceInterestRate}
            onChange={(e) => setRefinanceInterestRate(e.target.value)}
            size="small"
            fullWidth
            sx={textFieldStyles}
            InputProps={{
              endAdornment: (<InputAdornment position="end">%</InputAdornment>),
            }}
            helperText={`Defaults to Original Rate (${originalRate.toFixed(2)}%)`}
          />

          <TextField
            label="New Start Date"
            type="date"
            value={refinanceStartDate}
            onChange={(e) => setRefinanceStartDate(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={textFieldStyles}
          />

          <TextField
            label="New Due Date"
            type="date"
            value={refinanceDueDate}
            onChange={(e) => setRefinanceDueDate(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={textFieldStyles}
          />

          <Divider />

          <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.900', borderRadius: 1, borderLeft: `4px solid ${theme.palette.secondary.main}` }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">New Loan Preview</Typography>
            <Typography variant="body2">Principal: ZMW {previewPrincipal.toFixed(2)}</Typography>
            <Typography variant="body2">Interest: ZMW {previewInterest.toFixed(2)}</Typography>
            <Typography variant="body2" fontWeight="bold">Total Repayable: ZMW {previewTotal.toFixed(2)}</Typography>
          </Box>

          {error && <Typography variant="caption" color="error">{error}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} disabled={isRefinancing}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isRefinancing}
          color="secondary"
          startIcon={isRefinancing && <CircularProgress size={20} color="inherit" />}
        >
          {isRefinancing ? 'Refinancing...' : 'Refinance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
