import { useSearch } from "../contexts/SearchContext";

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
  Skeleton,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Edit,
  Delete,
  Payment,
  History,
  Info as InfoIcon,
  Close as CloseIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Autorenew as AutorenewIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material";
import { useFirestore } from "../contexts/FirestoreProvider";
import { exportToCsv } from "../utils/exportCSV";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { useSearchParams, Link } from "react-router-dom";
import { visuallyHidden } from '@mui/utils';
import TopUpLoanDialog from '../components/TopUpLoanDialog';
import { Grid } from "@mui/material";

const PAGE_SIZE = 10;

const interestOptions = [
  { label: "1 Week", value: 1 },
  { label: "2 Weeks", value: 2 },
  { label: "3 Weeks", value: 3 },
  { label: "4 Weeks", value: 4 },
];

const LoanListSkeleton = ({ isMobile }) => {
  const theme = useTheme();
  const rows = Array.from({ length: PAGE_SIZE });

  if (isMobile) {
    return (
      <Box>
        {rows.map((_, index) => (
          <Box
            key={index}
            sx={{
              marginBottom: 12,
              boxShadow: theme.shadows[1],
              borderRadius: theme.shape.borderRadius,
              borderLeft: `5px solid ${theme.palette.secondary.main}`,
              padding: 12,
              background: theme.palette.background.paper,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Box flexGrow={1} minWidth={0}>
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="60%" height={15} />
              </Box>
              <Stack alignItems="flex-end" spacing={0.5}>
                <Skeleton variant="rectangular" width={60} height={20} />
                <Skeleton variant="text" width={80} height={20} />
              </Stack>
              <Skeleton variant="circular" width={24} height={24} />
            </Stack>
          </Box>
        ))}
      </Box>
    );
  } else {
    return (
      <Table stickyHeader size="small" sx={{ tableLayout: "fixed", minWidth: 900 }}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" sx={{ py: 0.5 }}><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
            <TableCell align="center" sx={{ width: 30, py: 0.5 }}><Skeleton variant="text" width={20} height={20} /></TableCell>
            <TableCell sx={{ width: 140 }}><Skeleton variant="text" width="80%" height={20} /></TableCell>
            <TableCell sx={{ width: 110 }}><Skeleton variant="text" width="80%" height={20} /></TableCell>
            <TableCell align="right" sx={{ width: 90 }}><Skeleton variant="text" width="80%" height={20} /></TableCell>
            <TableCell align="right" sx={{ width: 90 }}><Skeleton variant="text" width="80%" height={20} /></TableCell>
            <TableCell align="right" sx={{ width: 110 }}><Skeleton variant="text" width="80%" height={20} /></TableCell>
            <TableCell align="right" sx={{ width: 110 }}><Skeleton variant="text" width="80%" height={20} /></TableCell>
            <TableCell sx={{ width: 100 }}><Skeleton variant="text" width="80%" height={20} /></TableCell>
            <TableCell sx={{ width: 100 }}><Skeleton variant="text" width="80%" height={20} /></TableCell>
            <TableCell sx={{ width: 90 }}><Skeleton variant="text" width="80%" height={20} /></TableCell>
            <TableCell align="center" sx={{ width: 120 }}><Skeleton variant="text" width="80%" height={20} /></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((_, index) => (
            <TableRow key={index} sx={{ py: 0.5 }}>
              <TableCell padding="checkbox" sx={{ py: 0.5 }}><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
              <TableCell align="center" sx={{ py: 0.5 }}><Skeleton variant="text" width={20} height={20} /></TableCell>
              <TableCell sx={{ py: 0.5 }}><Skeleton variant="text" width="90%" height={20} /></TableCell>
              <TableCell sx={{ py: 0.5 }}><Skeleton variant="text" width="90%" height={20} /></TableCell>
              <TableCell align="right" sx={{ py: 0.5 }}><Skeleton variant="text" width="90%" height={20} /></TableCell>
              <TableCell align="right" sx={{ py: 0.5 }}><Skeleton variant="text" width="90%" height={20} /></TableCell>
              <TableCell align="right" sx={{ py: 0.5 }}><Skeleton variant="text" width="90%" height={20} /></TableCell>
              <TableCell align="right" sx={{ py: 0.5 }}><Skeleton variant="text" width="90%" height={20} /></TableCell>
              <TableCell sx={{ py: 0.5 }}><Skeleton variant="text" width="90%" height={20} /></TableCell>
              <TableCell sx={{ py: 0.5 }}><Skeleton variant="text" width="90%" height={20} /></TableCell>
              <TableCell sx={{ py: 0.5 }}><Skeleton variant="rectangular" width={50} height={20} /></TableCell>
              <TableCell align="center" sx={{ py: 0.5 }}><Skeleton variant="rectangular" width={80} height={20} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
};

// ... (rest of imports)

export default function LoanList() {
  const { loans, loadingLoans, deleteLoan, addPayment, updateLoan, getPaymentsByLoanId, settings, borrowers, refinanceLoan, topUpLoan } = useFirestore();
  const { openLoanDetail } = useSearch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams, setSearchParams] = useSearchParams();

  const { searchTerm: globalSearchTerm, setSearchTerm: setGlobalSearchTerm } = useSearch(); // Directly use globalSearchTerm and setGlobalSearchTerm

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
  const [refinanceModal, setRefinanceModal] = useState({ open: false, loan: null });
  const [refinanceStartDate, setRefinanceStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [refinanceDueDate, setRefinanceDueDate] = useState(dayjs().add(1, "week").format("YYYY-MM-DD"));
  const [refinanceError, setRefinanceError] = useState("");
  const [isRefinancing, setIsRefinancing] = useState(false);
  const [refinancePreview, setRefinancePreview] = useState(null);
  
  const [sortKey, setSortKey] = useState("startDate");
  const [sortDirection, setSortDirection] = useState("desc");

  const [topUpModal, setTopUpModal] = useState({ open: false, loan: null });
  const [isToppingUp, setIsToppingUp] = useState(false);

  const interestRates = settings.interestRates || {
    1: 0.15,
    2: 0.2,
    3: 0.3,
    4: 0.3,
  };

  const calculateInterest = (principal, weeks) => principal * (interestRates[weeks] || 0);

  const getDisplayBorrowerInfo = useCallback((loan) => {
    if (loan.borrowerId) {
      const borrower = borrowers.find(b => b.id === loan.borrowerId);
      return { name: borrower?.name, phone: borrower?.phone };
    } else {
      // Old loan format
      return { name: loan.borrower, phone: loan.phone };
    }
  }, [borrowers]);

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
  
  const getStatusChipProps = (status) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "paid":
        return { label: "Paid", color: "success" };
      case "overdue":
        return { label: "Overdue", color: "error" };
      case "defaulted":
        return { label: "Defaulted", color: "warning" };
      case "refinanced":
        return { label: "Refinanced", color: "secondary" };
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
      // Smaller padding
      "& .MuiInputBase-input": {
        padding: "8.5px 14px",
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
    "& .MuiInputLabel-root": {
      fontSize: "0.875rem",
      transform: "translate(14px, 8.5px) scale(1)",
    },
    "& .MuiInputLabel-shrink": {
      transform: "translate(14px, -9px) scale(0.75)",
    },
  };
  
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
      setMonthFilter("2024-03");
    }

    // Use setGlobalSearchTerm to update the global search state
    // And set the local searchTerm for the TextField to reflect the global one
    setPage(1);
  }, [searchParams, statusFilter, monthFilter, globalSearchTerm]); // Depend on globalSearchTerm

  const activeSearchTerm = useMemo(() => {
    return globalSearchTerm; // activeSearchTerm now directly uses globalSearchTerm
  }, [globalSearchTerm]);

  const filteredLoans = useMemo(() => {
    const borrowerId = searchParams.get('borrowerId');

    let result = loans
      .filter((loan) => {
        if (borrowerId && loan.borrowerId !== borrowerId) return false;

        const displayInfo = getDisplayBorrowerInfo(loan);

        if (monthFilter && dayjs(loan.startDate).format("YYYY-MM") !== monthFilter) return false;
        
        if (statusFilter === 'upcoming') {
            if (loan.status === 'Defaulted') return false;
            const totalRepayable = Number(loan.totalRepayable || 0);
            const repaidAmount = Number(loan.repaidAmount || 0);
            if (repaidAmount >= totalRepayable && totalRepayable > 0) return false;
            const dueDate = dayjs(loan.dueDate);
            const now = dayjs();
            return dueDate.isAfter(now, "day") && dueDate.isBefore(now.add(7, 'day'), "day");
        }

        if (statusFilter !== "all" && calcStatus(loan).toLowerCase() !== statusFilter.toLowerCase()) return false;
        
        if (
          activeSearchTerm && 
          !(
            (displayInfo.name && displayInfo.name.toLowerCase().includes(activeSearchTerm.toLowerCase())) ||
            (displayInfo.phone && displayInfo.phone.toLowerCase().includes(activeSearchTerm.toLowerCase()))
          )
        )
          return false;
        return true;
      });
      
    if (sortKey) {
      result.sort((a, b) => {
        const displayInfoA = getDisplayBorrowerInfo(a);
        const displayInfoB = getDisplayBorrowerInfo(b);

        let valA = a[sortKey];
        let valB = b[sortKey];

        if (sortKey === "borrower") {
          valA = displayInfoA.name?.toLowerCase() || '';
          valB = displayInfoB.name?.toLowerCase() || '';
        } else if (sortKey === "phone") {
          valA = displayInfoA.phone?.toLowerCase() || '';
          valB = displayInfoB.phone?.toLowerCase() || '';
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
  }, [loans, activeSearchTerm, statusFilter, monthFilter, sortKey, sortDirection, getDisplayBorrowerInfo, searchParams]);
  
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
    const displayInfo = getDisplayBorrowerInfo(loan);
    setEditData({
      borrower: displayInfo.name || "",
      phone: displayInfo.phone || "",
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
    // Validate borrower/phone only if it's an old loan format
    if (!editModal.loan.borrowerId) {
      if (!editData.borrower) errors.borrower = "Borrower name is required.";
      if (!editData.phone) errors.phone = "Phone number is required.";
    }
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

    const updatedLoan = {
      ...editModal.loan,
      principal: principalAmount,
      interest: calculatedInterestAmount,
      totalRepayable: calculatedTotalRepayable,
      startDate: editData.startDate,
      dueDate: editData.dueDate,
      interestDuration: selectedDuration,
    };

    // Only update borrower and phone if it's an old loan format
    if (!editModal.loan.borrowerId) {
      updatedLoan.borrower = editData.borrower;
      updatedLoan.phone = editData.phone;
    }

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

  const calculateRefinancePreview = (loan, startDate) => {
    if (!loan) return;

    const outstandingBalance = (loan.totalRepayable || 0) - (loan.repaidAmount || 0);
    const newPrincipal = outstandingBalance;

    if (newPrincipal <= 0) {
      setRefinancePreview(null);
      return;
    }

    const interestDuration = loan.interestDuration || 1;
    const interestRate = interestRates[interestDuration] || 0;
    const newInterest = newPrincipal * interestRate;
    const newTotalRepayable = newPrincipal + newInterest;

    setRefinancePreview({
      principal: newPrincipal,
      interest: newInterest,
      totalRepayable: newTotalRepayable,
    });
  };

  const openTopUpModal = (loan) => {
    setTopUpModal({ open: true, loan });
  };

  const handleTopUpSubmit = async (topUpAmount) => {
    if (topUpModal.loan) {
      setIsToppingUp(true);
      try {
        await topUpLoan(topUpModal.loan.id, topUpAmount);
        setTopUpModal({ open: false, loan: null });
        setPaymentSuccess(true); // Or a new success message for top-up
      } catch (error) {
        console.error("Error topping up loan:", error);
      } finally {
        setIsToppingUp(false);
      }
    }
  };

  const openRefinanceModal = (loan) => {
    setRefinanceStartDate(dayjs().format("YYYY-MM-DD"));
    setRefinanceDueDate(dayjs().add(1, "week").format("YYYY-MM-DD"));
    setRefinanceError("");
    setRefinanceModal({ open: true, loan });
    calculateRefinancePreview(loan, dayjs().format("YYYY-MM-DD"));
  };

  const exportLoanListData = () => {
    const dataToExport = filteredLoans.map(loan => {
      const displayInfo = getDisplayBorrowerInfo(loan);
      const outstanding = (loan.totalRepayable || 0) - (loan.repaidAmount || 0);
      const status = calcStatus(loan);

      return {
        'Borrower': displayInfo.name,
        'Phone': displayInfo.phone,
        'Principal': loan.principal,
        'Interest': loan.interest,
        'Total Repayable': loan.totalRepayable,
        'Total Outstanding': outstanding,
        'Start Date': loan.startDate,
        'Due Date': loan.dueDate,
        'Status': status,
      };
    });

    exportToCsv("loan_records.csv", dataToExport);
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
      setPaymentSuccess(true);
    } catch (error) {
      console.error("Error refinancing loan:", error);
      setRefinanceError("Failed to refinance loan. Please try again.");
    } finally {
      setIsRefinancing(false);
    }
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 2 }}>
      <Typography variant="h6" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 1 }}>
        Loan Records
      </Typography>

      <Stack direction={isMobile ? "column" : "row"} spacing={1} mb={2} alignItems="center">
        <TextField
          label="Search"
          value={globalSearchTerm} // Directly use globalSearchTerm
          onChange={(e) => setGlobalSearchTerm(e.target.value)} // Directly update globalSearchTerm
          size="small"
          sx={{ ...filterInputStyles, minWidth: 160 }}
          variant="outlined"
          margin="dense"
          // Removed disabled and helperText related to globalSearchTerm if it's the primary input
          InputProps={{
              endAdornment: globalSearchTerm && ( // Check globalSearchTerm for clear button
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setGlobalSearchTerm("")}
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
            <MenuItem value="defaulted">Defaulted</MenuItem>
            <MenuItem value="upcoming">Upcoming</MenuItem>
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
          onClick={exportLoanListData}
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
        <LoanListSkeleton isMobile={isMobile} />
      ) : (
        <>
          {isMobile ? (
            <>
              <AnimatePresence>
                {displayedLoans.map((loan) => {
                  const outstanding = (loan.totalRepayable || 0) - (loan.repaidAmount || 0);
                  const isPaid = calcStatus(loan).toLowerCase() === "paid";
                  const displayInfo = getDisplayBorrowerInfo(loan);

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
                        <Box flexGrow={1} minWidth={0}>
                          <Typography variant="subtitle2" fontWeight="bold" noWrap>
                            <Link to={`/borrowers/${loan.borrowerId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              {displayInfo.name}
                            </Link>
                          </Typography>
                          <Typography variant="caption" color="textSecondary" noWrap>
                            {displayInfo.phone}
                          </Typography>
                        </Box>
                        <Stack alignItems="flex-end" spacing={0.5}>
                          <Chip size="small" {...getStatusChipProps(calcStatus(loan))} />
                          <Typography variant="body2" fontWeight="bold" sx={{ color: theme.palette.secondary.main }} noWrap>
                            ZMW {(outstanding).toFixed(2)}
                          </Typography>
                        </Stack>
                        <IconButton size="small" onClick={() => toggleRow(loan.id)} aria-label="expand" color="secondary">
                          {expandedRow === loan.id ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                        </IconButton>
                      </Stack>
                      <Collapse in={expandedRow === loan.id} timeout="auto" unmountOnExit>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Principal</Typography>
                                <Typography variant="body2" fontWeight="bold">ZMW {Number(loan.principal).toFixed(2)}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Interest</Typography>
                                <Typography variant="body2" fontWeight="bold">ZMW {Number(loan.interest).toFixed(2)}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Total Repayable</Typography>
                                <Typography variant="body2" fontWeight="bold">ZMW {Number(loan.totalRepayable).toFixed(2)}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Outstanding</Typography>
                                <Typography variant="body2" fontWeight="bold" color="secondary.main">{outstanding.toFixed(2)}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Start Date</Typography>
                                <Typography variant="body2">{loan.startDate}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Due Date</Typography>
                                <Typography variant="body2">{loan.dueDate}</Typography>
                              </Grid>
                            </Grid>
                            <Stack direction="row" spacing={0.5} mt={2} justifyContent="flex-start" sx={{ overflowX: 'auto' }}>
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
                              <Tooltip title="Top-up">
                                <span>
                                  <IconButton size="small" onClick={() => openTopUpModal(loan)} aria-label="top-up" disabled={isPaid || loan.repaidAmount > 0} color="secondary">
                                    <AttachMoneyIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="View History">
                                <IconButton size="small" onClick={() => openHistoryModal(loan.id)} aria-label="history" color="secondary">
                                  <History fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Details">
                                <IconButton size="small" onClick={() => openLoanDetail(loan.id)} aria-label="details" color="secondary">
                                  <InfoIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Refinance">
                                <span>
                                  <IconButton size="small" onClick={() => openRefinanceModal(loan)} aria-label="refinance" disabled={isPaid} color="secondary">
                                    <AutorenewIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </Box>
                        </motion.div>
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
                    const displayInfo = getDisplayBorrowerInfo(loan);

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
                            inputProps={{ "aria-label": `select loan ${displayInfo.name}` }}
                            size="small"
                            sx={{ '&.Mui-checked': { color: theme.palette.secondary.main } }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.5 }}>
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Link to={`/borrowers/${loan.borrowerId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {displayInfo.name}
                          </Link>
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>{displayInfo.phone}</TableCell>
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
                          <Tooltip title="Top-up">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => openTopUpModal(loan)}
                                aria-label="top-up"
                                disabled={isPaid || loan.repaidAmount > 0}
                                color="secondary"
                              >
                                <AttachMoneyIcon fontSize="small" />
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
                          <Tooltip title="Details">
                            <IconButton
                              size="small"
                              onClick={() => openLoanDetail(loan.id)}
                              aria-label="view details"
                              color="secondary"
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Refinance">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => openRefinanceModal(loan)}
                                aria-label="refinance"
                                disabled={isPaid}
                                color="secondary"
                              >
                                <AutorenewIcon fontSize="small" />
                              </IconButton>
                            </span>
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
            <Box textAlign="center" mt={4} p={2} border="1px dashed" borderColor="grey.400" borderRadius={2}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Loans Found
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                It looks like there are no loans matching your current filters.
              </Typography>
              <Button variant="contained" color="secondary" onClick={() => setSearchParams({})} startIcon={<AddCircleOutlineIcon />}>
                Clear Filters & Add Loan
              </Button>
            </Box>
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
            {editModal.loan?.borrowerId ? (
              <TextField
                label="Borrower Name"
                size="small"
                fullWidth
                value={borrowers.find(b => b.id === editModal.loan.borrowerId)?.name || ''}
                disabled
                sx={filterInputStyles}
              />
            ) : (
              <>
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
              </>
            )}
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
                {historyModal.payments.map((p) => (
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

      {/* Refinance Modal */}
      <Dialog open={refinanceModal.open} onClose={() => setRefinanceModal({ open: false, loan: null })} maxWidth="xs" fullWidth>
        <DialogTitle fontSize="1.1rem">Refinance Loan</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Stack spacing={2} mt={1}>
            <TextField
              label="New Start Date"
              type="date"
              value={refinanceStartDate}
              onChange={(e) => {
                setRefinanceStartDate(e.target.value)
                calculateRefinancePreview(refinanceModal.loan, e.target.value)
              }}
              size="small"
              fullWidth
              error={!!refinanceError}
              helperText={refinanceError}
              sx={filterInputStyles}
            />
            <TextField
              label="New Due Date"
              type="date"
              value={refinanceDueDate}
              onChange={(e) => setRefinanceDueDate(e.target.value)}
              size="small"
              fullWidth
              sx={filterInputStyles}
            />
            {refinancePreview && (
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Refinance Preview</Typography>
                <Typography variant="body2">New Principal: ZMW {refinancePreview.principal.toFixed(2)}</Typography>
                <Typography variant="body2">New Interest: ZMW {refinancePreview.interest.toFixed(2)}</Typography>
                <Typography variant="body2">New Total Repayable: ZMW {refinancePreview.totalRepayable.toFixed(2)}</Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ pb: 1 }}>
          <Button size="small" onClick={() => setRefinanceModal({ open: false, loan: null })} disabled={isRefinancing}> Cancel </Button>
          <Button size="small" variant="contained" onClick={handleRefinanceSubmit} disabled={isRefinancing || !refinancePreview} color="secondary">
            {isRefinancing ? <CircularProgress size={20} color="inherit" /> : 'Refinance'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Top-up Modal */}
      <TopUpLoanDialog
        open={topUpModal.open}
        onClose={() => setTopUpModal({ open: false, loan: null })}
        onConfirm={handleTopUpSubmit}
        loading={isToppingUp}
      />
    </Box>
  );
}
