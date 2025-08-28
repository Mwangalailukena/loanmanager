import React, { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useFirestore } from '../contexts/FirestoreProvider';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  CircularProgress,
  TextField,
  InputAdornment,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';

export default function BorrowerListPage() {
  const { borrowers, loading } = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBorrowers = useMemo(() => {
    if (!searchTerm) {
      return borrowers;
    }
    return borrowers.filter((borrower) =>
      borrower.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [borrowers, searchTerm]);

  return (
    <Paper
      elevation={4}
      sx={{
        maxWidth: 700,
        mx: 'auto',
        mt: 4,
        p: 3,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Borrowers
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          component={RouterLink}
          to="/add-borrower"
          startIcon={<AddIcon />}
        >
          Add Borrower
        </Button>
      </Stack>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress color="secondary" />
        </Box>
      ) : filteredBorrowers.length > 0 ? (
        <List sx={{ width: '100%' }}>
          {filteredBorrowers.map((borrower) => (
            <ListItem
              key={borrower.id}
              button
              component={RouterLink}
              to={`/borrowers/${borrower.id}`}
              sx={{ 
                mb: 1, 
                borderRadius: 2, 
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={borrower.name}
                secondary={`Phone: ${borrower.phone} | Email: ${borrower.email || 'N/A'}`}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          No borrowers found. Click "Add Borrower" to get started.
        </Typography>
      )}
    </Paper>
  );
}
