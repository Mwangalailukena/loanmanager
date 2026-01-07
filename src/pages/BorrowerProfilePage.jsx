import React, { useState, useMemo } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useSnackbar } from '../components/SnackbarProvider';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Avatar,
  Stack,
  Chip,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tabs,
  Tab,
  CardHeader,
  Link,
  Tooltip as MuiTooltip,
  useTheme,
  LinearProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Fingerprint from '@mui/icons-material/Fingerprint';
import HomeIcon from '@mui/icons-material/Home';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AddCommentIcon from '@mui/icons-material/AddComment';
import PostAddIcon from '@mui/icons-material/PostAdd';
import InfoIcon from '@mui/icons-material/Info';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // NEW
import Collapse from '@mui/material/Collapse'; // NEW
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import GuarantorDialog from '../components/GuarantorDialog';
import { useCreditScore } from '../hooks/useCreditScore';
import { ResponsiveLine } from '@nivo/line';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { calcStatus } from '../utils/loanUtils';
import WhatsAppDialog from '../components/WhatsAppDialog';

const CreditScoreHistoryChart = ({ history }) => {
  const theme = useTheme();
  const data = [
    {
      id: "Credit Score",
      data: history.map(h => ({ x: h.date, y: h.score })),
    },
  ];

  return (
    <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Credit Score History
      </Typography>
      <ResponsiveLine
        data={data}
        margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: true,
          reverse: false
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          orient: 'bottom',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Date',
          legendOffset: 36,
          legendPosition: 'middle'
        }}
        axisLeft={{
          orient: 'left',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Score',
          legendOffset: -40,
          legendPosition: 'middle'
        }}
        colors={{ scheme: 'category10' }}
        pointSize={10}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        useMesh={true}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: theme.palette.text.secondary,
              },
            },
            legend: {
              text: {
                fill: theme.palette.text.primary,
              },
            },
          },
          grid: {
            line: {
              stroke: theme.palette.divider,
            },
          },
          tooltip: {
            container: {
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
          },
        }}
      />
    </Paper>
  );
};

dayjs.extend(relativeTime);

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}


const getStatusChipColor = (status, theme) => {
  switch (status) {
    case 'Paid':
      return { backgroundColor: theme.palette.success.main, color: theme.palette.success.contrastText };
    case 'Overdue':
      return { backgroundColor: theme.palette.error.main, color: theme.palette.error.contrastText };
    case 'Defaulted':
      return { backgroundColor: theme.palette.warning.main, color: theme.palette.warning.contrastText };
    case 'Active':
    default:
      return { backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText };
  }
};

const CreditScoreCard = ({ score, remarks, positiveFactors, negativeFactors, stats, theme }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <CardHeader
        title="Credit Score"
        action={
          <MuiTooltip title="This score reflects the borrower's repayment history, loan terms, and overall reliability. A higher score indicates lower risk.">
            <InfoIcon color="action" />
          </MuiTooltip>
        }
        sx={{ p: 0, pb: 1 }}
        titleTypographyProps={{ fontWeight: 'bold', variant: 'h6' }}
      />
      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Typography variant="h2" component="div" fontWeight="bold" sx={{ color: getScoreColor(score) }}>
          {score}
        </Typography>
        <Chip label={remarks} color={getScoreColor(score).split('.')[0]} sx={{ fontWeight: 'bold', mt: 1 }} />
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" gutterBottom>Scoring Factors</Typography>
      <Stack spacing={1}>
        {positiveFactors.map((factor, index) => (
          <Typography key={index} variant="body2" sx={{ color: 'success.main' }}>+ {factor}</Typography>
        ))}
        {negativeFactors.map((factor, index) => (
          <Typography key={index} variant="body2" sx={{ color: 'error.main' }}>- {factor}</Typography>
        ))}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" gutterBottom>Statistics</Typography>
      <List dense disablePadding>
        <ListItem disableGutters><ListItemText primary="Total Loans" /><Typography variant="body2">{stats.totalLoans}</Typography></ListItem>
        <ListItem disableGutters><ListItemText primary="Paid Loans" /><Typography variant="body2">{stats.paidLoans}</Typography></ListItem>
        <ListItem disableGutters><ListItemText primary="Overdue Loans" /><Typography variant="body2">{stats.overdueLoans}</Typography></ListItem>
        <ListItem disableGutters><ListItemText primary="Defaulted Loans" /><Typography variant="body2">{stats.defaultedLoans}</Typography></ListItem>
        <ListItem disableGutters><ListItemText primary="On-Time Repayment Rate" /><Typography variant="body2">{(stats.repaymentRate * 100).toFixed(0)}%</Typography></ListItem>
      </List>
    </Paper>
  );
};

