import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useNavigate, useParams } from "react-router-dom";

export default function AddPaymentPage() {
  const { loans, addPayment } = useFirestore();
  const navigate = useNavigate();
  const { id } = useParams();

  const [loan, setLoan] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const found = loans.find((l) => l.id === id);
    if (found) setLoan(found);
  }, [id, loans]);

  const handleSubmit = async () => {
    const val = Number(amount);
    if (val <= 0 || isNaN(val)) {
      setError("Please enter a valid positive amount");
      return;
    }
    setError("");
    await addPayment(id, val);
    navigate("/loans");
  };

  if (!loan) return <Typography>Loan not found.</Typography>;

  return (
    <Box maxWidth={400} mx="auto" mt={5}>
      <Typography variant="h5" mb={3}>
        Add Payment for {loan.borrower}
      </Typography>
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack spacing={2}>
        <TextField
          label="Payment Amount (ZMW)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputProps={{ min: 1 }}
          fullWidth
        />
        <Button variant="contained" onClick={handleSubmit}>
          Submit Payment
        </Button>
        <Button variant="outlined" onClick={() => navigate("/loans")}>
          Cancel
        </Button>
      </Stack>
    </Box>
  );
}

