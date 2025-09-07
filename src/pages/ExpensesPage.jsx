import React, { useState } from 'react';
import { useFirestore } from '../contexts/FirestoreProvider';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import AddExpenseDialog from '../components/AddExpenseDialog';

export default function ExpensesPage() {
  const { expenses, loading, deleteExpense } = useFirestore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null); // State to hold the expense being edited

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
      } catch (error) {
        console.error("Failed to delete expense:", error);
      }
    }
  };

  // Open dialog in "edit" mode
  const handleEditClick = (expense) => {
    setExpenseToEdit(expense);
    setDialogOpen(true);
  };
  
  // Open dialog in "add" mode
  const handleAddClick = () => {
    setExpenseToEdit(null); // Ensure no expense is being edited
    setDialogOpen(true);
  };

  // Close dialog and reset state
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setExpenseToEdit(null);
  };

  return (
    <Paper
      elevation={4}
      sx={{
        maxWidth: 800,
        mx: 'auto',
        mt: 4,
        p: 3,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Expenses
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
        >
          Add Expense
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress color="secondary" />
        </Box>
      ) : expenses.length > 0 ? (
        <List sx={{ width: '100%' }}>
          {expenses.map((expense) => (
            <ListItem
              key={expense.id}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <IconButton edge="end" aria-label="edit" onClick={() => handleEditClick(expense)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(expense.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              }
              sx={{ 
                mb: 1, 
                borderRadius: 2, 
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemText
                primary={expense.description}
                secondary={`Category: ${expense.category} | Date: ${dayjs(expense.date.toDate()).format('YYYY-MM-DD')}`}
              />
              <Typography variant="body1" fontWeight="bold">
                K {Number(expense.amount).toLocaleString()}
              </Typography>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          No expenses recorded yet. Click "Add Expense" to get started.
        </Typography>
      )}

      <AddExpenseDialog 
          open={dialogOpen} 
          onClose={handleCloseDialog} 
          expenseToEdit={expenseToEdit} // Pass the expense to the dialog
        />
    </Paper>
  );
}
