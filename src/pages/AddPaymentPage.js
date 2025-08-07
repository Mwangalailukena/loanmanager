import React, { useState, useEffect } from "react";
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
  useTheme,
  Divider,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useFirestore } from "../contexts/FirestoreProvider";
import { toast } from "react-toastify";

const OFFLINE_PAYMENTS_KEY = "offlinePayments";

export default function AddPaymentPage() {
  const theme = useTheme();
  const { loans, addPayment, loadingLoans } = useFirestore();

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  useEffect(() => {
    async function syncOfflinePayments() {
      const savedPayments = JSON.parse(localStorage.getItem(OFFLINE_PAYMENTS_KEY) || "[]");
      if (savedPayments.length === 0) return;

      for (const payment of savedPayments) {
        try {
          await addPayment(payment.loanId, payment.amount);
          toast.success(`Offline payment of ZMW ${payment.amount.toFixed(2).toLocaleString()} synced!`);
        } catch (err) {
          toast.error(`Failed to sync offline payment for loan ID ${payment.loanId}. Will retry later.`);
          console.error("Offline payment sync error:", err);
          return;
        }
      }
      localStorage.removeItem(OFFLINE_PAYMENTS_KEY);
    }

    if (navigator.onLine) {
      syncOfflinePayments();
    }

    function handleOnline() {
      syncOfflinePayments();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [addPayment]);

  // Removed getUniqueActiveLoans as it's no longer needed.
  // The filtering is now handled directly in the Autocomplete options prop.

  const setFieldError = (field, message) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  };

  useEffect(() => { setFieldError('loan', ''); setGeneralError(''); }, [selectedLoan]);
  useEffect(() => { setFieldError('amount', ''); setGeneralError(''); }, [paymentAmount]);

  const validateForm = () => {
    let valid = true;
    const errors = {};

    if (!selectedLoan) {
      errors.loan = "Please select a borrower/loan.";
      valid = false;
    }

    const numAmount = Number(paymentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errors.amount = "Payment amount must be a valid positive number.";
      valid = false;
    } else if (selectedLoan) {
      const remainingBalance = selectedLoan.totalRepayable - (selectedLoan.repaidAmount || 0);
      if (numAmount > remainingBalance + 0.0001) {
        errors.amount = `Payment (ZMW ${numAmount.toFixed(2)}) exceeds remaining balance (ZMW ${remainingBalance.toFixed(2)}).`;
        valid = false;
      }
    }

    setFieldErrors(errors);
    return valid;
  };

  const handleOpenConfirmation = (e) => {
    e.preventDefault();
    if (validateForm()) setOpenConfirmDialog(true);
  };

  const savePaymentOffline = (loanId, amount) => {
    const offlinePayments = JSON.parse(localStorage.getItem(OFFLINE_PAYMENTS_KEY) || "[]");
    offlinePayments.push({ loanId, amount, timestamp: Date.now() });
    localStorage.setItem(OFFLINE_PAYMENTS_KEY, JSON.stringify(offlinePayments));
  };

  const handleConfirmSubmit = async () => {
    setOpenConfirmDialog(false);
    setLoading(true);

    try {
      const numAmount = Number(paymentAmount);
      
      if (!navigator.onLine) {
        savePaymentOffline(selectedLoan.id, numAmount);
        toast.info("No internet connection. Payment saved locally and will sync when online.");
      } else {
        await addPayment(selectedLoan.id, numAmount);
        toast.success(`Payment of ZMW ${numAmount.toFixed(2).toLocaleString()} added for ${selectedLoan.borrower}!`);
      }

      setSelectedLoan(null);
      setPaymentAmount("");
      setFieldErrors({});
      setGeneralError("");
    } catch (err) {
      console.error("Payment submission failed:", err);
      setGeneralError("Failed to add payment. Please try again.");
      toast.error(`Failed to add payment: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmDialog = () => setOpenConfirmDialog(false);

  const currentRepaid = selectedLoan ? selectedLoan.repaidAmount || 0 : 0;
  const remainingBalance = selectedLoan ? selectedLoan.totalRepayable - currentRepaid : 0;
  const prospectiveRemaining = remainingBalance - Number(paymentAmount || 0);
  
  const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.secondary.main,
      },
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.palette.secondary.main,
    },
  };

  return (
    <Paper
      elevation={2}
      sx={{
        maxWidth: 500,
        mx: "auto",
        mt: 3,
        p: 3,
        border: (theme) => `2px solid ${theme.palette.primary.main}`,
        borderRadius: 2,
      }}
    >
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
          <Autocomplete
            sx={textFieldStyles}
            id="loan-borrower-search"
            // FIX #1: Filter loans directly in the options prop
            options={loans.filter(loan => loan.status === "Active")}
            getOptionLabel={(option) => option.borrower}
            value={selectedLoan}
            onChange={(e, newValue) => setSelectedLoan(newValue)}
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
                    <>
                      {loadingLoans ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => {
              const outstandingAmount = (option.totalRepayable - (option.repaidAmount || 0)).toFixed(2).toLocaleString();
              return (
                <Box 
                  component="li" 
                  {...props} 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%', // Ensure the container takes full width
                  }}
                >
                  {/* FIX #2: Add flexGrow: 1 to Typography to push the chip to the far right */}
                  <Typography 
                    variant="body1" 
                    fontWeight="bold"
                    sx={{
                      flexGrow: 1, 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {option.borrower}
                  </Typography>
                  <Chip
                    label={`ZMW ${outstandingAmount}`}
                    color="primary"
                    size="small"
                  />
                </Box>
              );
            }}
            filterOptions={(options, { inputValue }) => {
              const search = inputValue.toLowerCase();
              return options.filter(
                (option) =>
                  option.borrower.toLowerCase().includes(search) ||
                  option.phone.includes(search)
              );
            }}
            noOptionsText="No active loans found for this search."
          />

          {selectedLoan && (
            <Card
              variant="outlined"
              sx={{
                bgcolor: remainingBalance <= 0.01 ? theme.palette.success.light : theme.palette.action.hover,
                borderColor: remainingBalance <= 0.01 ? theme.palette.success.main : theme.palette.divider,
                p: 2,
              }}
            >
              <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Selected Loan Details
                </Typography>
                <Stack spacing={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="primary" fontSize="small" />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      Borrower: {selectedLoan.borrower}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PhoneIcon color="primary" fontSize="small" />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      Phone: {selectedLoan.phone}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <MonetizationOnIcon color="primary" fontSize="small" />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      Principal: ZMW {selectedLoan.principal.toFixed(2).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccountBalanceWalletIcon color="primary" fontSize="small" />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      Total Repayable: ZMW {selectedLoan.totalRepayable.toFixed(2).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      Already Repaid: ZMW {currentRepaid.toFixed(2).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
                
                <Divider sx={{ my: 1 }} />

                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                  {remainingBalance <= 0.01 ? (
                    <CheckCircleOutlineIcon color="success" />
                  ) : (
                    <HourglassEmptyIcon color="error" />
                  )}
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{
                      color: remainingBalance <= 0.01 ? "success.main" : "text.primary"
                    }}
                  >
                    Remaining Balance: ZMW {remainingBalance.toFixed(2).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          <TextField
            sx={textFieldStyles}
            label="Payment Amount (ZMW)"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            type="number"
            inputProps={{ min: 0.01, step: "0.01" }}
            fullWidth
            required
            error={!!fieldErrors.amount}
            helperText={fieldErrors.amount}
            disabled={!selectedLoan || loading}
          />

          {selectedLoan && parseFloat(paymentAmount) > 0 && (
            <Box
              sx={{
                p: 2,
                bgcolor: prospectiveRemaining <= 0.01 ? theme.palette.success.light : 'background.paper',
                borderRadius: 1,
                border: "1px dashed",
                borderColor: prospectiveRemaining <= 0.01 ? theme.palette.success.main : 'grey.300',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                After this payment, {selectedLoan.borrower}'s loan balance will be:
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                color={prospectiveRemaining <= 0.01 ? "success.main" : "text.primary"}
              >
                ZMW {Math.max(0, prospectiveRemaining).toFixed(2).toLocaleString()}
                {prospectiveRemaining <= 0.01 && " (Loan will be paid in full)"}
              </Typography>
            </Box>
          )}

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={loading || !selectedLoan || !paymentAmount || parseFloat(paymentAmount) <= 0}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "Submitting..." : "Add Payment"}
          </Button>
        </Stack>
      </form>

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
              You are about to add a payment of ZMW {Number(paymentAmount).toFixed(2).toLocaleString()}
              for {selectedLoan.borrower}'s loan.
              <br />
              The current remaining balance is ZMW {remainingBalance.toFixed(2).toLocaleString()}.
              <br />
              After this payment, the remaining balance will be ZMW {Math.max(0, prospectiveRemaining).toFixed(2).toLocaleString()}.
              {prospectiveRemaining <= 0.01 && " (This loan will be marked as Paid.)"}
              <br />
              <br />
              Confirm to proceed?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            autoFocus
            variant="contained"
            color="secondary"
            disabled={loading}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
