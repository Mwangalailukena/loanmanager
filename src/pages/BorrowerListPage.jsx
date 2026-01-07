import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useFirestore } from '../contexts/FirestoreProvider';
import {
  Box,  Typography,
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
  Checkbox,
  LinearProgress,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSnackbar } from '../components/SnackbarProvider';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CallIcon from '@mui/icons-material/Call';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { calcStatus } from '../utils/loanUtils';
import WhatsAppDialog from '../components/WhatsAppDialog';
import AddPaymentDialog from '../components/AddPaymentDialog';

const BorrowerCard = React.memo(({ 
  borrower, 
  associatedLoans,
  score,
  onWhatsAppClick, 
  onPaymentClick, 
  onNoteClick,
  isSelected,
  onSelect
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const stats = useMemo(() => {
    return associatedLoans.reduce((acc, loan) => {
      if (loan.status === 'Defaulted') return acc;
      acc.totalBorrowed += Number(loan.totalRepayable || 0);
      acc.totalRepaid += Number(loan.repaidAmount || 0);
      return acc;
    }, { totalBorrowed: 0, totalRepaid: 0 });
  }, [associatedLoans]);

  const totalDebt = stats.totalBorrowed - stats.totalRepaid;
  const progress = stats.totalBorrowed > 0 ? (stats.totalRepaid / stats.totalBorrowed) * 100 : 0;

  const borrowerStatus = useMemo(() => {
    const hasOverdue = associatedLoans.some(l => calcStatus(l) === 'Overdue');
    const hasActive = associatedLoans.some(l => calcStatus(l) === 'Active');
    if (hasOverdue) return { label: 'Overdue', color: 'error', priority: 3 };
    if (hasActive) return { label: 'Active Debt', color: 'warning', priority: 2 };
    return { label: 'Healthy', color: 'success', priority: 1 };
  }, [associatedLoans]);

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
        position: 'relative',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
        transition: 'box-shadow 0.3s, transform 0.3s',
        cursor: 'pointer',
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
      }}
      onClick={() => navigate(`/borrowers/${borrower.id}`)}
    >
      <Box sx={{ position: 'absolute', top: 4, left: 4, zIndex: 2 }}>
        <Checkbox 
          size="small" 
          checked={isSelected} 
          onClick={(e) => { e.stopPropagation(); onSelect(borrower.id); }} 
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, p: isMobile ? 1.5 : 2, pt: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'secondary.main' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div" fontWeight="600" noWrap sx={{ maxWidth: 120 }}>
                {borrower.name}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="body2" color="text.secondary" noWrap>{borrower.phone}</Typography>
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
        
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">Debt Progress</Typography>
            <Typography variant="caption" fontWeight="bold">
              {progress.toFixed(0)}%
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 6, borderRadius: 5, mb: 1, bgcolor: alpha(theme.palette.divider, 0.1) }}
            color={borrowerStatus.color}
          />
          <Typography variant="body2" fontWeight="bold" color={totalDebt > 0 ? "error.main" : "success.main"}>
            K {totalDebt.toFixed(2)} Remaining
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          <Chip label={borrowerStatus.label} color={borrowerStatus.color} size="small" />
          <Chip label={`Score: ${score}`} color={getScoreColor(score)} size="small" variant="outlined" />
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" justifyContent="space-around">
          <Tooltip title="WhatsApp">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onWhatsAppClick(borrower); }} color="success">
              <WhatsAppIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Quick Note">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onNoteClick(borrower); }} color="primary">
              <NoteAddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {totalDebt > 0 && (
            <Tooltip title="Record Payment">
              <IconButton 
                size="small" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const activeLoan = associatedLoans.find(l => calcStatus(l) === 'Active' || calcStatus(l) === 'Overdue');
                  if (activeLoan) onPaymentClick(activeLoan.id);
                }} 
                color="secondary"
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Call">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${borrower?.phone}`; }} color="primary">
              <CallIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
});

