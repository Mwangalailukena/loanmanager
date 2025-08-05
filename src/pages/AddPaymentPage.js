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
  Chip,
  useTheme,
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import { toast } from "react-toastify";
import localforage from "localforage";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const OFFLINE_PAYMENTS_KEY = "pendingPayments";

// Dummy StatusChip component for demonstration. Replace with your app's actual component.
const StatusChip = ({ status }) => {
  const colorMap = {
    Active: "primary",
    Paid: "success",
    Overdue: "error",
  };
  return (
    <Chip
      label={status}
      color={colorMap[status] || "default"}
      size="small"
      sx={{ ml: 1 }}
    />
  );
};

// Queue payment locally
async function queuePayment(paymentData) {
  const existing = (await localforage.getItem(OFFLINE_PAYMENTS_KEY)) || [];
  existing.push({ ...paymentData, timestamp: Date.now() });
  await localforage.setItem(OFFLINE_PAYMENTS_KEY, existing);
}

// Sync queued payments to Firestore
async function syncPendingPayments() {
  const pending = (await localforage.getItem(OFFLINE_PAYMENTS_KEY)) || [];
  if (pending.length === 0) return;

  for (const payment of pending) {
    try {
      await addDoc(collection(db, "payments"), payment);
    } catch (error) {
      console.error("Sync failed for payment", payment, error);
      return; // stop syncing if any write fails
    }
  }

  await localforage.removeItem(OFFLINE_PAYMENTS_KEY);
}

export default function AddPaymentPage() {
  const theme = useTheme();
  const { loans, addPayment, loadingLoans } = useFirestore();

  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  // Filter active loans for selection
  const activeLoans = useMemo(() => {
    return loans.filter((loan) => loan.status === "Active");
  }, [loans]);

  // Error helpers
  const setFieldError = (field, message) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };
  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      const newState = { ...prev };
      delete newState[field];
      return newState;
    });
  };

  useEffect(() => {
    clearFieldError("loan");
    setGeneralError("");
  }, [selectedLoan]);

  useEffect(() => {
    clearFieldError("amount");
    setGeneralError("");
  }, [paymentAmount]);

  // Attempt to sync when back online
  useEffect(() => {
    const offlineSyncToastId = "offline-sync-info";

    const handleOnline = () => {
      syncPendingPayments()
        .then(() => {
          if (!toast.isActive(offlineSyncToastId)) {
            toast.info("Offline payments synced successfully.", {
              toastId: offlineSyncToastId,
            });
          }
        })
        .catch((e) => {
          console.error("Error syncing payments:", e);
        });
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const validateForm = () => {
    let isValid = true;
    setFieldErrors({});
    setGeneralError("");

    if (!selectedLoan) {
      setFieldError("loan", "Please select a borrower/loan.");
      isValid = false;
    }

    const numPaymentAmount = Number(paymentAmount);
    if (isNaN(numPaymentAmount) || numPaymentAmount <= 0) {
      setFieldError("amount", "Payment amount must be a valid positive number.");
      isValid = false;
    } else if (selectedLoan) {
      const remainingBalance =
        selectedLoan.totalRepayable - (selectedLoan.repaidAmount || 0);
      if (numPaymentAmount > remainingBalance + 0.0001) {
        setFieldError(
          "amount",
          `Payment (ZMW ${numPaymentAmount.toFixed(
            2
          )}) exceeds remaining balance (ZMW ${remainingBalance.toFixed(2)}).`
        );
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
    setOpenConfirmDialog(false);
    setLoading(true);

    try {
      const numPaymentAmount = Number(paymentAmount);
      // Try adding payment via Firestore context first
      await addPayment(selectedLoan.id, numPaymentAmount);

      const successToastId = "payment-success";
      if (!toast.isActive(successToastId)) {
        toast.success(
          `Payment of ZMW ${numPaymentAmount.toFixed(2).toLocaleString()} added for ${selectedLoan.borrower}!`,
          { toastId: successToastId }
        );
      }

      // Added vibration here:
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setSelectedLoan(null);
      setPaymentAmount("");
      setFieldErrors({});
      setGeneralError("");
    } catch (err) {
      // If offline or Firestore unavailable, queue payment locally
      console.error("Payment submission failed:", err);
      if (
        err.code === "unavailable" ||
        err.message?.toLowerCase().includes("offline")
      ) {
        await queuePayment({
          loanId: selectedLoan.id,
          borrower: selectedLoan.borrower,
          amount: Number(paymentAmount),
          createdAt: new Date().toISOString(),
        });

        const offlineToastId = "offline-payment-info";
        if (!toast.isActive(offlineToastId)) {
          toast.info(
            "You are offline. Payment saved locally and will sync when back online.",
            { toastId: offlineToastId }
          );
        }

        // Reset form even if queued locally
        setSelectedLoan(null);
        setPaymentAmount("");
        setFieldErrors({});
        setGeneralError("");
      } else {
        setGeneralError("Failed to add payment. Please try again.");
        toast.error(`Failed to add payment: ${err.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const currentRepaid = selectedLoan ? selectedLoan.repaidAmount || 0 : 0;
  const remainingBalance = selectedLoan
    ? selectedLoan.totalRepayable - currentRepaid
    : 0;
  const prospectiveRemaining = remainingBalance - Number(paymentAmount || 0);

  // Reusable styles for the focused state of form fields
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
            sx={textFieldStyles} // <-- Accent color on focus
            id="loan-borrower-search"
            options={activeLoans}
            getOptionLabel={(option) =>
              `${option.borrower} (Phone: ${option.phone})`
            }
            value={selectedLoan}
            onChange={(event, newValue) => {
              setSelectedLoan(newValue);
            }}
            loading={loadingLoans}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Typography variant="body1">{option.borrower}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 1, flexGrow: 1 }}
                >
                  (Loan: ZMW {option.principal.toFixed(2).toLocaleString()})
                </Typography>
                <StatusChip status={option.status} />
              </Box>
            )}
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
                      {loadingLoans ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
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
            <Paper
              variant="outlined"
              sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}
            >
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
            sx={textFieldStyles} // <-- Accent color on focus
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
                p: 1,
                bgcolor: "background.paper",
                borderRadius: 1,
                border: "1px dashed grey.300",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                After this payment, **{selectedLoan.borrower}&#39;s** loan balance
                will be:
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
            color="secondary" // <-- Accent color
            disabled={
              loading || !selectedLoan || !paymentAmount || parseFloat(paymentAmount) <= 0
            }
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
              for **{selectedLoan.borrower}**&#39;s loan.
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
          <Button 
            onClick={handleConfirmSubmit} 
            autoFocus 
            variant="contained" 
            color="secondary" // <-- Accent color
            disabled={loading}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
