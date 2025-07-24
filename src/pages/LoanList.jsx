// src/pages/LoanList.jsx
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
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Edit,
  Delete,
  Payment,
  History,
} from "@mui/icons-material";
import { useFirestore } from "../contexts/FirestoreProvider";
import { exportToCsv } from "../utils/exportCSV";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";

const PAGE_SIZE = 10;

export default function LoanList() {
  const { loans, deleteLoan, addPayment, updateLoan, getPaymentsByLoanId } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(dayjs().format("YYYY-MM"));
  const [page, setPage] = useState(1);
  const [useInfiniteScroll] = useState(isMobile);
  const [expandedRow, setExpandedRow] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, loanId: null });
  const [paymentModal, setPaymentModal] = useState({ open: false, loanId: null });
  const [editModal, setEditModal] = useState({ open: false, loan: null });
  const [historyModal, setHistoryModal] = useState({ open: false, loanId: null, payments: [] });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [editData, setEditData] = useState({
    borrower: "",
    phone: "",
    principal: "",
    interest: "",
    startDate: "",
    dueDate: "",
  });
  const [editError, setEditError] = useState("");
  const [selectedLoanIds, setSelectedLoanIds] = useState([]);

  const calcStatus = (loan) => {
    if (loan.status) return loan.status;
    const now = dayjs();
    const due = dayjs(loan.dueDate);
    if (loan.isPaid || (loan.repaidAmount >= loan.totalRepayable)) return "Paid";
    if (due.isBefore(now, "day")) return "Overdue";
    return "Active";
  };

  const filteredLoans = useMemo(() => {
    return loans
      .filter((loan) => {
        if (!loan.startDate.startsWith(monthFilter)) return false;
        if (statusFilter !== "all" && calcStatus(loan).toLowerCase() !== statusFilter) return false;
        if (
          searchTerm &&
          !(
            loan.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.phone.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
          return false;
        return true;
      })
      .sort((a, b) => dayjs(b.startDate).unix() - dayjs(a.startDate).unix());
  }, [loans, searchTerm, statusFilter, monthFilter]);

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
      if (useInfiniteScroll && displayedLoans.length < filteredLoans.length) {
        setPage((p) => p + 1);
      }
    }
  }, [displayedLoans.length, filteredLoans.length, useInfiniteScroll]);

  useEffect(() => {
    if (useInfiniteScroll && isMobile) {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, useInfiniteScroll, isMobile]);

  useEffect(() => {
    setPage(1);
    setExpandedRow(null);
  }, [searchTerm, statusFilter, monthFilter, useInfiniteScroll]);

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
    if (selectedLoanIds.length === displayedLoans.length) {
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

  const handleDelete = () => {
    if (confirmDelete.loanId) {
      deleteLoan(confirmDelete.loanId);
      setConfirmDelete({ open: false, loanId: null });
      setSelectedLoanIds((prev) => prev.filter(id => id !== confirmDelete.loanId));
    }
  };

  const openEditModal = (loan) => {
    setEditData({
      borrower: loan.borrower,
      phone: loan.phone,
      principal: loan.principal,
      interest: loan.interest,
      startDate: loan.startDate,
      dueDate: loan.dueDate,
    });
    setEditModal({ open: true, loan });
    setEditError("");
  };

  const handleEditSubmit = () => {
    if (
      !editData.borrower ||
      !editData.phone ||
      !editData.principal ||
      !editData.interest ||
      !editData.startDate ||
      !editData.dueDate
    ) {
      setEditError("Fill all fields.");
      return;
    }
    const updatedLoan = {
      ...editModal.loan,
      borrower: editData.borrower,
      phone: editData.phone,
      principal: parseFloat(editData.principal),
      interest: parseFloat(editData.interest),
      totalRepayable: parseFloat(editData.principal) + parseFloat(editData.interest),
      startDate: editData.startDate,
      dueDate: editData.dueDate,
    };
    updateLoan(editModal.loan.id, updatedLoan);
    setEditModal({ open: false, loan: null });
  };

  const openPaymentModal = (loanId) => {
    setPaymentAmount("");
    setPaymentError("");
    setPaymentModal({ open: true, loanId });
  };

  const handlePaymentSubmit = () => {
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      setPaymentError("Enter valid positive amount.");
      return;
    }
    addPayment(paymentModal.loanId, amountNum);
    setPaymentModal({ open: false, loanId: null });
  };

  const openHistoryModal = async (loanId) => {
    const payments = await getPaymentsByLoanId(loanId);
    setHistoryModal({ open: true, loanId, payments });
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <Box p={1}>
      <Typography variant="h6" mb={1}>
        Loan Records
      </Typography>

      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={1}
        mb={2}
        alignItems="center"
      >
        <TextField
          label="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 160 }}
          variant="outlined"
          margin="dense"
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
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
          onChange={(e) => setMonthFilter(e.target.value)}
          sx={{ maxWidth: 130 }}
          margin="dense"
        />
        <Button
          variant="outlined"
          size="small"
          onClick={() => exportToCsv("loans.csv", filteredLoans)}
          sx={{ height: 32 }}
        >
          Export CSV
        </Button>
      </Stack>

      {isMobile ? (
        <>
          <AnimatePresence>
            {displayedLoans.map((loan, index) => {
              const outstanding = (loan.totalRepayable || 0) - (loan.repaidAmount || 0);
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
                    borderLeft: `5px solid ${theme.palette.primary.main}`,
                    padding: 12,
                    background: theme.palette.background.paper,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight="600" noWrap>
                        {loan.borrower}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" noWrap>
                        {loan.phone}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => toggleRow(loan.id)} aria-label="expand">
                      {expandedRow === loan.id ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                    </IconButton>
                  </Stack>
                  <Collapse in={expandedRow === loan.id} timeout="auto" unmountOnExit>
                    <Box mt={1} fontSize="0.85rem" sx={{ color: theme.palette.text.secondary }}>
                      <Typography noWrap>Principal: ZMW {Number(loan.principal).toFixed(2)}</Typography>
                      <Typography noWrap>Interest: ZMW {Number(loan.interest).toFixed(2)}</Typography>
                      <Typography noWrap>Total Repayable: ZMW {Number(loan.totalRepayable).toFixed(2)}</Typography>
                      <Typography noWrap>Outstanding: ZMW {outstanding.toFixed(2)}</Typography>
                      <Typography noWrap>Start: {loan.startDate}</Typography>
                      <Typography noWrap>Due: {loan.dueDate}</Typography>
                      <Typography noWrap>Status: {calcStatus(loan)}</Typography>
                      <Stack direction="row" spacing={0.5} mt={1} justifyContent="flex-start">
                        <IconButton size="small" onClick={() => openEditModal(loan)} aria-label="edit">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setConfirmDelete({ open: true, loanId: loan.id })} aria-label="delete">
                          <Delete fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => openPaymentModal(loan.id)} aria-label="payment">
                          <Payment fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => openHistoryModal(loan.id)} aria-label="history">
                          <History fontSize="small" />
                        </IconButton>
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
                      selectedLoanIds.length > 0 &&
                      selectedLoanIds.length < displayedLoans.length
                    }
                    onChange={toggleSelectAll}
                    inputProps={{ "aria-label": "select all loans" }}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center" sx={{ width: 30, py: 0.5 }}>
                  #
                </TableCell>
                <TableCell sx={{ width: 140 }}>Borrower</TableCell>
                <TableCell sx={{ width: 110 }}>Phone</TableCell>
                <TableCell align="right" sx={{ width: 90 }}>
                  Principal
                </TableCell>
                <TableCell align="right" sx={{ width: 90 }}>
                  Interest
                </TableCell>
                <TableCell align="right" sx={{ width: 110 }}>
                  Total Repayable
                </TableCell>
                <TableCell align="right" sx={{ width: 110 }}>
                  Outstanding
                </TableCell>
                <TableCell sx={{ width: 100 }}>Start Date</TableCell>
                <TableCell sx={{ width: 100 }}>Due Date</TableCell>
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
                    <TableCell sx={{ py: 0.5 }}>{calcStatus(loan)}</TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => openEditModal(loan)}
                          aria-label="edit"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmDelete({ open: true, loanId: loan.id })}
                          aria-label="delete"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add Payment">
                        <IconButton
                          size="small"
                          onClick={() => openPaymentModal(loan.id)}
                          aria-label="add payment"
                        >
                          <Payment fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View History">
                        <IconButton
                          size="small"
                          onClick={() => openHistoryModal(loan.id)}
                          aria-label="view history"
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
                <TableCell align="right" sx={{ fontWeight: "bold", py: 0.5 }}>
                  {totals.principal.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold", py: 0.5 }}>
                  {totals.interest.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold", py: 0.5 }}>
                  {totals.totalRepayable.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold", py: 0.5 }}>
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
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Typography
                variant="body2"
                sx={{ alignSelf: "center", minWidth: 70, textAlign: "center" }}
              >
                Page {page} / {Math.ceil(filteredLoans.length / PAGE_SIZE)}
              </Typography>
              <Button
                size="small"
                disabled={page === Math.ceil(filteredLoans.length / PAGE_SIZE)}
                onClick={() =>
                  setPage((p) => Math.min(p + 1, Math.ceil(filteredLoans.length / PAGE_SIZE)))
                }
              >
                Next
              </Button>
            </Stack>
          )}
        </>
      )}

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, loanId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontSize="1.1rem">Confirm Delete</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          Are you sure you want to delete this loan?
        </DialogContent>
        <DialogActions sx={{ pb: 1 }}>
          <Button size="small" onClick={() => setConfirmDelete({ open: false, loanId: null })}>
            Cancel
          </Button>
          <Button size="small" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      <Dialog
        open={paymentModal.open}
        onClose={() => setPaymentModal({ open: false, loanId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontSize="1.1rem">Add Payment</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {paymentError && <Alert severity="error" sx={{ mb: 1 }}>{paymentError}</Alert>}
          <TextField
            label="Amount (ZMW)"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            size="small"
            autoFocus
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ pb: 1 }}>
          <Button size="small" onClick={() => setPaymentModal({ open: false, loanId: null })}>
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={handlePaymentSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Loan Modal */}
      <Dialog
        open={editModal.open}
        onClose={() => setEditModal({ open: false, loan: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontSize="1.1rem">Edit Loan</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {editError && <Alert severity="error" sx={{ mb: 1 }}>{editError}</Alert>}
          <Stack spacing={1}>
            <TextField
              label="Borrower"
              value={editData.borrower}
              onChange={(e) => setEditData({ ...editData, borrower: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label="Phone"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label="Principal (ZMW)"
              type="number"
              value={editData.principal}
              onChange={(e) => setEditData({ ...editData, principal: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label="Interest (ZMW)"
              type="number"
              value={editData.interest}
              onChange={(e) => setEditData({ ...editData, interest: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label="Start Date"
              type="date"
              value={editData.startDate}
              onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
            />
            <TextField
              label="Due Date"
              type="date"
              value={editData.dueDate}
              onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              size="small"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ pb: 1 }}>
          <Button size="small" onClick={() => setEditModal({ open: false, loan: null })}>
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={handleEditSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment History Modal */}
      <Dialog
        open={historyModal.open}
        onClose={() => setHistoryModal({ open: false, loanId: null, payments: [] })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontSize="1.1rem">Payment History</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 300 }}>
          {historyModal.payments.length === 0 ? (
            <Typography>No payments recorded.</Typography>
          ) : (
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount (ZMW)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyModal.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{dayjs(p.date).format("YYYY-MM-DD")}</TableCell>
                    <TableCell align="right">{Number(p.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 1 }}>
          <Button size="small" onClick={() => setHistoryModal({ open: false, loanId: null, payments: [] })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

