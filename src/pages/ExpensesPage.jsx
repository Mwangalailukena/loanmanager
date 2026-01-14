import React, { useState, useMemo } from 'react';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useSnackbar } from '../components/SnackbarProvider';
import {
  Box, Typography, Button, List, ListItem, ListItemText, Paper,
  IconButton, Stack, Grid, Card, CardContent, CardHeader,
  TextField, Select, MenuItem, FormControl, InputLabel, ListSubheader,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Avatar, ListItemAvatar, useMediaQuery, useTheme, Menu, ListItemIcon, ToggleButtonGroup, ToggleButton,
  Skeleton,
} from '@mui/material';

// Import MUI Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import PeopleIcon from '@mui/icons-material/People';
import CampaignIcon from '@mui/icons-material/Campaign';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PaidIcon from '@mui/icons-material/Paid';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import localeData from 'dayjs/plugin/localeData';
import { SimplePieChart, SimpleBarChart } from '../components/charts/CustomSVGCharts';

import AddExpenseDialog from '../components/AddExpenseDialog';

dayjs.extend(isBetween);
dayjs.extend(localizedFormat);
dayjs.extend(localeData);

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Office Supplies': return <BusinessCenterIcon />;
    case 'Utilities': return <LightbulbIcon />;
    case 'Salaries': return <PeopleIcon />;
    case 'Marketing': return <CampaignIcon />;
    case 'Travel': return <TravelExploreIcon />;
    default: return <ReceiptLongIcon />;
  }
};

const ExpenseSkeleton = () => (
  <List sx={{ width: '100%', p: 0 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <ListItem key={i} sx={{ py: 2 }}>
        <ListItemAvatar>
          <Skeleton variant="circular" width={40} height={40} />
        </ListItemAvatar>
        <ListItemText 
          primary={<Skeleton variant="text" width="60%" />} 
          secondary={<Skeleton variant="text" width="30%" />} 
        />
        <Skeleton variant="text" width="80px" height={24} />
      </ListItem>
    ))}
  </List>
);

