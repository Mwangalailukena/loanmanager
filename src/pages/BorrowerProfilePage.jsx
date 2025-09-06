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
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import GuarantorDialog from '../components/GuarantorDialog';
import { useCreditScore } from '../hooks/useCreditScore';

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

// Helper function to calculate status dynamically
const calcStatus = (loan) => {
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
    case 'Active':
    default:
      return { backgroundColor: '#2196F3', color: 'white' };
  }
};

export default function BorrowerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();
  const {
    borrowers, loans, loading, deleteBorrower,
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

  const { score, label, color } = useCreditScore(id, loans);

  const financialStats = useMemo(() => {
    const stats = associatedLoans.reduce((acc, loan) => {
      acc.totalLoaned += Number(loan.principal || 0);
      acc.totalRepaid += Number(loan.repaidAmount || 0);
      acc.outstanding += Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0);

      const status = calcStatus(loan); // Use calculated status
      if (status === 'Paid') acc.paidLoans += 1;
      else if (status === 'Overdue') acc.overdueLoans += 1;
      else if (status === 'Active') acc.activeLoans += 1;

      return acc;
    }, {
      totalLoaned: 0,
      totalRepaid: 0,
      outstanding: 0,
      activeLoans: 0,
      paidLoans: 0,
      overdueLoans: 0,
    });

    stats.totalLoans = associatedLoans.length;
    return stats;
  }, [associatedLoans]);

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
      <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
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
                <Stack direction="row" alignItems="center" spacing={1.5}><PhoneIcon color="action" /><Typography variant="body1">{borrower.phone}</Typography></Stack>
                <Stack direction="row" alignItems="center" spacing={1.5}><EmailIcon color="action" /><Typography variant="body1">{borrower.email || 'No email provided'}</Typography></Stack>
                {borrower.nationalId && <Stack direction="row" alignItems="center" spacing={1.5}><Fingerprint color="action" /><Typography variant="body1">{borrower.nationalId}</Typography></Stack>}
                {borrower.address && <Stack direction="row" alignItems="center" spacing={1.5}><HomeIcon color="action" /><Typography variant="body1">{borrower.address}</Typography></Stack>}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
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
                      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                        <Typography variant="h6" fontWeight="bold">Credit Score</Typography>
                        <Chip label={label} sx={{ backgroundColor: color, color: 'white', fontWeight: 'bold', my: 1 }} />
                        <Typography variant="h2" fontWeight="bold" sx={{ mt: 1 }}>{score}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                        <CardHeader title="Financial Snapshot" sx={{ p: 0, pb: 1 }} titleTypographyProps={{ fontWeight: 'bold', variant: 'h6' }} />
                        <List dense disablePadding>
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
                        <Divider sx={{ my: 1 }} />
                        <List dense disablePadding>
                          <ListItem disableGutters>
                            <ListItemText primary="Total Loans" secondary={`${financialStats.paidLoans} Paid, ${financialStats.activeLoans} Active, ${financialStats.overdueLoans} Overdue`} />
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
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        onClick={() => navigate(`/loans?borrowerId=${id}`)}
                      >
                        View All Loans
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/add-loan', { state: { borrower } })}
                      >
                        Add Loan
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => navigate('/add-payment', { state: { borrowerId: borrower.id } })}
                      >
                        Add Payment
                      </Button>
                    </Stack>
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
                    <Typography sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>This borrower has no associated loans.</Typography>
                  )}
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Guarantors</Typography>
                    <Button variant="contained" startIcon={<GroupAddIcon />} onClick={() => handleOpenGuarantorDialog()}>Add Guarantor</Button>
                  </Stack>
                  <List disablePadding>
                    {borrowerGuarantors.length > 0 ? borrowerGuarantors.map(g => (
                      <ListItem key={g.id} disablePadding divider>
                        <ListItemText primary={g.name} secondary={`Phone: ${g.phone}`} />
                        <Stack direction="row" spacing={1}>
                          <IconButton onClick={() => handleOpenGuarantorDialog(g)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton onClick={() => handleOpenDeleteGuarantorConfirm(g)}><DeleteIcon fontSize="small" /></IconButton>
                        </Stack>
                      </ListItem>
                    )) : (
                      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>No guarantors added.</Typography>
                    )}
                  </List>
                </TabPanel>

                <TabPanel value={activeTab} index={3}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>Internal Comments</Typography>
                  <Stack spacing={2}>
                    <List disablePadding>
                      {borrowerComments.length > 0 ? borrowerComments.map(comment => (
                        <ListItem key={comment.id} disablePadding sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                          <ListItemText 
                            primary={comment.text} 
                            secondary={`Added ${dayjs(comment.createdAt?.toDate()).fromNow()}`}
                          />
                          <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteComment(comment.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItem>
                      )) : (
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>No comments yet.</Typography>
                      )}
                    </List>
                    <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                      <TextField 
                        label="Add a new comment"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        fullWidth
                        multiline
                        size="small"
                      />
                      <Button variant="contained" onClick={handleAddComment} sx={{ height: 'fit-content', whiteSpace: 'nowrap' }}>Add Comment</Button>
                    </Stack>
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
