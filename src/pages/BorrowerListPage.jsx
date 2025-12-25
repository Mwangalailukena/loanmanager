import React, { useState, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useCreditScore } from '../hooks/useCreditScore';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  TextField,
  InputAdornment,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';

const BorrowerCard = ({ borrower }) => {
  const { loans } = useFirestore();
  const navigate = useNavigate();
  const associatedLoans = useMemo(() => loans.filter((loan) => loan.borrowerId === borrower.id), [loans, borrower.id]);
  const { score, remarks } = useCreditScore(associatedLoans);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
        transition: 'box-shadow 0.3s, transform 0.3s',
        cursor: 'pointer',
      }}
      onClick={() => navigate(`/borrowers/${borrower.id}`)}
    >
      <CardContent sx={{ flexGrow: 1, p: isMobile ? 1.5 : 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'secondary.main' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div" fontWeight="600" noWrap>
                {borrower.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>{borrower.phone}</Typography>
            </Box>
          </Stack>
          <IconButton
            size="small"
            aria-label="more"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuClick(e);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
          <Chip label={`Score: ${score}`} color={getScoreColor(score)} size="small" variant="outlined" />
          <Typography variant="caption" color="text.secondary" noWrap>{remarks}</Typography>
        </Stack>
      </CardContent>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          component={RouterLink}
          to={`/add-loan?borrowerId=${borrower?.id}`}
          onClick={handleMenuClose}
        >
          Add Loan
        </MenuItem>
        <MenuItem onClick={(e) => {
          e.stopPropagation();
          window.location.href = `tel:${borrower?.phone}`;
          handleMenuClose(e);
        }}>
          Call
        </MenuItem>
        <MenuItem onClick={(e) => {
          e.stopPropagation();
          window.location.href = `sms:${borrower?.phone}`;
          handleMenuClose(e);
        }}>
          Send SMS
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default function BorrowerListPage() {
  const { borrowers, loading } = useFirestore();
  const navigate = useNavigate();
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/add-borrower')}>
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
        <Grid container spacing={2}>
          {filteredBorrowers.map((borrower) => (
            <Grid item xs={6} sm={4} md={3} key={borrower.id}>
              <BorrowerCard borrower={borrower} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          <PeopleOutlineIcon sx={{ fontSize: 48, color: 'grey.400' }} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            No borrowers found
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Click the "Add Borrower" button to add your first borrower.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
