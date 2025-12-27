import React, { useState, useMemo, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useCreditScore } from '../hooks/useCreditScore';
import dayjs from 'dayjs'; // NEW
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CallIcon from '@mui/icons-material/Call';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { calcStatus } from '../utils/loanUtils';
import WhatsAppDialog from '../components/WhatsAppDialog';

const BorrowerCard = ({ borrower, onWhatsAppClick }) => {
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
              <Stack direction="row" alignItems="center" spacing={0.5}> {/* NEW STACK */}
                <Typography variant="body2" color="text.secondary" noWrap>{borrower.phone}</Typography>
                {borrower.phone && ( // Only show if phone number exists
                  <IconButton
                    size="small"
                    aria-label="whatsapp"
                    onClick={(e) => {
                      e.stopPropagation();
                      onWhatsAppClick(borrower);
                    }}
                    sx={{ color: 'success.main' }} // WhatsApp green color
                  >
                    <WhatsAppIcon fontSize="small" />
                  </IconButton>
                )}
                {/* Keep call option as an explicit button */}
                <IconButton
                  size="small"
                  aria-label="call"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${borrower?.phone}`;
                  }}
                  sx={{ color: 'primary.main' }}
                >
                  <CallIcon fontSize="small" />
                </IconButton>
              </Stack>
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
      </Menu>
    </Card>
  );
};

export default function BorrowerListPage() {
  const { borrowers, loading, loans } = useFirestore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showActiveLoans, setShowActiveLoans] = useState(false);
  const [showOverdueLoans, setShowOverdueLoans] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(null);

  const handleWhatsAppClick = (borrower) => {
    setSelectedBorrower(borrower);
    setWhatsAppOpen(true);
  };

  const handleWhatsAppClose = () => {
    setWhatsAppOpen(false);
    setSelectedBorrower(null);
  };

  // Debounce effect
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]); // Re-run effect only if searchTerm changes

  // Summary Statistics (NEW)
  const summaryStats = useMemo(() => {
    const totalBorrowers = borrowers.length;
    
    // Create a Set to store unique borrower IDs that have active/overdue loans
    const borrowersWithActiveLoans = new Set();
    const borrowersWithOverdueLoans = new Set();

    loans.forEach(loan => {
      const status = calcStatus(loan); // Use the utility function

      if (status === 'Active') {
        borrowersWithActiveLoans.add(loan.borrowerId);
      } else if (status === 'Overdue') {
        borrowersWithOverdueLoans.add(loan.borrowerId);
      }
      // Note: A loan could be both 'Active' (not paid/defaulted) and 'Overdue'.
      // If a loan is overdue, it's typically considered in the 'Overdue' category, not 'Active'.
      // The calcStatus utility should handle this hierarchy.
    });

    return {
      totalBorrowers,
      borrowersWithActiveLoansCount: borrowersWithActiveLoans.size,
      borrowersWithOverdueLoansCount: borrowersWithOverdueLoans.size,
    };
  }, [borrowers, loans]); // Recalculate if borrowers or loans change


  const filteredBorrowers = useMemo(() => {
    // Start with the full list of borrowers
    let currentFilteredBorrowers = borrowers;

    // Apply search term filter
    if (debouncedSearchTerm) {
      currentFilteredBorrowers = currentFilteredBorrowers.filter((borrower) =>
        borrower.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Apply "Show Active Loans Only" filter
    if (showActiveLoans) {
      currentFilteredBorrowers = currentFilteredBorrowers.filter(borrower => {
        const hasActiveLoan = loans.some(loan => 
          loan.borrowerId === borrower.id && 
          loan.status !== 'Defaulted' && 
          loan.status !== 'Paid' // Assuming 'Active' implies not defaulted and not paid
        );
        return hasActiveLoan;
      });
    }

    // Apply "Show Overdue Loans Only" filter
    if (showOverdueLoans) {
      currentFilteredBorrowers = currentFilteredBorrowers.filter(borrower => {
        const hasOverdueLoan = loans.some(loan => {
          if (loan.borrowerId !== borrower.id) return false;
          if (loan.status === 'Defaulted' || loan.status === 'Paid') return false;
          const totalRepayable = Number(loan.totalRepayable || 0);
          const repaidAmount = Number(loan.repaidAmount || 0);
          const dueDate = dayjs(loan.dueDate);
          const now = dayjs();
          return (repaidAmount < totalRepayable || totalRepayable === 0) && dueDate.isBefore(now, 'day');
        });
        return hasOverdueLoan;
      });
    }

    return currentFilteredBorrowers;
  }, [borrowers, debouncedSearchTerm, showActiveLoans, showOverdueLoans, loans]); // Added loans to dependency




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
      {/* Summary Section (NEW) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}> {/* Adjusted to sm={6} for better layout with 2 items */}
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Total Borrowers</Typography>
            <Typography variant="h4" fontWeight="bold">{summaryStats.totalBorrowers}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}> {/* Adjusted to sm={6} for better layout with 2 items */}
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Overdue Borrowers</Typography>
            <Typography variant="h4" fontWeight="bold" color="error.main">{summaryStats.borrowersWithOverdueLoansCount}</Typography>
          </Paper>
        </Grid>
      </Grid>
      {/* End Summary Section */}

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

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <FormControlLabel
                control={<Switch checked={showActiveLoans} onChange={(e) => setShowActiveLoans(e.target.checked)} />}
                label="Show Active Loans Only"
            />
            <FormControlLabel
                control={<Switch checked={showOverdueLoans} onChange={(e) => setShowOverdueLoans(e.target.checked)} />}
                label="Show Overdue Loans Only"
            />
        </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress color="secondary" />
        </Box>
      ) : filteredBorrowers.length > 0 ? (
        <Grid container spacing={2}>
          {filteredBorrowers.map((borrower) => (
            <Grid item xs={6} sm={4} md={3} key={borrower.id}>
              <BorrowerCard borrower={borrower} onWhatsAppClick={handleWhatsAppClick} />
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
      {selectedBorrower && (
        <WhatsAppDialog
          open={whatsAppOpen}
          onClose={handleWhatsAppClose}
          phoneNumber={selectedBorrower.phone}
          defaultMessage={`Hello ${selectedBorrower.name},`}
        />
      )}
    </Paper>
  );
}
