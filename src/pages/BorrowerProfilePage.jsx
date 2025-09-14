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
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Fingerprint from '@mui/icons-material/Fingerprint';
import HomeIcon from '@mui/icons-material/Home';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AddCommentIcon from '@mui/icons-material/AddComment';
import PostAddIcon from '@mui/icons-material/PostAdd';
import InfoIcon from '@mui/icons-material/Info';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import GuarantorDialog from '../components/GuarantorDialog';
import { useCreditScore } from '../hooks/useCreditScore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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

const calcStatus = (loan) => {
  if (loan.status === "Defaulted") return "Defaulted";
  const totalRepayable = Number(loan.totalRepayable || 0);
  const repaidAmount = Number(loan.repaidAmount || 0);

  if (repaidAmount >= totalRepayable && totalRepayable > 0) {
    return "Paid";
  }

  const now = dayjs();
  const due = dayjs(loan.dueDate);
  if (due.isBefore(now, "day")) {
    return "Overdue";
  }

  return "Active";
};

const getStatusChipColor = (status) => {
  switch (status) {
    case 'Paid':
      return { backgroundColor: '#4CAF50', color: 'white' };
    case 'Overdue':
      return { backgroundColor: '#F44336', color: 'white' };
    case 'Defaulted':
      return { backgroundColor: '#FFC107', color: 'white' };
    case 'Active':
    default:
      return { backgroundColor: '#2196F3', color: 'white' };
  }
};

const CreditScoreGauge = ({ score, color }) => {
    const scoreMin = 300;
    const scoreMax = 850;
    const normalizedScore = ((score - scoreMin) * 100) / (scoreMax - scoreMin);

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center' }}>
            <CircularProgress
                variant="determinate"
                value={100}
                size={150}
                thickness={4}
                sx={{ color: 'grey.300' }}
            />
            <CircularProgress
                variant="determinate"
                value={normalizedScore}
                size={150}
                thickness={4}
                sx={{ color: color, position: 'absolute', left: 0, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
            />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}
            >
                <Typography variant="h3" component="div" color="text.primary" fontWeight="bold">
                    {score}
                </Typography>
                <Typography variant="caption">Credit Score</Typography>
            </Box>
        </Box>
    );
};

export default function BorrowerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();
  const {
    borrowers, loans, payments, loading, deleteBorrower,
    comments, addComment, deleteComment,
    guarantors, deleteGuarantor
  } = useFirestore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [guarantorDialogOpen, setGuarantorDialogOpen] = useState(false);
  const [selectedGuarantor, setSelectedGuarantor] = useState(null);
  const [deleteGuarantorConfirmOpen, setDeleteGuarantorConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const borrower = borrowers.find((b) => b.id === id);
  const associatedLoans = loans.filter((loan) => loan.borrowerId === id);
  const borrowerComments = comments.filter(comment => comment.borrowerId === id);
  const borrowerGuarantors = guarantors.filter(g => g.borrowerId === id);

  const { score, label, color, history } = useCreditScore(id, loans, payments);

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
  
  const chartData = [
    { name: 'Repaid', value: financialStats.totalRepaid },
    { name: 'Outstanding', value: financialStats.outstanding },
  ].filter(item => item.value > 0); 

  const COLORS = ['#4CAF50', '#F44336'];

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
          <Grid item xs={12} md={3}>
            <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
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
                  <Link href={`tel:+260${borrower.phone.substring(1)}`} underline="hover" color="inherit">
                    <Typography variant="body1">{borrower.phone}</Typography>
                  </Link>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <EmailIcon color="action" />
                  {borrower.email ? (
                     <Link href={`mailto:${borrower.email}`} underline="hover" color="inherit">
                        <Typography variant="body1">{borrower.email}</Typography>
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

          <Grid item xs={12} md={9}>
            <Paper elevation={4} sx={{ borderRadius: 3 }}>
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
                    <Grid item xs={12} md={6}>
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
                            <CreditScoreGauge score={score} color={color} />
                            <Chip label={label} sx={{ backgroundColor: color, color: 'white', fontWeight: 'bold', mt: 2 }} />
                        </Box>
                        <Typography variant="subtitle2" gutterBottom>Scoring History</Typography>
                        <Paper variant="outlined" sx={{ p: 1, maxHeight: 100, overflowY: 'auto', fontSize: '0.75rem', backgroundColor: 'grey.100' }}>
                            {history.map((item, index) => <div key={index}>{item}</div>)}
                        </Paper>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
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
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                             <Typography variant="h6" fontWeight="bold">Loan Summary</Typography>
                             <Divider sx={{ my: 1 }} />
                            <List dense disablePadding>
                                <ListItem disableGutters>
                                    <ListItemText primary="Total Loans" secondary={`${financialStats.paidLoans} Paid, ${financialStats.activeLoans} Active, ${financialStats.overdueLoans} Overdue, ${financialStats.defaultedLoans} Defaulted`} />
                                    <Typography variant="h6" fontWeight="bold">{financialStats.totalLoans}</Typography>
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Associated Loans</Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/add-loan', { state: { borrower } })}
                        startIcon={<PostAddIcon />}
                      >
                        Add New Loan
                      </Button>
                  </Stack>
                  {associatedLoans.length > 0 ? (
                    <List disablePadding>
                      {associatedLoans.map((loan) => (
                        <Card key={loan.id} variant="outlined" sx={{ mb: 1.5 }}>
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography variant="body2" color="text.secondary">{dayjs(loan.startDate).format('DD MMM YYYY')}</Typography>
                                <Typography variant="h6" fontWeight="500">ZMW {Number(loan.principal).toLocaleString()}</Typography>
                              </Box>
                              <Chip label={calcStatus(loan)} sx={getStatusChipColor(calcStatus(loan))} size="small" />
                            </Stack>
                            <Divider sx={{ my: 1 }} />
                            <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '0.875rem' }}>
                              <Typography variant="body2">Total Repayable: <strong>ZMW {Number(loan.totalRepayable).toLocaleString()}</strong></Typography>
                              <Typography variant="body2">Due: <strong>{dayjs(loan.dueDate).format('DD MMM YYYY')}</strong></Typography>
                            </Stack>
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
                  {borrowerComments.length > 0 ? (
                    <List disablePadding>
                      {borrowerComments.map(comment => (
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
                </TabPanel>
              </Box>
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
    </>
  );
}
