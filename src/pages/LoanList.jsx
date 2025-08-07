// src/components/LoanList.jsx
import React, { useState, useEffect, useMemo, useContext } from "react";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  TableSortLabel,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Tooltip,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Collapse,
  Alert,
  Checkbox,
  Snackbar,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import CloseIcon from "@mui/icons-material/Close";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Payment from "@mui/icons-material/Payment";
import History from "@mui/icons-material/History";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useSettings } from "../contexts/SettingsProvider";
import { useSnackbar } from "../contexts/SnackbarProvider";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../contexts/AuthProvider";

const PAGE_SIZE = 15;

function getStatusChipProps(status) {
  switch (status.toLowerCase()) {
    case "active":
      return {
        label: "Active",
        color: "secondary",
        variant: "outlined",
      };
    case "paid":
      return {
        label: "Paid",
        color: "success",
        variant: "filled",
      };
    case "overdue":
      return {
        label: "Overdue",
        color: "error",
        variant: "filled",
      };
    default:
      return { label: status, color: "default" };
  }
}

function calculateInterest(principal, duration) {
  if (isNaN(principal) || principal <= 0) return 0;
  const rates = {
    "weekly": 0.05,
    "monthly": 0.15,
    "annually": 0.5,
  };
  return principal * (rates[duration] || 0);
}

