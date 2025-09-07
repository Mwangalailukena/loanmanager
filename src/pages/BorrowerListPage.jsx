import React, { useState, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useFirestore } from '../contexts/FirestoreProvider';
import {
  Box,
  Typography,
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
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';

export default function BorrowerListPage() {
  const { borrowers, loading } = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBorrower, setSelectedBorrower] = useState(null);

  const handleMenuClick = (event, borrower) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedBorrower(borrower);
  };

  const handleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
    setSelectedBorrower(null);
  };

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
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="more"
                  aria-controls="long-menu"
                  aria-haspopup="true"
                  onClick={(e) => handleMenuClick(e, borrower)}
                >
                  <MoreVertIcon />
                </IconButton>
              }
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
        <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          <PeopleOutlineIcon sx={{ fontSize: 48, color: 'grey.400' }} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            No borrowers found
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Click the <AddIcon sx={{ verticalAlign: 'middle', fontSize: '1rem' }} /> button in the bottom right to add your first borrower.
          </Typography>
        </Box>
      )}
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          component={RouterLink}
          to={`/add-loan?borrowerId=${selectedBorrower?.id}`}
          onClick={handleMenuClose}
        >
          Add Loan for this Borrower
        </MenuItem>
        <MenuItem onClick={(e) => {
          window.location.href = `tel:${selectedBorrower?.phone}`;
          handleMenuClose(e);
        }}>
          Call
        </MenuItem>
        <MenuItem onClick={(e) => {
          window.location.href = `sms:${selectedBorrower?.phone}`;
          handleMenuClose(e);
        }}>
          Send SMS
        </MenuItem>
      </Menu>
    </Paper>
  );
}
