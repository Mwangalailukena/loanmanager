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
import { useFirestore } from "../contexts/FirestoreProvider";
import { toast } from "react-toastify";

const OFFLINE_PAYMENTS_KEY = "offlinePayments";

export default function AddPaymentPage() {
  const { loans, addPayment, loadingLoans } = useFirestore();

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // On mount: try syncing any offline payments saved in localStorage
  useEffect(() => {
    async function syncOfflinePayments() {
      const savedPayments = JSON.parse(localStorage.getItem(OFFLINE_PAYMENTS_KEY) || "[]");
      if (savedPayments.length === 0) return;

      // Attempt to sync each payment
      for (const payment of savedPayments) {
        try {
          await addPayment(payment.loanId, payment.amount);
          toast.success(`Offline payment of ZMW ${payment.amount.toFixed(2)} synced for loan ID ${payment.loanId}`);
          // Remove synced payments after successful sync later below
        } catch (err) {
          // If sync fails, keep payment in localStorage and show a toast
          toast.error(`Failed to sync offline payment for loan ID ${payment.loanId}. Will retry later.`);
          console.error("Offline payment sync error:", err);
          return; // stop further syncing now, wait for next online
        }
      }
      // If all synced successfully, clear offline payments storage
      localStorage.removeItem(OFFLINE_PAYMENTS_KEY);
    }

    if (navigator.onLine) {
      syncOfflinePayments();
    }

    // Also listen to 'online' event to try syncing when connection returns
    function handleOnline() {
      syncOfflinePayments();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [addPayment]);

  const activeLoans = useMemo(() => loans.filter(loan => loan.status === "Active"), [loans]);

  const setFieldError = (field, message) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }));
  };

  const clearFieldError = (field) => {
    setFieldErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  useEffect(() => { clearFieldError('loan'); setGeneralError(''); }, [selectedLoan]);
  useEffect(() => { clearFieldError('amount'); setGeneralError(''); }, [paymentAmount]);

  const validateForm = () => {
    let valid = true;
    setFieldErrors({});
    setGeneralError("");

    if (!selectedLoan) {
      setFieldError("loan", "Please select a borrower/loan.");
      valid = false;
    }

    const numAmount = Number(paymentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFieldError("amount", "Payment amount must be a valid positive number.");
      valid = false;
    } else if (selectedLoan) {
      const remainingBalance = selectedLoan.totalRepayable - (selectedLoan.repaidAmount || 0);
      if (numAmount > remainingBalance + 0.0001) {
        setFieldError(
          "amount",
          `Payment (ZMW ${numAmount.toFixed(2)}) exceeds remaining balance (ZMW ${remainingBalance.toFixed(2)}).`
        );
        valid = false;
      }
    }

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
        // Save offline and notify user
        savePaymentOffline(selectedLoan.id, numAmount);
        toast.info("No internet connection. Payment saved locally and will sync when online.");
      } else {
        await addPayment(selectedLoan.id, numAmount);
        toast.success(`Payment of ZMW ${numAmount.toFixed(2).toLocaleString()} added for ${selectedLoan.borrower}!`);
      }

      // Reset form
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

  return (
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
          <Autocomplete
            id="loan-borrower-search"
            options={activeLoans}
            getOptionLabel={(option) =>
              `${option.borrower} (Phone: ${option.phone}, Loan: ZMW ${option.principal.toLocaleString()})`
            }
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
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
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
              <Typography
                variant="body1"
                fontWeight="bold"
                color={remainingBalance <= 0.01 ? "success.main" : "error.main"}
              >
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
            disabled={!selectedLoan || loading}
          />

          {selectedLoan && parseFloat(paymentAmount) > 0 && (
            <Box sx={{ p: 1, bgcolor: "background.paper", borderRadius: 1, border: "1px dashed grey.300" }}>
              <Typography variant="body2" color="text.secondary">
                After this payment, **{selectedLoan.borrower}'s** loan balance will be:
              </Typography>
              <Typography
                variant="body1"
                fontWeight="bold"
                color={prospectiveRemaining <= 0.01 ? "success.main" : "text.primary"}
              >
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
              You are about to add a payment of **ZMW {Number(paymentAmount).toFixed(2).toLocaleString()}**
              for **{selectedLoan.borrower}**'s loan.
              <br />
              The current remaining balance is **ZMW {remainingBalance.toFixed(2).toLocaleString()}**.
              <br />
              After this payment, the remaining balance will be **ZMW {Math.max(0, prospectiveRemaining).toFixed(2).toLocaleString()}**.
              {prospectiveRemaining <= 0.01 && " (This loan will be marked as Paid.)"}
              <br />
              <br />
              **Confirm to proceed?**
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSubmit} autoFocus variant="contained" disabled={loading}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

