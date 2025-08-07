// src/components/LoanList.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  IconButton,
  Collapse,
  Stack,
  Button,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Checkbox,
  Tooltip,
  Snackbar,
  Chip,
  TableSortLabel,
  InputAdornment,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Edit,
  Delete,
  Payment,
  History,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useFirestore } from "../contexts/FirestoreProvider";
import { exportToCsv } from "../utils/exportCSV";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import { visuallyHidden } from '@mui/utils';

const PAGE_SIZE = 10;

const interestOptions = [
  { label: "1 Week", value: 1 },
  { label: "2 Weeks", value: 2 },
  { label: "3 Weeks", value: 3 },
  { label: "4 Weeks", value: 4 },
];

export default function LoanList({ globalSearchTerm }) {
  const { loans, loadingLoans, deleteLoan, addPayment, updateLoan, getPaymentsByLoanId, settings } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get('filter') || "all");
  const [monthFilter, setMonthFilter] = useState(searchParams.get('month') || dayjs().format("YYYY-MM"));
  const [page, setPage] = useState(1);
  const [useInfiniteScroll] = useState(isMobile);
  const [expandedRow, setExpandedRow] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState({ open: false, loanId: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const [paymentModal, setPaymentModal] = useState({ open: false, loanId: null });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [editModal, setEditModal] = useState({ open: false, loan: null });
  const [editData, setEditData] = useState({
    borrower: "",
    phone: "",
    principal: "",
    interestDuration: 1,
    startDate: "",
    dueDate: "",
  });
  const [editErrors, setEditErrors] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [historyModal, setHistoryModal] = useState({ open: false, loanId: null, payments: [], loading: false });

  const [selectedLoanIds, setSelectedLoanIds] = useState([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const [sortKey, setSortKey] = useState("startDate");
  const [sortDirection, setSortDirection] = useState("desc");

  const interestRates = settings.interestRates || {
    1: 0.15,
    2: 0.2,
    3: 0.3,
    4: 0.3,
  };

  const calculateInterest = (principal, weeks) => principal * (interestRates[weeks] || 0);

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
  
  const getStatusChipProps = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "paid":
        return { label: "Paid", color: "success" };
      case "overdue":
        return { label: "Overdue", color: "error" };
      case "active":
      default:
        return { label: "Active", color: "primary" };
    }
  };

  const filterInputStyles = {
    "& .MuiOutlinedInput-root": {
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.secondary.main,
      },
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.palette.secondary.main,
    },
    "& .MuiSvgIcon-root": {
      "&.Mui-focused": {
        color: theme.palette.secondary.main,
      },
    },
  };
  
  // NEW/UPDATED: Sync the local search term with the global one.
  // This hook ensures the local search TextField reflects the global search input.
  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    const urlMonth = searchParams.get('month');

    if (urlFilter && urlFilter.toLowerCase() !== statusFilter.toLowerCase()) {
      setStatusFilter(urlFilter);
    } else if (!urlFilter && statusFilter !== "all") {
      setStatusFilter("all");
    }

    if (urlMonth && urlMonth !== monthFilter) {
      setMonthFilter(urlMonth);
    } else if (!urlMonth && monthFilter !== dayjs().format("YYYY-MM")) {
      setMonthFilter(dayjs().format("YYYY-MM"));
    }

    setSearchTerm(globalSearchTerm || "");
    setPage(1);
  }, [searchParams, statusFilter, monthFilter, globalSearchTerm]);

  const activeSearchTerm = useMemo(() => {
    return globalSearchTerm || searchTerm;
  }, [globalSearchTerm, searchTerm]);

  const filteredLoans = useMemo(() => {
    let result = loans
      .filter((loan) => {
        if (monthFilter && dayjs(loan.startDate).format("YYYY-MM") !== monthFilter) return false;
        
        if (statusFilter !== "all" && calcStatus(loan).toLowerCase() !== statusFilter.toLowerCase()) return false;
        
        if (
          activeSearchTerm && 
          !(
            loan.borrower.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
            loan.phone.toLowerCase().includes(activeSearchTerm.toLowerCase())
          )
        )
          return false;
        return true;
      });
      
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (sortKey === "borrower" || sortKey === "phone") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        } else if (sortKey.includes("Date")) {
          valA = dayjs(valA).unix();
          valB = dayjs(valB).unix();
        } else if (sortKey === 'outstanding') {
           valA = (a.totalRepayable || 0) - (a.repaidAmount || 0);
           valB = (b.totalRepayable || 0) - (b.repaidAmount || 0);
        } else {
          valA = Number(valA);
          valB = Number(valB);
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [loans, activeSearchTerm, statusFilter, monthFilter, sortKey, sortDirection]);
  
  const displayedLoans = useMemo(() => {
    if (useInfiniteScroll && isMobile) {
      return filteredLoans.slice(0, page * PAGE_SIZE);
    } else {
      const start = (page - 1) * PAGE_SIZE;
      return filteredLoans.slice(start, start + PAGE_SIZE);
    }
  }, [filteredLoans, page, useInfiniteScroll, isMobile]);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + window.scrollY + 50 >=
      document.documentElement.scrollHeight
    ) {
      if (useInfiniteScroll && displayedLoans.length < filteredLoans.length && !loadingLoans) {
        setPage((p) => p + 1);
      }
    }
  }, [displayedLoans.length, filteredLoans.length, useInfiniteScroll, loadingLoans]);

  useEffect(() => {
    if (useInfiniteScroll && isMobile) {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, useInfiniteScroll, isMobile]);

  useEffect(() => {
    setPage(1);
    setExpandedRow(null);
    setSelectedLoanIds([]);
  }, [activeSearchTerm, statusFilter, monthFilter, useInfiniteScroll]);

  const totals = useMemo(() => {
    return filteredLoans.reduce(
      (acc, loan) => {
        acc.principal += Number(loan.principal || 0);
        acc.interest += Number(loan.interest || 0);
        acc.totalRepayable += Number(loan.totalRepayable || 0);
        acc.outstanding += Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0);
        return acc;
      },
      { principal: 0, interest: 0, totalRepayable: 0, outstanding: 0 }
    );
  }, [filteredLoans]);

  const toggleSelectAll = () => {
    if (selectedLoanIds.length === displayedLoans.length && displayedLoans.length > 0) {
      setSelectedLoanIds([]);
    } else {
      setSelectedLoanIds(displayedLoans.map((loan) => loan.id));
    }
  };

  const toggleSelectLoan = (id) => {
    setSelectedLoanIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };
  
  const handleSort = (key) => {
    const isAsc = sortKey === key && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortKey(key);
  };

  const handleDelete = async () => {
    if (confirmDelete.loanId) {
      setIsDeleting(true);
      try {
        await deleteLoan(confirmDelete.loanId);
        setConfirmDelete({ open: false, loanId: null });
        setSelectedLoanIds((prev) => prev.filter(id => id !== confirmDelete.loanId));
      } catch (error) {
        console.error("Error deleting loan:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedLoanIds.map(id => deleteLoan(id)));
      setSelectedLoanIds([]);
      setConfirmBulkDelete(false);
    } catch (error) {
      console.error("Error bulk deleting loans:", error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const openEditModal = (loan) => {
    // The initial due date is set from the loan record, not recalculated
    setEditData({
      borrower: loan.borrower,
      phone: loan.phone,
      principal: loan.principal,
      interestDuration: loan.interestDuration || 1,
      startDate: loan.startDate,
      dueDate: loan.dueDate,
    });
    setEditErrors({});
    setEditModal({ open: true, loan });
  };

  const handleEditSubmit = async () => {
    const errors = {};
    if (!editData.borrower) errors.borrower = "Borrower name is required.";
    if (!editData.phone) errors.phone = "Phone number is required.";
    if (isNaN(parseFloat(editData.principal)) || parseFloat(editData.principal) < 0) errors.principal = "Valid principal required.";
    if (!editData.startDate) errors.startDate = "Start date is required.";

    setEditErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const principalAmount = parseFloat(editData.principal);
    const selectedDuration = editData.interestDuration;

    const calculatedInterestAmount = calculateInterest(principalAmount, selectedDuration);
    const calculatedTotalRepayable = principalAmount + calculatedInterestAmount;

    // The dueDate is not recalculated here; it is preserved from the original record.
    const updatedLoan = {
      ...editModal.loan,
      borrower: editData.borrower,
      phone: editData.phone,
      principal: principalAmount,
      interest: calculatedInterestAmount,
      totalRepayable: calculatedTotalRepayable,
      startDate: editData.startDate,
      dueDate: editData.dueDate,
      interestDuration: selectedDuration,
    };
    setIsSavingEdit(true);
    try {
      await updateLoan(editModal.loan.id, updatedLoan);
      setEditModal({ open: false, loan: null });
    } catch (error) {
      console.error("Error updating loan:", error);
      setEditErrors({ form: "Failed to update loan. Please try again." });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const openPaymentModal = (loanId) => {
    setPaymentAmount("");
    setPaymentError("");
    setPaymentModal({ open: true, loanId });
  };

  const handlePaymentSubmit = async () => {
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError("Payment amount must be a positive number.");
      return;
    }

    const loan = loans.find(l => l.id === paymentModal.loanId);
    const outstanding = (loan?.totalRepayable || 0) - (loan?.repaidAmount || 0);

    if (amountNum > outstanding) {
      setPaymentError(`Payment cannot exceed outstanding amount (ZMW ${outstanding.toFixed(2)}).`);
      return;
    }

    setIsAddingPayment(true);
    try {
      await addPayment(paymentModal.loanId, amountNum);
      setPaymentModal({ open: false, loanId: null });
      setPaymentSuccess(true);
    } catch (error) {
      console.error("Error adding payment:", error);
      setPaymentError("Failed to add payment. Please try again.");
    } finally {
      setIsAddingPayment(false);
    }
  };

  const openHistoryModal = async (loanId) => {
    setHistoryModal({ open: true, loanId, payments: [], loading: true });
    try {
      const payments = await getPaymentsByLoanId(loanId);
      setHistoryModal((prev) => ({ ...prev, payments, loading: false }));
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setHistoryModal((prev) => ({ ...prev, payments: [], loading: false }));
    }
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  
  const onMonthChange = useCallback(
    (e) => {
      const newMonth = e.target.value;
      if (newMonth) {
        searchParams.set("month", newMonth);
      } else {
        searchParams.delete("month");
      }
      setSearchParams(searchParams);
    },
    [searchParams, setSearchParams]
  );
  
  const onStatusChange = useCallback(
    (e) => {
      const newStatus = e.target.value;
      if (newStatus === "all") {
        searchParams.delete("filter");
      } else {
        searchParams.set("filter", newStatus);
      }
      setSearchParams(searchParams);
    },
    [searchParams, setSearchParams]
  );

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

      {/* Confirm Delete Dialog */}
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

      {/* Confirm Bulk Delete Dialog */}
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

      {/* Payment Modal */}
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
      
      {/* Edit Loan Modal */}
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
                  
                  // This fix ensures the dueDate is NOT recalculated when changing duration
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
      
      {/* Payment History Modal */}
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
