import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
} from '@mui/material';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useSnackbar } from '../components/SnackbarProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const expenseCategories = [
  "Office Supplies",
  "Utilities",
  "Salaries",
  "Marketing",
  "Travel",
  "Other",
];

export default function AddExpenseDialog({ open, onClose, expenseToEdit }) {
  const { addExpense, updateExpense } = useFirestore();
  const showSnackbar = useSnackbar();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [date, setDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditMode = !!expenseToEdit;

  useEffect(() => {
    if (isEditMode && open) {
      setDescription(expenseToEdit.description || '');
      setAmount(String(expenseToEdit.amount) || '');
      setCategory(expenseToEdit.category || 'Other');
      setDate(dayjs(expenseToEdit.date.toDate()));
    } else {
      setDescription('');
      setAmount('');
      setCategory('Other');
      setDate(dayjs());
      setErrors({});
    }
  }, [expenseToEdit, open, isEditMode]);

  const validate = () => {
    const newErrors = {};
    if (!description.trim()) newErrors.description = "Description is required.";
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) newErrors.amount = "Please enter a valid, positive amount.";
    if (!date || !date.isValid()) newErrors.date = "Please select a valid date.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showSnackbar("Please correct the errors.", "error");
      return;
    }
    setLoading(true);
    
    const expenseData = {
      description,
      amount: Number(amount),
      category,
      date: date.toDate(),
    };

    try {
      if (isEditMode) {
        await updateExpense(expenseToEdit.id, expenseData);
        showSnackbar("Expense updated successfully!", "success");
      } else {
        await addExpense(expenseData);
        showSnackbar("Expense added successfully!", "success");
      }
      onClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'add'} expense:`, error);
      showSnackbar(`Failed to ${isEditMode ? 'update' : 'add'} expense.`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>{isEditMode ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* ... TextFields for description, amount, category ... */}
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              required
              error={!!errors.description}
              helperText={errors.description}
            />
            <TextField
              label="Amount (K)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              fullWidth
              required
              error={!!errors.amount}
              helperText={errors.amount}
            />
            <TextField
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              fullWidth
            >
              {expenseCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>

            {/* FIXED DatePicker */}
            <DatePicker
              label="Date"
              value={date}
              onChange={(newValue) => setDate(newValue)}
              enableAccessibleFieldDOMStructure={false} // <-- THIS IS THE FIX
              slots={{ textField: TextField }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.date,
                  helperText: errors.date,
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="secondary" disabled={loading}>
            {loading ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Expense')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