export default function BorrowerListPage() {
  const { borrowers, loading, loans, addComment } = useFirestore();
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showActiveLoans, setShowActiveLoans] = useState(false);
  const [showOverdueLoans, setShowOverdueLoans] = useState(false);
  const [showHighRisk, setShowHighRisk] = useState(false);
  
  const [selectedBorrowerIds, setSelectedBorrowerIds] = useState([]);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [activeLoanId, setActiveLoanId] = useState(null);
  
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const loansByBorrower = useMemo(() => {
    const map = {};
    loans.forEach(loan => {
      if (!map[loan.borrowerId]) map[loan.borrowerId] = [];
      map[loan.borrowerId].push(loan);
    });
    return map;
  }, [loans]);

  const handleWhatsAppClick = useCallback((borrower) => {
    setSelectedBorrower(borrower);
    setWhatsAppOpen(true);
  }, []);

  const handleWhatsAppClose = useCallback(() => {
    setWhatsAppOpen(false);
    setSelectedBorrower(null);
  }, []);

  const handlePaymentClick = useCallback((loanId) => {
    setActiveLoanId(loanId);
    setPaymentOpen(true);
  }, []);

  const handleNoteClick = useCallback((borrower) => {
    setSelectedBorrower(borrower);
    setNoteOpen(true);
  }, []);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addComment({
        borrowerId: selectedBorrower.id,
        text: noteText,
        type: "follow_up"
      });
      showSnackbar("Note saved successfully", "success");
      setNoteOpen(false);
      setNoteText("");
    } catch (error) {
      showSnackbar("Failed to save note", "error");
    }
  };

  const toggleSelect = useCallback((id) => {
    setSelectedBorrowerIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  // Debounce effect
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const summaryStats = useMemo(() => {
    const totalBorrowers = borrowers.length;
    let overdueBorrowersCount = 0;

    Object.values(loansByBorrower).forEach(bLoans => {
      if (bLoans.some(l => calcStatus(l) === 'Overdue')) {
        overdueBorrowersCount++;
      }
    });

    return {
      totalBorrowers,
      borrowersWithOverdueLoansCount: overdueBorrowersCount,
    };
  }, [borrowers.length, loansByBorrower]);

  const sortedAndFilteredBorrowers = useMemo(() => {
    let result = borrowers.map(b => {
      const bLoans = loansByBorrower[b.id] || [];
      
      const stats = bLoans.reduce((acc, loan) => {
        if (loan.status === 'Defaulted') return acc;
        acc.totalBorrowed += Number(loan.totalRepayable || 0);
        acc.totalRepaid += Number(loan.repaidAmount || 0);
        return acc;
      }, { totalBorrowed: 0, totalRepaid: 0 });

      const totalDebt = stats.totalBorrowed - stats.totalRepaid;
      
      const hasOverdue = bLoans.some(l => calcStatus(l) === 'Overdue');
      const hasActive = bLoans.some(l => calcStatus(l) === 'Active');
      let priority = 1;
      if (hasOverdue) priority = 3;
      else if (hasActive) priority = 2;

      // Mock credit score logic similar to BorrowerCard for filtering
      const score = Math.max(0, 100 - (hasOverdue ? 40 : 0)); // Simplified for sorting/filtering

      return { ...b, totalDebt, priority, score, bLoans };
    });

    if (debouncedSearchTerm) {
      result = result.filter(b => b.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    }

    if (showActiveLoans) {
      result = result.filter(b => b.priority >= 2);
    }

    if (showOverdueLoans) {
      result = result.filter(b => b.priority === 3);
    }

    if (showHighRisk) {
      result = result.filter(b => b.score < 70);
    }

    // URGENCY SORTING
    return result.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.totalDebt - a.totalDebt;
    });
  }, [borrowers, loansByBorrower, debouncedSearchTerm, showActiveLoans, showOverdueLoans, showHighRisk]);





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
        <Grid xs={12} sm={6}> {/* Adjusted to sm={6} for better layout with 2 items */}
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Total Borrowers</Typography>
            <Typography variant="h4" fontWeight="bold">{summaryStats.totalBorrowers}</Typography>
          </Paper>
        </Grid>
        <Grid xs={12} sm={6}> {/* Adjusted to sm={6} for better layout with 2 items */}
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

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <FormControlLabel
                control={<Switch checked={showActiveLoans} onChange={(e) => setShowActiveLoans(e.target.checked)} />}
                label="Active Only"
            />
            <FormControlLabel
                control={<Switch checked={showOverdueLoans} onChange={(e) => setShowOverdueLoans(e.target.checked)} />}
                label="Overdue Only"
            />
            <FormControlLabel
                control={<Switch checked={showHighRisk} onChange={(e) => setShowHighRisk(e.target.checked)} />}
                label="High Risk"
            />
            {selectedBorrowerIds.length > 0 && (
              <Button 
                variant="outlined" 
                color="success" 
                size="small"
                onClick={() => {
                  const first = borrowers.find(b => b.id === selectedBorrowerIds[0]);
                  handleWhatsAppClick(first);
                }}
              >
                Remind Selected ({selectedBorrowerIds.length})
              </Button>
            )}
        </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress color="secondary" />
        </Box>
      ) : sortedAndFilteredBorrowers.length > 0 ? (
        <Grid container spacing={2}>
          {sortedAndFilteredBorrowers.map((borrower) => (
            <Grid item xs={12} sm={6} md={4} key={borrower.id}>
              <BorrowerCard 
                borrower={borrower} 
                associatedLoans={borrower.bLoans}
                score={borrower.score}
                onWhatsAppClick={handleWhatsAppClick}
                onPaymentClick={handlePaymentClick}
                onNoteClick={handleNoteClick}
                isSelected={selectedBorrowerIds.includes(borrower.id)}
                onSelect={toggleSelect}
              />
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

      {/* WhatsApp Dialog */}
      {selectedBorrower && (
        <WhatsAppDialog
          open={whatsAppOpen}
          onClose={handleWhatsAppClose}
          phoneNumber={selectedBorrower.phone}
          defaultMessage={`Hello ${selectedBorrower.name}, reaching out regarding your loan balance.`}
        />
      )}

      {/* Quick Note Dialog */}
      <Dialog open={noteOpen} onClose={() => setNoteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Quick Note for {selectedBorrower?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Follow-up Note"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g., Promised to pay by end of week"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNote} variant="contained" color="primary">Save Note</Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <AddPaymentDialog 
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        loanId={activeLoanId}
      />
    </Paper>
  );
}