export default function ExpensesPage() {
  const { expenses, loading, deleteExpense } = useFirestore();
  const showSnackbar = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // --- STATE AND DATA LOGIC ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [viewBy, setViewBy] = useState('month'); // 'month' or 'year'

  const uniqueCategories = useMemo(() => {
    const categories = new Set(expenses.map(e => e.category));
    return ['All', ...Array.from(categories)];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const dateVal = expense.date?.toDate ? expense.date.toDate() : expense.date;
      const expenseDate = dayjs(dateVal);
      const isAfterStartDate = startDate ? expenseDate.isAfter(startDate.startOf('day')) : true;
      const isBeforeEndDate = endDate ? expenseDate.isBefore(endDate.endOf('day')) : true;
      const inDateRange = isAfterStartDate && isBeforeEndDate;
      const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
      return inDateRange && matchesCategory && matchesSearch;
    });
  }, [expenses, searchQuery, categoryFilter, startDate, endDate]);

  const summaryData = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const thisMonthTotal = filteredExpenses
      .filter(e => {
        const dateVal = e.date?.toDate ? e.date.toDate() : e.date;
        return dayjs(dateVal).isSame(dayjs(), 'month');
      })
      .reduce((sum, e) => sum + e.amount, 0);
    const thisYearTotal = filteredExpenses
      .filter(e => {
        const dateVal = e.date?.toDate ? e.date.toDate() : e.date;
        return dayjs(dateVal).isSame(dayjs(), 'year');
      })
      .reduce((sum, e) => sum + e.amount, 0);
    return { total, thisMonthTotal, thisYearTotal, count: filteredExpenses.length };
  }, [filteredExpenses]);

  const pieChartData = useMemo(() => {
    const dataByCat = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});
    
    return Object.entries(dataByCat).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const COLORS = ['#1976d2', '#d32f2f', '#f57c00', '#388e3c', '#7b1fa2', '#0288d1'];

  const barChartData = useMemo(() => {
    const monthlyTotals = Array(12).fill(0);
    filteredExpenses.forEach(expense => {
      const dateVal = expense.date?.toDate ? expense.date.toDate() : expense.date;
      const month = dayjs(dateVal).month();
      monthlyTotals[month] += expense.amount;
    });
    return dayjs.monthsShort().map((month, index) => ({
      name: month,
      Expenses: monthlyTotals[index]
    }));
  }, [filteredExpenses]);
  
  const groupedExpenses = useMemo(() => {
    const groups = {};
    filteredExpenses.forEach(expense => {
      const dateVal = expense.date?.toDate ? expense.date.toDate() : expense.date;
      const date = dayjs(dateVal);
      let groupTitle;
      if (date.isSame(dayjs(), 'day')) groupTitle = 'Today';
      else if (date.isSame(dayjs().subtract(1, 'day'), 'day')) groupTitle = 'Yesterday';
      else groupTitle = date.format('MMMM D, YYYY');
      if (!groups[groupTitle]) groups[groupTitle] = [];
      groups[groupTitle].push(expense);
    });
    return groups;
  }, [filteredExpenses]);

  // --- HANDLERS ---
  const handleAddClick = () => { setExpenseToEdit(null); setDialogOpen(true); };
  const handleCloseDialog = () => { setDialogOpen(false); setExpenseToEdit(null); };
  const handleMenuClick = (event, expense) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };
  const handleEditClick = () => {
    setExpenseToEdit(selectedExpense);
    setDialogOpen(true);
    handleMenuClose();
  };
  const openDeleteConfirm = () => {
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };
  const closeDeleteConfirm = () => setDeleteConfirmOpen(false);
  const handleDeleteConfirm = async () => {
    if (!selectedExpense) return;
    try {
      await deleteExpense(selectedExpense.id);
      showSnackbar('Expense deleted successfully!', 'success');
    } catch (error) {
      console.error("Failed to delete expense:", error);
      showSnackbar('Failed to delete expense.', 'error');
    } finally {
      closeDeleteConfirm();
    }
  };
  const handleViewByChange = (event, newViewBy) => {
    if (newViewBy !== null) {
      setViewBy(newViewBy);
    }
  };

  // --- RESPONSIVE TWO-COLUMN LAYOUT ---
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ bgcolor: (theme) => theme.palette.grey[100], minHeight: '100vh', p: { xs: 1, md: 3 } }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 700, color: 'text.primary' }}>Expense Dashboard</Typography>
            <Button variant="contained" disableElevation color="secondary" startIcon={<AddIcon />} onClick={handleAddClick}>
              Add Expense
            </Button>
          </Stack>

          <Grid container spacing={3}>
            {/* --- SIDEBAR (RIGHT COLUMN on Desktop, TOP on Mobile) --- */}
            <Grid item xs={12} md={4} order={{ xs: 1, md: 2 }}>
              <Stack spacing={3}>
                {/* --- SUMMARY CARD --- */}
                <Card sx={{ borderRadius: 3, elevation: 2 }}>
                  <CardHeader title="Summary" />
                  <CardContent>
                    <Stack spacing={2}>
                       {loading ? <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} /> : (
                         <>
                            <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}><CalendarMonthIcon /></Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight="bold">K {viewBy === 'month' ? summaryData.thisMonthTotal.toLocaleString() : summaryData.thisYearTotal.toLocaleString()}</Typography>
                                <Typography variant="body2" color="text.secondary">Total (This {viewBy === 'month' ? 'Month' : 'Year'})</Typography>
                              </Box>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
                              <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark' }}><PaidIcon /></Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight="bold">K {summaryData.total.toLocaleString()}</Typography>
                                <Typography variant="body2" color="text.secondary">Total (Filtered)</Typography>
                              </Box>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
                              <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.dark' }}><ReceiptLongIcon /></Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight="bold">{summaryData.count}</Typography>
                                <Typography variant="body2" color="text.secondary">Transactions</Typography>
                              </Box>
                            </Paper>
                         </>
                       )}
                    </Stack>
                  </CardContent>
                </Card>
                {/* --- CHART CARD --- */}
                <Card sx={{ borderRadius: 3, elevation: 2 }}>
                  <CardHeader title={viewBy === 'month' ? "Category Breakdown" : "Monthly Trends"} />
                  <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                     {loading ? <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 2 }} /> : (
                       filteredExpenses.length > 0 ? (
                        viewBy === 'month' ? (
                          <SimplePieChart data={pieChartData} colors={COLORS} size={250} />
                        ) : (
                          <SimpleBarChart data={barChartData} color={theme.palette.secondary.main} />
                        )
                      ) : <Typography color="text.secondary">No data for chart</Typography>
                     )}
                  </Box>
                </Card>
              </Stack>
            </Grid>

            {/* --- MAIN CONTENT (LEFT COLUMN on Desktop, BOTTOM on Mobile) --- */}
            <Grid item xs={12} md={8} order={{ xs: 2, md: 1 }}>
              <Card sx={{ borderRadius: 3, elevation: 2 }}>
                <CardHeader title="Transactions" action={
                  <ToggleButtonGroup
                    color="secondary"
                    value={viewBy}
                    exclusive
                    onChange={handleViewByChange}
                    aria-label="View by"
                    size="small"
                  >
                    <ToggleButton value="month">Month</ToggleButton>
                    <ToggleButton value="year">Year</ToggleButton>
                  </ToggleButtonGroup>
                } />
                <CardContent>
                  <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6} md={5}><TextField label="Search..." variant="outlined" size="small" fullWidth value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></Grid>
                    <Grid item xs={12} sm={6} md={3}><FormControl fullWidth size="small"><InputLabel>Category</InputLabel><Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>{uniqueCategories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={6} md={2}><DatePicker label="Start Date" value={startDate} onChange={setStartDate} slotProps={{ textField: { size: 'small' } }} /></Grid>
                    <Grid item xs={6} sm={6} md={2}><DatePicker label="End Date" value={endDate} onChange={setEndDate} slotProps={{ textField: { size: 'small' } }} /></Grid>
                  </Grid>
                </CardContent>
                {loading ? (
                  <ExpenseSkeleton />
                ) : filteredExpenses.length > 0 ? (
                  <List sx={{ width: '100%', p: 0 }} dense={isMobile}>
                    {Object.entries(groupedExpenses).map(([groupTitle, expensesInGroup]) => (
                      <Box key={groupTitle}>
                        <ListSubheader sx={{ bgcolor: (theme) => theme.palette.grey[100] }}>{groupTitle}</ListSubheader>
                        {expensesInGroup.map(expense => (
                          <ListItem key={expense.id} secondaryAction={
                            <IconButton size="small" onClick={(e) => handleMenuClick(e, expense)}><MoreVertIcon /></IconButton>
                          }>
                            <ListItemAvatar><Avatar sx={{ bgcolor: 'secondary.light' }}>{getCategoryIcon(expense.category)}</Avatar></ListItemAvatar>
                            <ListItemText primary={expense.description} secondary={dayjs(expense.date?.toDate ? expense.date.toDate() : expense.date).format('YYYY-MM-DD')} />
                            <Typography variant="body1" fontWeight={500}>K {Number(expense.amount).toLocaleString()}</Typography>
                          </ListItem>
                        ))}
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Typography sx={{ textAlign: 'center', p: 5, color: 'text.secondary' }}>No expenses match your filters.</Typography>
                )}
              </Card>
            </Grid>
          </Grid>
        </Box>
        
        {/* --- DIALOGS --- */}
        <AddExpenseDialog open={dialogOpen} onClose={handleCloseDialog} expenseToEdit={expenseToEdit} />
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleEditClick}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon><ListItemText>Edit</ListItemText></MenuItem>
          <MenuItem onClick={openDeleteConfirm}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText></MenuItem>
        </Menu>
        <Dialog open={deleteConfirmOpen} onClose={closeDeleteConfirm}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent><DialogContentText>Are you sure you want to permanently delete this expense?</DialogContentText></DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteConfirm}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}