// src/pages/AddLoanForm.jsx
import React, { useState } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Stack,
  Alert,
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import { toast } from "react-toastify";

const interestOptions = [
  { label: "1 Week", value: 1 },
  { label: "2 Weeks", value: 2 },
  { label: "3 Weeks", value: 3 },
  { label: "4 Weeks", value: 4 },
];

export default function AddLoanForm() {
  const { addLoan, addActivityLog, settings } = useFirestore();

  const [borrower, setBorrower] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [interestDuration, setInterestDuration] = useState(1);
  const [error, setError] = useState("");

  const interestRates = settings?.interestRates || {
    1: 0.15,
    2: 0.2,
    3: 0.3,
    4: 0.3,
  };

  const calculateInterest = (principal, weeks) =>
    principal * (interestRates[weeks] || 0);

  const validateFields = () => {
    if (!/^[a-zA-Z\s]{2,}$/.test(borrower.trim())) {
      return "Borrower name must contain only letters and spaces.";
    }

    if (!/^\+?\d{8,15}$/.test(phone.trim())) {
      return "Enter a valid phone number (digits only, optional +).";
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return "Loan amount must be a valid positive number.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    const principal = Number(amount);
    const interest = calculateInterest(principal, interestDuration);
    const totalRepayable = principal + interest;

    const startDate = new Date().toISOString().slice(0, 10);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + interestDuration * 7);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    try {
      await addLoan({
        borrower,
        phone,
        principal,
        interest,
        totalRepayable,
        startDate,
        dueDate: dueDateStr,
        status: "Active",
        repaidAmount: 0,
        interestDuration,
      });

      await addActivityLog({
        action: "Loan Created",
        details: `Loan created for ${borrower} (ZMW ${principal})`,
        timestamp: new Date().toISOString(),
      });

      toast.success("Loan added successfully!");

      // Clear form fields
      setBorrower("");
      setPhone("");
      setAmount("");
      setInterestDuration(1);
      setError("");

    } catch (err) {
      console.error("Loan creation failed:", err);
      setError("Failed to add loan. Please try again.");
    }
  };

  return (
    <Box maxWidth={500} mx="auto" mt={3}>
      <Typography variant="h5" mb={3}>
        Add New Loan
      </Typography>
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Borrower Name"
            value={borrower}
            onChange={(e) => setBorrower(e.target.value)}
            fullWidth
            required
            inputProps={{ maxLength: 50 }}
          />
          <TextField
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            required
            inputProps={{ maxLength: 15 }}
          />
          <TextField
            label="Loan Amount (ZMW)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputProps={{ min: 1 }}
            fullWidth
            required
          />
          <TextField
            select
            label="Interest Duration"
            value={interestDuration}
            onChange={(e) => setInterestDuration(Number(e.target.value))}
            fullWidth
            required
          >
            {interestOptions.map(({ label, value }) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          <Button type="submit" variant="contained" color="primary">
            Add Loan
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

