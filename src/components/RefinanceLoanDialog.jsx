import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  alpha,
  Paper,
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import dayjs from "dayjs";

const interestOptions = [
  { label: "1 Week", value: 1 },
  { label: "2 Weeks", value: 2 },
  { label: "3 Weeks", value: 3 },
  { label: "4 Weeks", value: 4 },
];

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
  const { refinanceLoan, settings } = useFirestore();

  const [isManual, setIsManual] = useState(false);
  const [principal, setPrincipal] = useState("");
  const [interestDuration, setInterestDuration] = useState(1);
  const [manualInterestRate, setManualInterestRate] = useState(""); // In percentage
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dueDate, setDueDate] = useState("");
  const [isRefinancing, setIsRefinancing] = useState(false);
  const [error, setError] = useState("");

  const outstandingBalance = loan ? (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0)) : 0;

  const getInterestRatesForDate = useCallback((dateStr) => {
    const monthKey = dateStr ? dayjs(dateStr).format('YYYY-MM') : dayjs().format('YYYY-MM');
    return settings?.monthlySettings?.[monthKey]?.interestRates || settings.interestRates || { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 };
  }, [settings]);

  useEffect(() => {
    if (open && loan) {
      setPrincipal(outstandingBalance.toFixed(2));
      setStartDate(dayjs().format("YYYY-MM-DD"));
      
      const wasManual = !!loan.manualInterestRate;
      setIsManual(wasManual);

      if (wasManual) {
          setManualInterestRate(loan.manualInterestRate);
          setDueDate(dayjs().add(loan.interestDuration || 1, 'week').format("YYYY-MM-DD"));
      } else {
          setInterestDuration(loan.interestDuration || 1);
          setDueDate(dayjs().add(loan.interestDuration || 1, 'week').format("YYYY-MM-DD"));
      }
      
      setError("");
    }
  }, [open, loan, outstandingBalance]);

  const handleAutoDurationChange = (duration) => {
      setInterestDuration(duration);
      setDueDate(dayjs(startDate).add(duration, 'week').format("YYYY-MM-DD"));
  };

  const handleSubmit = async () => {
    if (!startDate || !dueDate || !principal || Number(principal) <= 0) {
      setError("Principal, start date, and due date are required.");
      return;
    }

    setIsRefinancing(true);
    try {
      const rateDecimal = isManual ? (Number(manualInterestRate) / 100) : null;
      const duration = isManual ? null : interestDuration;
      
      await refinanceLoan(
        loan.id,
        startDate,
        dueDate,
        parseFloat(principal),
        duration,
        rateDecimal
      );
      onClose();
    } catch (err) {
      console.error("Error refinancing loan:", err);
      setError(err.message || "Failed to refinance loan. Please try again.");
    } finally {
      setIsRefinancing(false);
    }
  };

  const currentRates = useMemo(() => getInterestRatesForDate(startDate), [startDate, getInterestRatesForDate]);
  
  const previewPrincipal = Number(principal) || 0;
  const previewInterest = isManual 
    ? (previewPrincipal * (Number(manualInterestRate) / 100))
    : (previewPrincipal * (currentRates[interestDuration] || 0));
  const previewTotal = previewPrincipal + previewInterest;

  const textFieldStyles = getTextFieldStyles(theme);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight="bold">Refinance Loan</DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Stack spacing={2} mt={1}>
          {loan && (
            <Alert severity="info" sx={{ mb: 1 }}>
                Outstanding Balance to Refinance: <strong>ZMW {outstandingBalance.toFixed(2)}</strong>
            </Alert>
          )}

          <Tabs
            value={isManual ? 1 : 0}
            onChange={(_, v) => setIsManual(v === 1)}
            variant="fullWidth"
            sx={{ mb: 1, borderBottom: 1, borderColor: 'divider', minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 1 } }}
          >
            <Tab label="Auto Plan" />
            <Tab label="Manual Entry" />
          </Tabs>

          <TextField
            label="Refinance Principal"
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            size="small"
            fullWidth
            sx={textFieldStyles}
            InputProps={{
              startAdornment: (<InputAdornment position="start">ZMW</InputAdornment>),
            }}
          />

          {!isManual ? (
            <FormControl size="small" fullWidth sx={textFieldStyles}>
              <InputLabel>Interest Duration</InputLabel>
              <Select
                value={interestDuration}
                label="Interest Duration"
                onChange={(e) => handleAutoDurationChange(e.target.value)}
              >
                {interestOptions.map((option) => {
                  const rate = (currentRates[option.value] || 0) * 100;
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label} ({rate.toFixed(0)}%)
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          ) : (
            <TextField
              label="New Interest Rate (%)"
              type="number"
              value={manualInterestRate}
              onChange={(e) => setManualInterestRate(e.target.value)}
              size="small"
              fullWidth
              sx={textFieldStyles}
              InputProps={{
                endAdornment: (<InputAdornment position="end">%</InputAdornment>),
              }}
            />
          )}

          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => {
                setStartDate(e.target.value);
                if (!isManual) {
                    setDueDate(dayjs(e.target.value).add(interestDuration, 'week').format("YYYY-MM-DD"));
                }
            }}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={textFieldStyles}
          />

          <TextField
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={textFieldStyles}
            disabled={!isManual} // Auto mode locks due date to duration
          />

          <Paper sx={{ p: 2, mt: 1, bgcolor: alpha(theme.palette.secondary.main, 0.05), borderLeft: `4px solid ${theme.palette.secondary.main}` }}>
               <Stack direction="row" justifyContent="space-between" alignItems="center">
                   <Box>
                       <Typography variant="caption" color="text.secondary">New Interest</Typography>
                       <Typography variant="body1" fontWeight="bold">ZMW {previewInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                   </Box>
                   <Box textAlign="right">
                       <Typography variant="caption" color="text.secondary">New Total Due</Typography>
                       <Typography variant="h6" fontWeight="bold" color="secondary.main">ZMW {previewTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                   </Box>
               </Stack>
          </Paper>

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
          {isRefinancing ? 'Refinancing...' : 'Refinance Loan'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}