// src/pages/AddPaymentPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
} from "@mui/material";
// Removed DatePicker related imports
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useFirestore } from "../contexts/FirestoreProvider";
import { toast } from "react-toastify";
import dayjs from "dayjs"; // Still needed for internal date handling and display

export default function AddPaymentPage() {
  const { loans, addPayment, loadingLoans } = useFirestore();

  const [selectedLoan, setSelectedLoan] = useState(null); // This will hold the loan object
  const [paymentAmount, setPaymentAmount] = useState("");
  // Removed paymentDate state: const [paymentDate, setPaymentDate] = useState(dayjs());
  const [generalError, setGeneralError] = useState(""); // General form error
  const [fieldErrors, setFieldErrors] = useState({}); // Specific field errors
  const [loading, setLoading] = useState(false); // For form submission
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // Filter active loans for selection
  const activeLoans = useMemo(() => {
    return loans.filter(loan => loan.status === "Active");
  }, [loans]);

  // Handle errors for specific fields
  const setFieldError = (field, message) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  };

  const clearFieldError = (field) => {
    setFieldErrors(prev => {
      const newState = { ...prev };
      delete newState[field];
      return newState;
    });
  };

  // Reset errors when relevant fields change
  useEffect(() => { clearFieldError('loan'); setGeneralError(''); }, [selectedLoan]);
  useEffect(() => { clearFieldError('amount'); setGeneralError(''); }, [paymentAmount]);
  // Removed useEffect for paymentDate: useEffect(() => { setGeneralError(''); }, [paymentDate]);

  const validateForm = () => {
    let isValid = true;
    setFieldErrors({}); // Clear all previous field errors
    setGeneralError("");

    if (!selectedLoan) {
      setFieldError('loan', "Please select a borrower/loan.");
      isValid = false;
    }

    const numPaymentAmount = Number(paymentAmount);
    if (isNaN(numPaymentAmount) || numPaymentAmount <= 0) {
      setFieldError('amount', "Payment amount must be a valid positive number.");
      isValid = false;
    } else if (selectedLoan) {
      const remainingBalance = selectedLoan.totalRepayable - (selectedLoan.repaidAmount || 0);
      // Allow a tiny tolerance for floating point arithmetic, e.g., 0.0001
      if (numPaymentAmount > remainingBalance + 0.0001) {
        setFieldError('amount', `Payment (ZMW ${numPaymentAmount.toFixed(2)}) exceeds remaining balance (ZMW ${remainingBalance.toFixed(2)}).`);
        isValid = false;
      }
    }

    return isValid;
  };

  const handleOpenConfirmation = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setOpenConfirmDialog(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setOpenConfirmDialog(false); // Close confirmation dialog
    setLoading(true);

    try {
      const numPaymentAmount = Number(paymentAmount);
      // Call addPayment without paymentDate, it will default to current date
      await addPayment(selectedLoan.id, numPaymentAmount);

      toast.success(`Payment of ZMW ${numPaymentAmount.toFixed(2).toLocaleString()} added for ${selectedLoan.borrower}!`);

      // Reset form
      setSelectedLoan(null);
      setPaymentAmount("");
      // Removed paymentDate reset: setPaymentDate(dayjs());
      setFieldErrors({}); // Clear all errors
      setGeneralError("");

    } catch (err) {
      console.error("Payment submission failed:", err);
      setGeneralError("Failed to add payment. Please try again.");
      toast.error(`Failed to add payment: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  // Calculate and display remaining balance for the selected loan
  const currentRepaid = selectedLoan ? (selectedLoan.repaidAmount || 0) : 0;
  const remainingBalance = selectedLoan ? selectedLoan.totalRepayable - currentRepaid : 0;
  const prospectiveRemaining = remainingBalance - Number(paymentAmount || 0);

  return (
    // LocalizationProvider is no longer strictly needed without DatePicker,
    // but can be kept if other date components are used elsewhere or for future plans.
    // For now, I'll remove it as it's directly tied to DatePicker.
    <Box maxWidth={500} mx="auto" mt={3} p={2}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Add Payment
      </Typography>

      {generalError && (
        <Alert severity="error" onClose={() => setGeneralError("")} sx={{ mb: 2 }}>
          {generalError}
        </Alert>
      )}

      <form onSubmit={handleOpenConfirmation}>
        <Stack spacing={2}>
          {/* Borrower/Loan Search and Selection */}
          <Autocomplete
            id="loan-borrower-search"
            options={activeLoans}
            getOptionLabel={(option) =>
              `${option.borrower} (Phone: ${option.phone}, Loan: ZMW ${option.principal.toLocaleString()})`
            }
            value={selectedLoan}
            onChange={(event, newValue) => {
              setSelectedLoan(newValue);
            }}
            loading={loadingLoans}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Borrower (Name or Phone)"
                placeholder="e.g., John Doe or 097xxxxxxx"
                required
                error={!!fieldErrors.loan}
                helperText={fieldErrors.loan || (loadingLoans ? "Loading loans..." : "")}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loadingLoans ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options, { inputValue }) => {
              const search = inputValue.toLowerCase();
              return options.filter(option =>
                option.borrower.toLowerCase().includes(search) ||
                option.phone.includes(search)
              );
            }}
            noOptionsText="No active loans found for this search."
          />

          {/* Display Loan Details if selected */}
          {selectedLoan && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                **Selected Loan Details:**
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Borrower: **{selectedLoan.borrower}** (Phone: {selectedLoan.phone})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Principal: **ZMW {selectedLoan.principal.toFixed(2).toLocaleString()}**
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Repayable: **ZMW {selectedLoan.totalRepayable.toFixed(2).toLocaleString()}**
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Already Repaid: **ZMW {currentRepaid.toFixed(2).toLocaleString()}**
              </Typography>
              <Typography variant="body1" fontWeight="bold" color={remainingBalance <= 0.01 ? "success.main" : "error.main"}>
                Remaining Balance: **ZMW {remainingBalance.toFixed(2).toLocaleString()}**
              </Typography>
            </Paper>
          )}

          <TextField
            label="Payment Amount (ZMW)"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            type="number"
            inputProps={{ min: 0.01, step: "0.01" }}
            fullWidth
            required
            error={!!fieldErrors.amount}
            helperText={fieldErrors.amount}
            disabled={!selectedLoan || loading} // Disable if no loan selected or loading
          />

          {/* Prospective remaining balance */}
          {selectedLoan && parseFloat(paymentAmount) > 0 && (
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px dashed grey.300' }}>
              <Typography variant="body2" color="text.secondary">
                After this payment, **{selectedLoan.borrower}'s** loan balance will be:
              </Typography>
              <Typography variant="body1" fontWeight="bold" color={prospectiveRemaining <= 0.01 ? "success.main" : "text.primary"}>
                **ZMW {Math.max(0, prospectiveRemaining).toFixed(2).toLocaleString()}**
                {prospectiveRemaining <= 0.01 && " (Loan will be paid in full)"}
              </Typography>
            </Box>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !selectedLoan || !paymentAmount || parseFloat(paymentAmount) <= 0}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Submitting...' : 'Add Payment'}
          </Button>
        </Stack>
      </form>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="confirm-payment-title"
        aria-describedby="confirm-payment-description"
      >
        <DialogTitle id="confirm-payment-title">{"Confirm Payment"}</DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <DialogContentText id="confirm-payment-description">
              You are about to add a payment of **ZMW {Number(paymentAmount).toFixed(2).toLocaleString()}**
              for **{selectedLoan.borrower}**'s loan.
              <br />
              The current remaining balance is **ZMW {remainingBalance.toFixed(2).toLocaleString()}**.
              <br />
              After this payment, the remaining balance will be **ZMW {Math.max(0, prospectiveRemaining).toFixed(2).toLocaleString()}**.
              {prospectiveRemaining <= 0.01 && " (This loan will be marked as Paid.)"}
              <br/><br/>
              **Confirm to proceed?**
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirmSubmit} autoFocus variant="contained" disabled={loading}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    // Removed closing LocalizationProvider tag
  );
}