const filterInputStyles = {
  "& .MuiOutlinedInput-root": {
    "&.Mui-focused fieldset": {
      borderColor: "secondary.main",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "secondary.main",
  },
};

export default function LoanList({ globalSearchTerm }) {
  const {
    loans,
    loadingLoans,
    deleteLoan,
    updateLoan,
    addPayment,
    getPaymentsForLoan,
    deleteLoans,
  } = useFirestore();
  const { settings } = useSettings();
  const { showSnackbar } = useSnackbar();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [sortKey, setSortKey] = useState("borrower");
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(1);
  const [useInfiniteScroll, setUseInfiniteScroll] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    loanId: null,
  });
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    loanId: null,
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, loan: null });
  const [editData, setEditData] = useState({
    borrower: "",
    phone: "",
    principal: 0,
    interest: 0,
    interestDuration: "monthly",
    totalRepayable: 0,
    startDate: "",
    dueDate: "",
  });
  const [editErrors, setEditErrors] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [historyModal, setHistoryModal] = useState({
    open: false,
    loanId: null,
    payments: [],
    loading: false,
  });
  const [selectedLoanIds, setSelectedLoanIds] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [expandedRow, setExpandedRow] = useState(null);
  const { user } = useAuth();

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const interestOptions = useMemo(() => {
    if (!settings) return [];
    return [
      { label: "Weekly", value: "weekly" },
      { label: "Monthly", value: "monthly" },
      { label: "Annually", value: "annually" },
    ];
  }, [settings]);

  const calcStatus = (loan) => {
    if ((loan.totalRepayable || 0) <= (loan.repaidAmount || 0)) {
      return "Paid";
    }
    if (dayjs(loan.dueDate).isBefore(dayjs(), "day")) {
      return "Overdue";
    }
    return "Active";
  };

  useEffect(() => {
    if (globalSearchTerm) {
      setSearchTerm(globalSearchTerm);
    }
  }, [globalSearchTerm]);

  const filteredLoans = useMemo(() => {
    if (loadingLoans || !loans) {
      return [];
    }

    let filtered = loans;

    if (globalSearchTerm) {
      const lowerSearch = globalSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (loan) =>
          loan.borrower.toLowerCase().includes(lowerSearch) ||
          loan.phone.toLowerCase().includes(lowerSearch) ||
          loan.id.toLowerCase().includes(lowerSearch)
      );
    } else if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (loan) =>
          loan.borrower.toLowerCase().includes(lowerSearch) ||
          loan.phone.toLowerCase().includes(lowerSearch)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((loan) =>
        calcStatus(loan).toLowerCase().includes(statusFilter)
      );
    }

    if (monthFilter) {
      filtered = filtered.filter(
        (loan) => dayjs(loan.startDate).format("YYYY-MM") === monthFilter
      );
    }

    const outstanding = (loan) =>
      (loan.totalRepayable || 0) - (loan.repaidAmount || 0);

    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];

      if (sortKey === "outstanding") {
        aValue = outstanding(a);
        bValue = outstanding(b);
      }

      if (typeof aValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });

    return sorted;
  }, [loans, searchTerm, statusFilter, monthFilter, sortKey, sortDirection, loadingLoans, globalSearchTerm]);

  const onStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };
  const onMonthChange = (e) => {
    setMonthFilter(e.target.value);
    setPage(1);
  };
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };
  const handleDelete = async () => {
    if (!confirmDelete.loanId) return;
    setIsDeleting(true);
    try {
      await deleteLoan(confirmDelete.loanId);
      showSnackbar("Loan deleted successfully!", "success");
    } catch (error) {
      showSnackbar("Failed to delete loan.", "error");
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ open: false, loanId: null });
    }
  };
  const handleBulkDelete = async () => {
    if (selectedLoanIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await deleteLoans(selectedLoanIds);
      showSnackbar(`${selectedLoanIds.length} loans deleted successfully!`, "success");
      setSelectedLoanIds([]);
    } catch (error) {
      showSnackbar("Failed to delete loans.", "error");
    } finally {
      setIsBulkDeleting(false);
      setConfirmBulkDelete(false);
    }
  };
  const openPaymentModal = (loanId) => {
    setPaymentModal({ open: true, loanId });
  };
  const handlePaymentSubmit = async () => {
    if (paymentAmount <= 0) {
      setPaymentError("Amount must be greater than zero.");
      return;
    }
    setIsAddingPayment(true);
    try {
      await addPayment(paymentModal.loanId, parseFloat(paymentAmount));
      showSnackbar("Payment added successfully!", "success");
      setPaymentModal({ open: false, loanId: null });
      setPaymentAmount("");
      setPaymentSuccess(true);
    } catch (error) {
      showSnackbar("Failed to add payment.", "error");
    } finally {
      setIsAddingPayment(false);
    }
  };
  const openEditModal = (loan) => {
    setEditData({
      id: loan.id,
      borrower: loan.borrower,
      phone: loan.phone,
      principal: loan.principal,
      interest: loan.interest,
      interestDuration: loan.interestDuration,
      totalRepayable: loan.totalRepayable,
      startDate: loan.startDate,
      dueDate: loan.dueDate,
    });
    setEditModal({ open: true, loan });
  };
  const handleEditSubmit = async () => {
    setIsSavingEdit(true);
    const errors = {};
    if (!editData.borrower) errors.borrower = "Borrower name is required.";
    if (editData.principal <= 0) errors.principal = "Principal must be greater than zero.";
    if (!editData.startDate) errors.startDate = "Start date is required.";

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      setIsSavingEdit(false);
      return;
    }

    try {
      const updatedLoan = {
        ...editModal.loan,
        ...editData,
        principal: parseFloat(editData.principal),
        interest: parseFloat(editData.interest),
        totalRepayable: parseFloat(editData.totalRepayable),
      };
      await updateLoan(updatedLoan);
      showSnackbar("Loan updated successfully!", "success");
      setEditModal({ open: false, loan: null });
    } catch (error) {
      setEditErrors({ form: "Failed to update loan." });
    } finally {
      setIsSavingEdit(false);
    }
  };
  const openHistoryModal = async (loanId) => {
    setHistoryModal({ open: true, loanId, payments: [], loading: true });
    try {
      const payments = await getPaymentsForLoan(loanId);
      setHistoryModal((prev) => ({ ...prev, payments, loading: false }));
    } catch (error) {
      showSnackbar("Failed to load payment history.", "error");
      setHistoryModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const displayedLoans = useMemo(() => {
    if (useInfiniteScroll) {
      return filteredLoans;
    }
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredLoans.slice(start, end);
  }, [filteredLoans, page, useInfiniteScroll]);

  const totals = useMemo(() => {
    return filteredLoans.reduce(
      (acc, loan) => {
        const outstanding = (loan.totalRepayable || 0) - (loan.repaidAmount || 0);
        acc.principal += Number(loan.principal || 0);
        acc.interest += Number(loan.interest || 0);
        acc.totalRepayable += Number(loan.totalRepayable || 0);
        acc.outstanding += outstanding;
        return acc;
      },
      { principal: 0, interest: 0, totalRepayable: 0, outstanding: 0 }
    );
  }, [filteredLoans]);

  const handleScroll = () => {
    if (!useInfiniteScroll || !hasMore || loadingLoans) return;
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      setPage(prevPage => prevPage + 1);
    }
  };

  useEffect(() => {
    if (isMobile) {
      setUseInfiniteScroll(true);
      window.addEventListener("scroll", handleScroll);
    } else {
      setUseInfiniteScroll(false);
      window.removeEventListener("scroll", handleScroll);
    }
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, useInfiniteScroll, hasMore, loadingLoans]);

  useEffect(() => {
    if (useInfiniteScroll) {
      setHasMore(displayedLoans.length < filteredLoans.length);
    }
  }, [displayedLoans, filteredLoans, useInfiniteScroll]);

  const toggleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelectedIds = displayedLoans.map((loan) => loan.id);
      setSelectedLoanIds(newSelectedIds);
      return;
    }
    setSelectedLoanIds([]);
  };

  const toggleSelectLoan = (loanId) => {
    if (selectedLoanIds.includes(loanId)) {
      setSelectedLoanIds(selectedLoanIds.filter((id) => id !== loanId));
    } else {
      setSelectedLoanIds([...selectedLoanIds, loanId]);
    }
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Loan Records
      </Typography>

      <Stack direction={isMobile ? "column" : "row"} spacing={1} mb={2} alignItems="center">
        <TextField
          label="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ ...filterInputStyles, minWidth: 160 }}
          variant="outlined"
          margin="dense"
          disabled={!!globalSearchTerm}
          helperText={globalSearchTerm ? "Using global search" : ""}
          InputProps={{
              endAdornment: searchTerm && !globalSearchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm("")}
                    aria-label="clear search"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
          }}
        />
        <FormControl size="small" sx={{ ...filterInputStyles, minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={onStatusChange}
            margin="dense"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Month"
          type="month"
          size="small"
          value={monthFilter}
          onChange={onMonthChange}
          sx={{ ...filterInputStyles, maxWidth: 130 }}
          margin="dense"
        />
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          onClick={() => exportToCsv("loans.csv", filteredLoans)}
          sx={{ height: 32 }}
        >
          Export CSV
        </Button>
        {selectedLoanIds.length > 0 && (
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => setConfirmBulkDelete(true)}
            sx={{ height: 32 }}
            disabled={isBulkDeleting}
          >
            {isBulkDeleting ? <CircularProgress size={20} color="inherit" /> : `Delete (${selectedLoanIds.length})`}
          </Button>
        )}
      </Stack>

      {loadingLoans ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography ml={2} color="text.secondary">Loading loans...</Typography>
        </Box>
      ) : (
        <>
          {isMobile ? (
            <>
              <AnimatePresence>
                {displayedLoans.map((loan, index) => {
                  const outstanding = (loan.totalRepayable || 0) - (loan.repaidAmount || 0);
                  const isPaid = calcStatus(loan).toLowerCase() === "paid";
                  return (
                    <motion.div
                      key={loan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      layout
                      style={{
                        marginBottom: 12,
                        boxShadow: theme.shadows[1],
                        borderRadius: theme.shape.borderRadius,
                        borderLeft: `5px solid ${theme.palette.secondary.main}`,
                        padding: 12,
                        background: theme.palette.background.paper,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="600" noWrap>
                            {loan.borrower}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" noWrap>
                            {loan.phone}
                          </Typography>
                        </Box>
                        
                        {expandedRow !== loan.id && (
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Chip size="small" {...getStatusChipProps(calcStatus(loan))} />
                            <Typography 
                              variant="body2" 
                              fontWeight="bold" 
                              color="secondary.main" 
                              noWrap
                            >
                              ZMW {outstanding.toFixed(2)}
                            </Typography>
                          </Stack>
                        )}
                        
                        <IconButton size="small" onClick={() => toggleRow(loan.id)} aria-label="expand" color="secondary">
                          {expandedRow === loan.id ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                        </IconButton>
                      </Stack>
                      <Collapse in={expandedRow === loan.id} timeout="auto" unmountOnExit>
                        <Box mt={1} fontSize="0.85rem" sx={{ color: theme.palette.text.secondary }}>
                          <Typography noWrap>Principal: ZMW {Number(loan.principal).toFixed(2)}</Typography>
                          <Typography noWrap>Interest: ZMW {Number(loan.interest).toFixed(2)}</Typography>
                          <Typography noWrap>Total Repayable: ZMW {Number(loan.totalRepayable).toFixed(2)}</Typography>
                          
                          <Typography noWrap>Outstanding: <Typography component="span" fontWeight="bold" color="secondary.main">{outstanding.toFixed(2)}</Typography></Typography>
                          <Typography noWrap>Start: {loan.startDate}</Typography>
                          <Typography noWrap>Due: {loan.dueDate}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                            <Typography component="span" noWrap sx={{ mr: 1, color: 'text.secondary', fontSize: '0.85rem' }}>Status:</Typography>
                            <Chip size="small" {...getStatusChipProps(calcStatus(loan))} />
                          </Box>
                          
                          <Stack direction="row" spacing={0.5} mt={1} justifyContent="flex-start">
                            <Tooltip title="Edit">
                              <span>
                                <IconButton size="small" onClick={() => openEditModal(loan)} aria-label="edit" disabled={isPaid} color="secondary">
                                  <Edit fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <span>
                                <IconButton size="small" color="error" onClick={() => setConfirmDelete({ open: true, loanId: loan.id })} aria-label="delete" disabled={isPaid}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Add Payment">
                              <span>
                                <IconButton size="small" onClick={() => openPaymentModal(loan.id)} aria-label="payment" disabled={isPaid} color="secondary">
                                  <Payment fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="View History">
                              <IconButton size="small" onClick={() => openHistoryModal(loan.id)} aria-label="history" color="secondary">
                                <History fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </Collapse>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {useInfiniteScroll && displayedLoans.length < filteredLoans.length && (
                <Box textAlign="center" my={1}>
                  <CircularProgress size={24} />
                  <Typography variant="caption" display="block" mt={0.5} color="text.secondary">
                    Loading more...
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <>
              <Table stickyHeader size="small" sx={{ tableLayout: "fixed", minWidth: 900 }}>
                <TableHead sx={{ backgroundColor: theme.palette.background.paper }}>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ py: 0.5 }}>
                      <Checkbox
                        checked={selectedLoanIds.length === displayedLoans.length && displayedLoans.length > 0}
                        indeterminate={
                          selectedLoanIds.length > 0 && selectedLoanIds.length < displayedLoans.length
                        }
                        onChange={toggleSelectAll}
                        inputProps={{ "aria-label": "select all loans" }}
                        size="small"
                        sx={{ '&.Mui-checked': { color: theme.palette.secondary.main } }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: 30, py: 0.5 }}>
                      #
                    </TableCell>
                    <TableCell sx={{ width: 140 }} sortDirection={sortKey === 'borrower' ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === 'borrower'}
                        direction={sortKey === 'borrower' ? sortDirection : 'asc'}
                        onClick={() => handleSort('borrower')}
                      >
                        Borrower
                        {sortKey === 'borrower' ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 110 }} sortDirection={sortKey === 'phone' ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === 'phone'}
                        direction={sortKey === 'phone' ? sortDirection : 'asc'}
                        onClick={() => handleSort('phone')}
                      >
                        Phone
                        {sortKey === 'phone' ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ width: 90 }} sortDirection={sortKey === 'principal' ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === 'principal'}
                        direction={sortKey === 'principal' ? sortDirection : 'asc'}
                        onClick={() => handleSort('principal')}
                      >
                        Principal
                        {sortKey === 'principal' ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ width: 90 }} sortDirection={sortKey === 'interest' ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === 'interest'}
                        direction={sortKey === 'interest' ? sortDirection : 'asc'}
                        onClick={() => handleSort('interest')}
                      >
                        Interest
                        {sortKey === 'interest' ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ width: 110 }} sortDirection={sortKey === 'totalRepayable' ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === 'totalRepayable'}
                        direction={sortKey === 'totalRepayable' ? sortDirection : 'asc'}
                        onClick={() => handleSort('totalRepayable')}
                      >
                        Total Repayable
                        {sortKey === 'totalRepayable' ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ width: 110 }} sortDirection={sortKey === 'outstanding' ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === 'outstanding'}
                        direction={sortKey === 'outstanding' ? sortDirection : 'asc'}
                        onClick={() => handleSort('outstanding')}
                      >
                        Total Outstanding
                        {sortKey === 'outstanding' ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 100 }} sortDirection={sortKey === 'startDate' ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === 'startDate'}
                        direction={sortKey === 'startDate' ? sortDirection : 'asc'}
                        onClick={() => handleSort('startDate')}
                      >
                        Start Date
                        {sortKey === 'startDate' ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 100 }} sortDirection={sortKey === 'dueDate' ? sortDirection : false}>
                      <TableSortLabel
                        active={sortKey === 'dueDate'}
                        direction={sortKey === 'dueDate' ? sortDirection : 'asc'}
                        onClick={() => handleSort('dueDate')}
                      >
                        Due Date
                        {sortKey === 'dueDate' ? (
                          <Box component="span" sx={visuallyHidden}>
                            {sortDirection === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 90 }}>Status</TableCell>
                    <TableCell align="center" sx={{ width: 120 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedLoans.map((loan, idx) => {
                    const outstanding = (loan.totalRepayable || 0) - (loan.repaidAmount || 0);
                    const isSelected = selectedLoanIds.includes(loan.id);
                    const isPaid = calcStatus(loan).toLowerCase() === "paid";
                    return (
                      <TableRow
                        key={loan.id}
                        hover
                        role="checkbox"
                        aria-checked={isSelected}
                        selected={isSelected}
                        sx={{ cursor: "pointer", py: 0.5 }}
                      >
                        <TableCell padding="checkbox" sx={{ py: 0.5 }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleSelectLoan(loan.id)}
                            inputProps={{ "aria-label": `select loan ${loan.borrower}` }}
                            size="small"
                            sx={{ '&.Mui-checked': { color: theme.palette.secondary.main } }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.5 }}>
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>{loan.borrower}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>{loan.phone}</TableCell>
                        <TableCell align="right" sx={{ py: 0.5 }}>
                          {Number(loan.principal).toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 0.5 }}>
                          {Number(loan.interest).toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 0.5 }}>
                          {Number(loan.totalRepayable).toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ py: 0.5 }}>
                          {outstanding.toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>{loan.startDate}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>{loan.dueDate}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip size="small" {...getStatusChipProps(calcStatus(loan))} />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.5 }}>
                          <Tooltip title="Edit">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => openEditModal(loan)}
                                aria-label="edit"
                                disabled={isPaid}
                                color="secondary"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setConfirmDelete({ open: true, loanId: loan.id })}
                                aria-label="delete"
                                disabled={isPaid}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Add Payment">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => openPaymentModal(loan.id)}
                                aria-label="add payment"
                                disabled={isPaid}
                                color="secondary"
                              >
                                <Payment fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="View History">
                            <IconButton
                              size="small"
                              onClick={() => openHistoryModal(loan.id)}
                              aria-label="view history"
                              color="secondary"
                            >
                              <History fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} align="right" sx={{ fontWeight: "bold", py: 0.5 }}>
                      Totals:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", py: 0.5, color: theme.palette.secondary.main }}>
                      {totals.principal.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", py: 0.5, color: theme.palette.secondary.main }}>
                      {totals.interest.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", py: 0.5, color: theme.palette.secondary.main }}>
                      {totals.totalRepayable.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold", py: 0.5, color: theme.palette.secondary.main }}>
                      {totals.outstanding.toFixed(2)}
                    </TableCell>
                    <TableCell colSpan={4} />
                  </TableRow>
                </TableFooter>
              </Table>
              {!useInfiniteScroll && (
                <Stack direction="row" justifyContent="center" spacing={1} mt={1} mb={2}>
                  <Button
                    size="small"
                    color="secondary"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Typography variant="body2" sx={{ alignSelf: "center", minWidth: 70, textAlign: "center" }} >
                    Page {page} / {Math.ceil(filteredLoans.length / PAGE_SIZE)}
                  </Typography>
                  <Button
                    size="small"
                    color="secondary"
                    disabled={page === Math.ceil(filteredLoans.length / PAGE_SIZE)}
                    onClick={() => setPage((p) => Math.min(p + 1, Math.ceil(filteredLoans.length / PAGE_SIZE))) }
                  >
                    Next
                  </Button>
                </Stack>
              )}
            </>
          )}
          {!loadingLoans && filteredLoans.length === 0 && (
            <Typography variant="body1" align="center" mt={4} color="text.secondary">
              No loans found for the selected filters.
            </Typography>
          )}
        </>
      )}

      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, loanId: null })} maxWidth="xs" fullWidth >
        <DialogTitle fontSize="1.1rem">Confirm Delete</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          Are you sure you want to delete this loan?
        </DialogContent>
        <DialogActions sx={{ pb: 1 }}>
          <Button size="small" onClick={() => setConfirmDelete({ open: false, loanId: null })} disabled={isDeleting}> Cancel </Button>
          <Button size="small" color="error" onClick={handleDelete} disabled={isDeleting}> {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'} </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} maxWidth="xs" fullWidth >
        <DialogTitle fontSize="1.1rem">Confirm Bulk Delete</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          Are you sure you want to delete {selectedLoanIds.length} selected loans? This action cannot be undone.
        </DialogContent>
        <DialogActions sx={{ pb: 1 }}>
          <Button size="small" onClick={() => setConfirmBulkDelete(false)} disabled={isBulkDeleting}> Cancel </Button>
          <Button size="small" color="error" onClick={handleBulkDelete} disabled={isBulkDeleting}> {isBulkDeleting ? <CircularProgress size={20} color="inherit" /> : `Delete ${selectedLoanIds.length} Loans`} </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={paymentModal.open} onClose={() => setPaymentModal({ open: false, loanId: null })} maxWidth="xs" fullWidth >
        <DialogTitle fontSize="1.1rem">Add Payment</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <TextField
            label="Amount"
            type="number"
            value={paymentAmount}
            onChange={(e) => {
              setPaymentAmount(e.target.value);
              setPaymentError("");
            }}
            size="small"
            autoFocus
            fullWidth
            error={!!paymentError}
            helperText={paymentError}
            sx={filterInputStyles}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">ZMW</InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ pb: 1 }}>
          <Button size="small" onClick={() => setPaymentModal({ open: false, loanId: null })} disabled={isAddingPayment}> Cancel </Button>
          <Button size="small" variant="contained" onClick={handlePaymentSubmit} disabled={isAddingPayment} color="secondary">
            {isAddingPayment ? <CircularProgress size={20} color="inherit" /> : 'Add Payment'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={editModal.open} onClose={() => setEditModal({ open: false, loan: null })} maxWidth="xs" fullWidth>
        <DialogTitle fontSize="1.1rem">Edit Loan</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {editErrors.form && <Alert severity="error" sx={{ mb: 2 }}>{editErrors.form}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField
              label="Borrower Name"
              size="small"
              fullWidth
              value={editData.borrower}
              onChange={(e) => setEditData({ ...editData, borrower: e.target.value })}
              error={!!editErrors.borrower}
              helperText={editErrors.borrower}
              sx={filterInputStyles}
            />
            <TextField
              label="Phone Number"
              size="small"
              fullWidth
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              error={!!editErrors.phone}
              helperText={editErrors.phone}
              sx={filterInputStyles}
            />
            <TextField
              label="Principal Amount"
              size="small"
              type="number"
              fullWidth
              value={editData.principal}
              onChange={(e) => {
                const principal = parseFloat(e.target.value);
                const interest = calculateInterest(principal, editData.interestDuration);
                const totalRepayable = principal + interest;
                setEditData({ ...editData, principal: e.target.value, interest, totalRepayable });
              }}
              error={!!editErrors.principal}
              helperText={editErrors.principal}
              sx={filterInputStyles}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">ZMW</InputAdornment>
                ),
              }}
            />
            <FormControl size="small" fullWidth sx={filterInputStyles}>
              <InputLabel>Interest Duration</InputLabel>
              <Select
                value={editData.interestDuration}
                label="Interest Duration"
                onChange={(e) => {
                  const duration = e.target.value;
                  const principal = parseFloat(editData.principal);
                  const interest = calculateInterest(principal, duration);
                  const totalRepayable = principal + interest;
                  
                  setEditData({ ...editData, interestDuration: duration, interest, totalRepayable });
                }}
              >
                {interestOptions.map((option) => {
                  const rate = (settings.interestRates[option.value] || 0) * 100;
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label} ({rate.toFixed(0)}%)
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={editData.startDate}
              onChange={(e) => {
                const startDate = e.target.value;
                setEditData({ ...editData, startDate });
              }}
              error={!!editErrors.startDate}
              helperText={editErrors.startDate}
              sx={filterInputStyles}
            />
            <TextField
              label="Due Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={editData.dueDate}
              onChange={(e) => {
                const dueDate = e.target.value;
                setEditData({ ...editData, dueDate });
              }}
              sx={filterInputStyles}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ pb: 1 }}>
          <Button size="small" onClick={() => setEditModal({ open: false, loan: null })} disabled={isSavingEdit}>Cancel</Button>
          <Button size="small" variant="contained" onClick={handleEditSubmit} disabled={isSavingEdit} color="secondary">
            {isSavingEdit ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={historyModal.open} onClose={() => setHistoryModal({ open: false, loanId: null, payments: [], loading: false })} maxWidth="xs" fullWidth>
        <DialogTitle fontSize="1.1rem">Payment History</DialogTitle>
        <DialogContent dividers>
          {historyModal.loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
              <CircularProgress size={24} />
            </Box>
          ) : historyModal.payments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center">
              No payments recorded for this loan.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyModal.payments.map((p, index) => (
                  <TableRow key={p.id}>
                    <TableCell>{dayjs(p.date).format('YYYY-MM-DD')}</TableCell>
                    <TableCell align="right">ZMW {Number(p.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryModal({ open: false, loanId: null, payments: [], loading: false })} size="small" color="secondary">Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={paymentSuccess}
        autoHideDuration={4000}
        onClose={() => setPaymentSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setPaymentSuccess(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          Payment added successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
