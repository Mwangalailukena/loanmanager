// src/components/AddPaymentModal.jsx
import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Backdrop,
  Fade,
  InputAdornment, // Added InputAdornment
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";

const style = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 350,
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
};

export default function AddPaymentModal({ open, onClose, loan }) {
  const { addPayment } = useFirestore();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const remainingBalance = loan ? (loan.totalRepayable - (loan.repaidAmount || 0)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    if (paymentAmount > remainingBalance + 0.01) {
      setError(`Amount cannot exceed ZMW ${remainingBalance.toFixed(2)}`);
      return;
    }
    try {
      await addPayment(loan.id, paymentAmount);
      setAmount("");
      onClose();
    } catch (err) {
      setError("Failed to add payment.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>
            Add Payment - {loan.borrower}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Payment Amount (ZMW)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                inputProps={{ min: 0.01, step: 0.01 }}
                error={!!error}
                helperText={error}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        size="small" 
                        onClick={() => setAmount(remainingBalance.toFixed(2))}
                        sx={{ whiteSpace: 'nowrap', minWidth: 'fit-content' }}
                      >
                        Full
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="contained" type="submit">
                  Submit
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Fade>
    </Modal>
  );
}