export default function BorrowerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();
  const {
    borrowers, loans, loading, deleteBorrower,
    comments, addComment, deleteComment,
    guarantors, deleteGuarantor,
    refinanceLoan,
    fetchComments,
  } = useFirestore();
  const theme = useTheme();

  useEffect(() => {
    if (id) {
        const unsub = fetchComments({ borrowerId: id });
        return () => unsub && unsub();
    }
  }, [id]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [guarantorDialogOpen, setGuarantorDialogOpen] = useState(false);
  const [selectedGuarantor, setSelectedGuarantor] = useState(null);
  const [deleteGuarantorConfirmOpen, setDeleteGuarantorConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [refinanceModal, setRefinanceModal] = useState({ open: false, loan: null });
  const [refinanceStartDate, setRefinanceStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [refinanceDueDate, setRefinanceDueDate] = useState(dayjs().add(1, "week").format("YYYY-MM-DD"));
  const [refinanceError, setRefinanceError] = useState("");
  const [isRefinancing, setIsRefinancing] = useState(false);
  const [loanSortKey, setLoanSortKey] = useState('dueDate'); // Default sort
  const [loanSortDirection, setLoanSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [expandedLoanId, setExpandedLoanId] = useState(null); // NEW
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [whatsAppPerson, setWhatsAppPerson] = useState(null);

  const handleWhatsAppClick = (person) => {
    setWhatsAppPerson(person);
    setWhatsAppOpen(true);
  };

  const handleWhatsAppClose = () => {
    setWhatsAppOpen(false);
    setWhatsAppPerson(null);
  };

  const getTextFieldStyles = (theme) => ({
    "& .MuiOutlinedInput-root": {
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.secondary.main,
      },
      "& .MuiInputBase-input": { padding: "10px 12px", fontSize: "0.875rem" },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.secondary.main },
    "& .MuiInputLabel-root": { fontSize: "0.875rem", transform: "translate(12px, 12px) scale(1)" },
    "& .MuiInputLabel-shrink": { transform: "translate(12px, -9px) scale(0.75)" },
    "& .MuiFormHelperText-root": { fontSize: "0.75rem" },
  });

  const textFieldStyles = getTextFieldStyles(theme);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const borrower = borrowers.find((b) => b.id === id);
  const associatedLoans = loans.filter((loan) => loan.borrowerId === id);
  const borrowerGuarantors = guarantors.filter(g => g.borrowerId === id);

  const creditScoreData = useCreditScore(associatedLoans);

  const financialStats = useMemo(() => {
    const stats = associatedLoans.reduce((acc, loan) => {
      acc.totalLoaned += Number(loan.principal || 0);
      acc.totalRepaid += Number(loan.repaidAmount || 0);
      acc.outstanding += Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0);

      const status = calcStatus(loan);
      if (status === 'Paid') acc.paidLoans += 1;
      else if (status === 'Overdue') acc.overdueLoans += 1;
      else if (status === 'Active') acc.activeLoans += 1;
      else if (status === 'Defaulted') acc.defaultedLoans += 1;

      return acc;
    }, {
      totalLoaned: 0,
      totalRepaid: 0,
      outstanding: 0,
      activeLoans: 0,
      paidLoans: 0,
      overdueLoans: 0,
      defaultedLoans: 0,
    });

    stats.totalLoans = associatedLoans.length;
    return stats;
  }, [associatedLoans]);

  const sortedAssociatedLoans = useMemo(() => {
    const sortableLoans = [...associatedLoans];
    return sortableLoans.sort((a, b) => {
      let valA, valB;

      switch (loanSortKey) {
        case 'startDate':
        case 'dueDate':
          valA = dayjs(a[loanSortKey]).valueOf();
          valB = dayjs(b[loanSortKey]).valueOf();
          break;
        case 'principal':
          valA = Number(a.principal || 0);
          valB = Number(b.principal || 0);
          break;
        case 'status':
          // Sort by status: Overdue > Defaulted > Active > Paid
          const statusOrder = { 'Overdue': 0, 'Defaulted': 1, 'Active': 2, 'Paid': 3 };
          valA = statusOrder[calcStatus(a)];
          valB = statusOrder[calcStatus(b)];
          break;
        default:
          valA = dayjs(a.dueDate).valueOf();
          valB = dayjs(b.dueDate).valueOf();
          break;
      }

      if (valA < valB) return loanSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return loanSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [associatedLoans, loanSortKey, loanSortDirection]);
  
  const chartData = [
    { name: 'Repaid', value: financialStats.totalRepaid },
    { name: 'Outstanding', value: financialStats.outstanding },
  ].filter(item => item.value > 0); 

  const COLORS = [theme.palette.success.main, theme.palette.error.main];

  // --- Handlers ---
  const handleOpenDeleteDialog = () => setDeleteDialogOpen(true);
  const handleCloseDeleteDialog = () => setDeleteDialogOpen(false);
  const handleDeleteConfirm = async () => {
    await deleteBorrower(id);
    showSnackbar('Borrower deleted successfully', 'success');
    navigate('/borrowers');
  };

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;
    await addComment(id, newComment);
    setNewComment('');
    showSnackbar('Comment added', 'success');
  };

  const handleDeleteComment = (commentId) => {
    deleteComment(commentId);
    showSnackbar('Comment deleted', 'success');
  };

  const handleOpenGuarantorDialog = (guarantor = null) => {
    setSelectedGuarantor(guarantor);
    setGuarantorDialogOpen(true);
  };

  const handleCloseGuarantorDialog = () => {
    setGuarantorDialogOpen(false);
    setSelectedGuarantor(null);
  };

  const handleOpenDeleteGuarantorConfirm = (guarantor) => {
    setSelectedGuarantor(guarantor);
    setDeleteGuarantorConfirmOpen(true);
  };

  const handleCloseDeleteGuarantorConfirm = () => {
    setDeleteGuarantorConfirmOpen(false);
    setSelectedGuarantor(null);
  };

  const handleDeleteGuarantor = async () => {
    if (!selectedGuarantor) return;
    await deleteGuarantor(selectedGuarantor.id);
    showSnackbar('Guarantor deleted', 'success');
    handleCloseDeleteGuarantorConfirm();
  };

  const openRefinanceModal = (loan) => {
    setRefinanceStartDate(dayjs().format("YYYY-MM-DD"));
    setRefinanceDueDate(dayjs().add(1, "week").format("YYYY-MM-DD"));
    setRefinanceError("");
    setRefinanceModal({ open: true, loan });
  };

  const handleRefinanceSubmit = async () => {
    if (!refinanceStartDate || !refinanceDueDate) {
      setRefinanceError("Both start and due dates are required.");
      return;
    }
    if (dayjs(refinanceDueDate).isBefore(dayjs(refinanceStartDate))) {
      setRefinanceError("Due date must be after the start date.");
      return;
    }

    setIsRefinancing(true);
    try {
      await refinanceLoan(refinanceModal.loan.id, refinanceStartDate, refinanceDueDate);
      setRefinanceModal({ open: false, loan: null });
      showSnackbar('Loan refinanced successfully', 'success');
    } catch (error) {
      setRefinanceError("Failed to refinance loan. Please try again.");
    } finally {
      setIsRefinancing(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress color="secondary" /></Box>;
  }

  if (!borrower) {
    return (
      <Paper sx={{ textAlign: 'center', p: 4, mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h6">Borrower not found.</Typography>
        <Button component={RouterLink} to="/borrowers" sx={{ mt: 2 }}>Back to Borrowers List</Button>
      </Paper>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
        <Grid container spacing={3}>
          <Grid xs={12} md={3}>
            <Paper elevation={4} sx={{ p: 3 }}>
              <Stack direction="column" alignItems="center" spacing={2}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main' }}><PersonIcon sx={{ fontSize: 50 }} /></Avatar>
                <Typography variant="h5" fontWeight="bold" textAlign="center">{borrower.name}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" color="primary" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>Back</Button>
                  <Button variant="outlined" color="secondary" startIcon={<EditIcon />} component={RouterLink} to={`/borrowers/${id}/edit`}>Edit</Button>
                  <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleOpenDeleteDialog}>Delete</Button>
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1.5}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <PhoneIcon color="action" />
                  <Link href={`tel:${borrower.phone}`} underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">{borrower.phone}</Typography>
                  </Link>
                  {/* WhatsApp Button */}
                  {borrower.phone && ( // Only show if phone number exists
                    <IconButton
                      size="small"
                      aria-label="whatsapp"
                      onClick={() => handleWhatsAppClick(borrower)}
                      sx={{ ml: 1, color: 'success.main' }} // WhatsApp green color
                    >
                      <WhatsAppIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <EmailIcon color="action" />
                  {borrower.email ? (
                     <Link href={`mailto:${borrower.email}`} underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">{borrower.email}</Typography>
                        <IconButton
                          size="small"
                          aria-label="email"
                          onClick={() => { window.location.href = `mailto:${borrower.email}`; }}
                          sx={{ ml: 1, color: 'primary.main' }}
                        >
                          <EmailIcon fontSize="small" />
                        </IconButton>
                     </Link>
                  ) : (
                    <Typography variant="body1" color="text.secondary">No email provided</Typography>
                  )}
                </Stack>
                {borrower.nationalId && <Stack direction="row" alignItems="center" spacing={1.5}><Fingerprint color="action" /><Typography variant="body1">{borrower.nationalId}</Typography></Stack>}
                {borrower.address && <Stack direction="row" alignItems="center" spacing={1.5}><HomeIcon color="action" /><Typography variant="body1">{borrower.address}</Typography></Stack>}
              </Stack>
            </Paper>
          </Grid>

          <Grid xs={12} md={9}>
            <Paper elevation={4}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="borrower profile tabs">
                  <Tab label="Summary" />
                  <Tab label="Associated Loans" />
                  <Tab label="Guarantors" />
                  <Tab label="Internal Comments" />
                </Tabs>
              </Box>

              <Box sx={{ minHeight: { xs: 'auto', md: 500 } }}>
                <TabPanel value={activeTab} index={0}>
                  <Grid container spacing={3}>
                    <Grid xs={12} md={6}>
                      <CreditScoreCard {...creditScoreData} theme={theme} />
                    </Grid>
                    <Grid xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                        <CardHeader title="Financial Snapshot" sx={{ p: 0, pb: 1 }} titleTypographyProps={{ fontWeight: 'bold', variant: 'h6' }} />
                        <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={60}
                                    fill="#8884d8"
                                    dataKey="value">
                                    {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `ZMW ${value.toLocaleString()}`} />
                                <Legend iconSize={10} />
                            </PieChart>
                        </ResponsiveContainer>
                         <List dense disablePadding sx={{mt: 2}}>
                            <ListItem disableGutters>
                                <ListItemText primary="Total Loaned" />
                                <Typography variant="body2">ZMW {financialStats.totalLoaned.toLocaleString()}</Typography>
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemText primary="Total Repaid" />
                                <Typography variant="body2" color="success.main">ZMW {financialStats.totalRepaid.toLocaleString()}</Typography>
                            </ListItem>
                            <ListItem disableGutters>
                                <ListItemText primary="Outstanding Balance" />
                                <Typography variant="body1" fontWeight="bold" color="error.main">ZMW {financialStats.outstanding.toLocaleString()}</Typography>
                            </ListItem>
                        </List>
                      </Paper>
                    </Grid>
                    <Grid xs={12}>
                      <CreditScoreHistoryChart history={creditScoreData.history} />
                    </Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Associated Loans</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={loanSortKey}
                                label="Sort By"
                                onChange={(e) => setLoanSortKey(e.target.value)}
                            >
                                <MenuItem value="startDate">Start Date</MenuItem>
                                <MenuItem value="dueDate">Due Date</MenuItem>
                                <MenuItem value="principal">Principal Amount</MenuItem>
                                <MenuItem value="status">Status</MenuItem>
                            </Select>
                        </FormControl>
                        <IconButton onClick={() => setLoanSortDirection(loanSortDirection === 'asc' ? 'desc' : 'asc')}>
                            {loanSortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                        </IconButton>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/add-loan', { state: { borrower } })}
                            startIcon={<PostAddIcon />}
                          >
                            Add New Loan
                          </Button>
                    </Stack>
                  </Stack>
                  {sortedAssociatedLoans.length > 0 ? (
                    <List disablePadding>
                      {sortedAssociatedLoans.map((loan) => (
                        <Card key={loan.id} variant="outlined" sx={{ mb: 1.5 }}>
                          <CardContent sx={{ pb: expandedLoanId === loan.id ? 0 : 2 }}> {/* Adjust padding for expansion */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Box onClick={() => setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id)} sx={{ cursor: 'pointer', flexGrow: 1 }}> {/* Make clickable */}
                                <Typography variant="body2" color="text.secondary">{dayjs(loan.startDate).format('DD MMM YYYY')}</Typography>
                                <Typography variant="h6" fontWeight="500">ZMW {Number(loan.principal).toLocaleString()}</Typography>
                              </Box>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Chip label={calcStatus(loan)} sx={getStatusChipColor(calcStatus(loan), theme)} size="small" />
                                <IconButton
                                  onClick={() => setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id)}
                                  aria-expanded={expandedLoanId === loan.id}
                                  aria-label="show more"
                                  sx={{
                                    transform: expandedLoanId === loan.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: theme.transitions.create('transform', {
                                      duration: theme.transitions.duration.shortest,
                                    }),
                                  }}
                                >
                                  <ExpandMoreIcon />
                                </IconButton>
                              </Stack>
                            </Stack>
                            <Divider sx={{ my: 1 }} />
                            <Collapse in={expandedLoanId === loan.id} timeout="auto" unmountOnExit>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">Loan Details:</Typography>
                                    <List dense disablePadding>
                                        <ListItem disableGutters><ListItemText primary="Loan ID" /><Typography variant="body2">{loan.id}</Typography></ListItem>
                                        <ListItem disableGutters><ListItemText primary="Term" /><Typography variant="body2">{loan.term} {loan.termUnit}</Typography></ListItem>
                                        <ListItem disableGutters><ListItemText primary="Interest Rate" /><Typography variant="body2">{loan.interestRate}%</Typography></ListItem>
                                        <ListItem disableGutters><ListItemText primary="Installment Amount" /><Typography variant="body2">ZMW {Number(loan.installmentAmount).toLocaleString()}</Typography></ListItem>
                                        {/* Add more detailed info here, e.g., repayment schedule breakdown */}
                                    </List>
                                    <Divider sx={{ my: 1 }} />
                                    <Stack direction="row" spacing={1} mt={1}>
                                      <Button size="small" variant="outlined" onClick={() => openRefinanceModal(loan)}>Refinance</Button>
                                    </Stack>
                                </Box>
                            </Collapse>
                            {! (expandedLoanId === loan.id) && ( // Show original action buttons if not expanded
                              <>
                                <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '0.875rem' }}>
                                  <Typography variant="body2">Total Repayable: <strong>ZMW {Number(loan.totalRepayable).toLocaleString()}</strong></Typography>
                                  <Typography variant="body2">Due: <strong>{dayjs(loan.dueDate).format('DD MMM YYYY')}</strong></Typography>
                                </Stack>
                                {/* Next Upcoming Due Date */}
                                {calcStatus(loan) === 'Active' && dayjs(loan.dueDate).isAfter(dayjs(), 'day') && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Next Payment Due: <strong>{dayjs(loan.dueDate).fromNow()}</strong> ({dayjs(loan.dueDate).format('DD MMM')})
                                    </Typography>
                                )}
                                {/* Loan Progress Indicator */}
                                {loan.totalRepayable > 0 && (
                                  <Box sx={{ width: '100%', mt: 1 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={(Number(loan.repaidAmount || 0) / Number(loan.totalRepayable || 0)) * 100} 
                                      sx={{ height: 8, borderRadius: 5 }} 
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                      {(Number(loan.repaidAmount || 0) / Number(loan.totalRepayable || 0) * 100).toFixed(1)}% repaid
                                    </Typography>
                                  </Box>
                                )}
                                <Stack direction="row" spacing={1} mt={1}>
                                  <Button size="small" variant="outlined" onClick={() => openRefinanceModal(loan)}>Refinance</Button>
                                </Stack>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </List>
                  ) : (
                    <Box textAlign="center" mt={4} p={3} sx={{ border: '1px dashed', borderColor: 'grey.300', borderRadius: 2 }}>
                        <Typography variant="h6" color="text.secondary">No Loans Yet</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Get started by adding the first loan for this borrower.
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => navigate('/add-loan', { state: { borrower } })}
                            startIcon={<PostAddIcon />}
                        >
                            Add First Loan
                        </Button>
                    </Box>
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Guarantors</Typography>
                    <Button variant="contained" startIcon={<GroupAddIcon />} onClick={() => handleOpenGuarantorDialog()}>Add Guarantor</Button>
                  </Stack>
                  {borrowerGuarantors.length > 0 ? (
                    <List disablePadding>
                        {borrowerGuarantors.map(g => (
                        <ListItem key={g.id} disablePadding divider>
                            <ListItemText primary={g.name} secondary={`Phone: ${g.phone}`} />
                            <Stack direction="row" spacing={1}>
                                {g.phone && (
                                    <>
                                        <IconButton
                                            size="small"
                                            aria-label="call guarantor"
                                            onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${g.phone}`; }}
                                            color="primary"
                                        >
                                            <PhoneIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            aria-label="whatsapp guarantor"
                                            onClick={(e) => { e.stopPropagation(); handleWhatsAppClick(g); }}
                                            sx={{ color: 'success.main' }}
                                        >
                                            <WhatsAppIcon fontSize="small" />
                                        </IconButton>
                                    </>
                                )}
                                {g.email && (
                                    <IconButton
                                        size="small"
                                        aria-label="email guarantor"
                                        onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${g.email}`; }}
                                        color="primary"
                                    >
                                        <EmailIcon fontSize="small" />
                                    </IconButton>
                                )}
                                <IconButton onClick={() => handleOpenGuarantorDialog(g)}><EditIcon fontSize="small" /></IconButton>
                                <IconButton onClick={() => handleOpenDeleteGuarantorConfirm(g)}><DeleteIcon fontSize="small" /></IconButton>
                            </Stack>
                        </ListItem>
                        ))}
                    </List>
                   ) : (
                    <Box textAlign="center" mt={4} p={3} sx={{ border: '1px dashed', borderColor: 'grey.300', borderRadius: 2 }}>
                        <Typography variant="h6" color="text.secondary">No Guarantors</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Add a guarantor to provide additional security for loans.
                        </Typography>
                        <Button variant="contained" color="secondary" startIcon={<GroupAddIcon />} onClick={() => handleOpenGuarantorDialog()}>
                            Add Guarantor
                        </Button>
                    </Box>
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>Internal Comments</Typography>
                  {comments.length > 0 ? (
                    <List disablePadding>
                      {comments.map(comment => (
                        <ListItem key={comment.id} disablePadding sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                          <ListItemText 
                            primary={comment.text} 
                            secondary={`Added ${dayjs(comment.createdAt?.toDate()).fromNow()}`}
                          />
                          <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteComment(comment.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                   ) : (
                    <Box textAlign="center" mt={4} p={3} sx={{ border: '1px dashed', borderColor: 'grey.300', borderRadius: 2 }}>
                        <Typography variant="h6" color="text.secondary">No Comments</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Leave a comment to keep track of interactions with this borrower.
                        </Typography>
                    </Box>
                  )}
                  <Stack direction="row" spacing={1} sx={{ pt: 2 }}>
                      <TextField 
                        label="Add a new comment"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        fullWidth
                        multiline
                        size="small"
                      />
                      <Button variant="contained" onClick={handleAddComment} sx={{ height: 'fit-content', whiteSpace: 'nowrap' }} startIcon={<AddCommentIcon />}>
                          Add
                      </Button>
                    </Stack>
                </TabPanel>              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <GuarantorDialog open={guarantorDialogOpen} onClose={handleCloseGuarantorDialog} borrowerId={id} guarantor={selectedGuarantor} />
      
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Borrower Deletion</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete this borrower? This action cannot be undone.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteGuarantorConfirmOpen} onClose={handleCloseDeleteGuarantorConfirm}>
        <DialogTitle>Confirm Guarantor Deletion</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete this guarantor? This action cannot be undone.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteGuarantorConfirm}>Cancel</Button>
          <Button onClick={handleDeleteGuarantor} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Refinance Modal */}
      <Dialog open={refinanceModal.open} onClose={() => setRefinanceModal({ open: false, loan: null })} maxWidth="xs" fullWidth>
        <DialogTitle fontSize="1.1rem">Refinance Loan</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Stack spacing={2} mt={1}>
            <TextField
              label="New Start Date"
              type="date"
              value={refinanceStartDate}
              onChange={(e) => setRefinanceStartDate(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!refinanceError}
              helperText={refinanceError}
              sx={textFieldStyles}
            />
            <TextField
              label="New Due Date"
              type="date"
              value={refinanceDueDate}
              onChange={(e) => setRefinanceDueDate(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={textFieldStyles}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ pb: 1 }}>
          <Button size="small" onClick={() => setRefinanceModal({ open: false, loan: null })} disabled={isRefinancing}> Cancel </Button>
          <Button size="small" variant="contained" onClick={handleRefinanceSubmit} disabled={isRefinancing} color="secondary">
            {isRefinancing ? <CircularProgress size={20} color="inherit" /> : 'Refinance'}
          </Button>
        </DialogActions>
      </Dialog>
      {whatsAppPerson && (
        <WhatsAppDialog
          open={whatsAppOpen}
          onClose={handleWhatsAppClose}
          phoneNumber={whatsAppPerson.phone}
          defaultMessage={`Hello ${whatsAppPerson.name},`}
        />
      )}
    </>
  );
}
