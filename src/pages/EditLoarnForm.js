Import React, { useState, useEffect } from "react";
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
import { useNavigate, useParams } from "react-router-dom";

const interestOptions = [
  { label: "1 Week", value: 1 },
  { label: "2 Weeks", value: 2 },
  { label: "3 Weeks", value: 3 },
  { label: "4 Weeks", value: 4 },
];

export default function EditLoanForm() {
  const { loans, updateLoan, settings } = useFirestore();
  const navigate = useNavigate();
  const { id } = useParams();

  const [borrower, setBorrower] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [interestDuration, setInterestDuration] = useState(1);
  const [error, setError] = useState("");

  const monthKey = dayjs().format("YYYY-MM");
  const currentMonthSettings = settings?.monthlySettings?.[monthKey];
  const effectiveInterestRatesSource = currentMonthSettings?.interestRates || settings?.interestRates;

  const interestRates = {
    1: (effectiveInterestRatesSource?.[1] || 0.15),
    2: (effectiveInterestRatesSource?.[2] || 0.20),
    3: (effectiveInterestRatesSource?.[3] || 0.30),
    4: (effectiveInterestRatesSource?.[4] || 0.30),
  };

  const calculateInterest = (principal, weeks) => principal * (interestRates[weeks] || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!borrower.trim()) return setError("Borrower name is required");
    if (!phone.trim()) return setError("Phone number is required");
    if (!amount || isNaN(amount) || Number(amount) <= 0)
      return setError("Amount must be a positive number");

    const principal = Number(amount);
    const interest = calculateInterest(principal, interestDuration);
    const totalRepayable = principal + interest;

    const startDate = new Date().toISOString().slice(0, 10);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + interestDuration * 7);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    await updateLoan(id, {
      borrower,
      phone,
      principal,
      interest,
      totalRepayable,
      startDate,
      dueDate: dueDateStr,
      interestDuration,
    });

    navigate("/loans");
  };

  if (!id) return <Typography>Loan not found</Typography>;

  return (
    <Box maxWidth={400} mx="auto" mt={3}>
      <Typography variant="h5" mb={3}>
        Edit Loan
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
          />
          <TextField
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
          />
          <TextField
            label="Amount (ZMW)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputProps={{ min: 1 }}
            fullWidth
          />
          <TextField
            select
            label="Interest Duration"
            value={interestDuration}
            onChange={(e) => setInterestDuration(Number(e.target.value))}
            fullWidth
          >
            {interestOptions.map(({ label, value }) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained" color="primary">
            Save Changes
          </Button>
          <Button variant="outlined" onClick={() => navigate("/loans")}>
            Cancel
          </Button>
        </Stack>
      </form>
    </Box>
  );
}