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
  const { loans, deleteLoan, addPayment, editLoan, getPaymentsByLoanId } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(dayjs().format("YYYY-MM"));

  // Pagination & Infinite Scroll
  const [page, setPage] = useState(1);
  const [useInfiniteScroll, setUseInfiniteScroll] = useState(isMobile);

  // Expanded Row for mobile collapsible
  const [expandedRow, setExpandedRow] = useState(null);

  // Modal states
  const [confirmDelete, setConfirmDelete] = useState({ open: false, loanId: null });
  const [paymentModal, setPaymentModal] = useState({ open: false, loanId: null });
  const [editModal, setEditModal] = useState({ open: false, loan: null });
  const [historyModal, setHistoryModal] = useState({ open: false, loanId: null, payments: [] });

  // Payment modal form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Edit modal form state
  const [editData, setEditData] = useState({
    borrower: "",
    phone: "",
    principal: "",
    interest: "",
    startDate: "",
    dueDate: "",
  });
  const [editError, setEditError] = useState("");

  // Helper: Calculate status for loan
  const calcStatus = (loan) => {
    const now = dayjs();
    const due = dayjs(loan.dueDate);
    if (loan.isPaid) return "Paid";
    if (due.isBefore(now, "day")) return "Overdue";
    return "Active";
  };

  // Filter & search loans
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
        acc.principal += loan.principal;
        acc.interest += loan.interest;
        acc.totalRepayable += loan.totalRepayable;
        acc.outstanding += loan.totalRepayable - (loan.amountPaid || 0);
        return acc;
      },
      { principal: 0, interest: 0, totalRepayable: 0, outstanding: 0 }
    );
  }, [filteredLoans]);

  // Delete Loan Handler
  const handleDelete = () => {
    if (confirmDelete.loanId) {
      deleteLoan(confirmDelete.loanId);
      setConfirmDelete({ open: false, loanId: null });
    }
  };

  // Open Edit Modal & populate data
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

  // Submit Edit Modal
  const handleEditSubmit = () => {
    if (
      !editData.borrower ||
      !editData.phone ||
      !editData.principal ||
      !editData.interest ||
      !editData.startDate ||
      !editData.dueDate
    ) {
      setEditError("Please fill all fields.");
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

    editLoan(editModal.loan.id, updatedLoan);
    setEditModal({ open: false, loan: null });
  };

  // Open Payment Modal
  const openPaymentModal = (loanId) => {
    setPaymentAmount("");
    setPaymentError("");
    setPaymentModal({ open: true, loanId });
  };

  // Submit Payment Modal
  const handlePaymentSubmit = () => {
    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      setPaymentError("Enter a valid positive amount.");
      return;
    }

    addPayment(paymentModal.loanId, amountNum);
    setPaymentModal({ open: false, loanId: null });
  };

  // Open History Modal and fetch payments
  const openHistoryModal = async (loanId) => {
    const payments = await getPaymentsByLoanId(loanId);
    setHistoryModal({ open: true, loanId, payments });
  };

  // Toggle expanded row for mobile
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>
        Loan Records
      </Typography>

      {/* Filters and search */}
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={2}
        mb={3}
        alignItems="center"
      >
        <TextField
          label="Search Borrower or Phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="overdue">Overdue</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Filter by Month"
          type="month"
          size="small"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          sx={{ maxWidth: 160 }}
        />
        <Button variant="outlined" onClick={() => exportToCsv("loans.csv", filteredLoans)}>
          Export CSV
        </Button>
      </Stack>

      {/* Mobile view: collapsible cards */}
      {isMobile ? (
        <>
          <AnimatePresence>
            {displayedLoans.map((loan) => (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                layout
                style={{
                  marginBottom: 16,
                  boxShadow: theme.shadows[1],
                  borderRadius: theme.shape.borderRadius,
                  borderLeft: `6px solid ${theme.palette.primary.main}`,
                  padding: 16,
                  background: theme.palette.background.paper,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {loan.borrower}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Phone: {loan.phone}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => toggleRow(loan.id)}>
                    {expandedRow === loan.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </IconButton>
                </Stack>
                <Collapse in={expandedRow === loan.id} timeout="auto" unmountOnExit>
                  <Box mt={2}>
                    <Typography>Principal: ZMW {loan.principal.toFixed(2)}</Typography>
                    <Typography>Interest: ZMW {loan.interest.toFixed(2)}</Typography>
                    <Typography>Total Repayable: ZMW {loan.totalRepayable.toFixed(2)}</Typography>
                    <Typography>Start Date: {loan.startDate}</Typography>
                    <Typography>Due Date: {loan.dueDate}</Typography>
                    <Typography>Status: {calcStatus(loan)}</Typography>
                    <Stack direction="row" spacing={1} mt={1}>
                      <IconButton onClick={() => openEditModal(loan)} aria-label="edit loan">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => setConfirmDelete({ open: true, loanId: loan.id })} aria-label="delete loan" color="error">
                        <Delete />
                      </IconButton>
                      <IconButton onClick={() => openPaymentModal(loan.id)} aria-label="add payment">
                        <Payment />
                      </IconButton>
                      <IconButton onClick={() => openHistoryModal(loan.id)} aria-label="view history">
                        <History />
                      </IconButton>
                    </Stack>
                  </Box>
                </Collapse>
              </motion.div>
            ))}
          </AnimatePresence>
          {useInfiniteScroll && displayedLoans.length < filteredLoans.length && (
            <Box textAlign="center" my={2}>
              <CircularProgress />
            </Box>
          )}
        </>
      ) : (
        <>
          {/* Desktop table */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Borrower</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Principal (ZMW)</TableCell>
                <TableCell>Interest (ZMW)</TableCell>
                <TableCell>Total Repayable (ZMW)</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>{loan.borrower}</TableCell>
                  <TableCell>{loan.phone}</TableCell>
                  <TableCell>{loan.principal.toFixed(2)}</TableCell>
                  <TableCell>{loan.interest.toFixed(2)}</TableCell>
                  <TableCell>{loan.totalRepayable.toFixed(2)}</TableCell>
                  <TableCell>{loan.startDate}</TableCell>
                  <TableCell>{loan.dueDate}</TableCell>
                  <TableCell>{calcStatus(loan)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton onClick={() => openEditModal(loan)} aria-label="edit loan">
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => setConfirmDelete({ open: true, loanId: loan.id })}
                        aria-label="delete loan"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                      <IconButton onClick={() => openPaymentModal(loan.id)} aria-label="add payment">
                        <Payment />
                      </IconButton>
                      <IconButton onClick={() => openHistoryModal(loan.id)} aria-label="view history">
                        <History />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell><strong>Totals:</strong></TableCell>
                <TableCell></TableCell>
                <TableCell><strong>{totals.principal.toFixed(2)}</strong></TableCell>
                <TableCell><strong>{totals.interest.toFixed(2)}</strong></TableCell>
                <TableCell><strong>{totals.totalRepayable.toFixed(2)}</strong></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell>
                  <strong>
                    Outstanding: {totals.outstanding.toFixed(2)}
                  </strong>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>

          {/* Pagination */}
          <Box mt={2} display="flex" justifyContent="center">
            <Button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={{ mr: 1 }}
            >
              Previous
            </Button>
            <Typography align="center" sx={{ pt: 1, minWidth: 40 }}>
              {page}
            </Typography>
            <Button
              disabled={page * PAGE_SIZE >= filteredLoans.length}
              onClick={() => setPage((p) => p + 1)}
              sx={{ ml: 1 }}
            >
              Next
            </Button>
          </Box>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, loanId: null })}
      >
        <DialogTitle>Delete Loan</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this loan? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, loanId: null })}>
            Cancel
          </Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Modal */}
      <Dialog
        open={paymentModal.open}
        onClose={() => setPaymentModal({ open: false, loanId: null })}
      >
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Payment Amount"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            fullWidth
            error={!!paymentError}
            helperText={paymentError}
            inputProps={{ min: 0, step: "0.01" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentModal({ open: false, loanId: null })}>
            Cancel
          </Button>
          <Button onClick={handlePaymentSubmit} variant="contained">
            Submit Payment
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
        <DialogTitle>Edit Loan</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error">{editError}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField
              label="Borrower"
              value={editData.borrower}
              onChange={(e) => setEditData({ ...editData, borrower: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Principal"
              type="number"
              value={editData.principal}
              onChange={(e) => setEditData({ ...editData, principal: e.target.value })}
              fullWidth
            />
            <TextField
              label="Interest"
              type="number"
              value={editData.interest}
              onChange={(e) => setEditData({ ...editData, interest: e.target.value })}
              fullWidth
            />
            <TextField
              label="Start Date"
              type="date"
              value={editData.startDate}
              onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Due Date"
              type="date"
              value={editData.dueDate}
              onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModal({ open: false, loan: null })}>
            Cancel
          </Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Modal */}
      <Dialog
        open={historyModal.open}
        onClose={() => setHistoryModal({ open: false, loanId: null, payments: [] })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Payment History</DialogTitle>
        <DialogContent>
          {historyModal.payments.length === 0 ? (
            <Typography>No payments recorded.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount (ZMW)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyModal.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{dayjs(p.date).format("YYYY-MM-DD")}</TableCell>
                    <TableCell>{p.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryModal({ open: false, loanId: null, payments: [] })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

