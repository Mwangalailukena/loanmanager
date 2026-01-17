import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useTheme, alpha } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import { useFirestore } from "../contexts/FirestoreProvider";
import { motion, AnimatePresence } from "framer-motion";

import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import PaymentIcon from "@mui/icons-material/Payment";
import LoginIcon from "@mui/icons-material/Login";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
import SettingsIcon from "@mui/icons-material/Settings";
import UndoIcon from "@mui/icons-material/Undo";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import InfoIcon from "@mui/icons-material/Info";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SecurityIcon from "@mui/icons-material/Security";
import CommentIcon from "@mui/icons-material/Comment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useSnackbar } from "../components/SnackbarProvider";

dayjs.extend(relativeTime);

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const actionLabels = {
  loan_creation: "Loan Created",
  edit: "Edited",
  payment_add: "Payment Made",
  login: "Login",
  delete: "Loan Deleted",
  settings_update: "Settings Updated",
  loan_defaulted: "Loan Defaulted",
  loan_refinanced: "Loan Refinanced",
  loan_update: "Loan Updated",
  loan_top_up: "Loan Topped Up",
  undo_loan_creation: "Undo: Loan Creation",
  undo_payment: "Undo: Payment",
  undo_refinance: "Undo: Refinance",
  undo_loan_delete: "Undo: Loan Deletion",
  undo_loan_update: "Undo: Loan Update",
  borrower_creation: "Borrower Added",
  expense_creation: "Expense Added",
  guarantor_creation: "Guarantor Added",
  comment_creation: "Comment Added",
  expense_deletion: "Expense Deleted",
  guarantor_deletion: "Guarantor Deleted",
  comment_deletion: "Comment Deleted",
  loan_deletion: "Loan Deleted",
  undo_borrower_creation: "Undo: Borrower Add",
  undo_expense_creation: "Undo: Expense Add",
  undo_guarantor_creation: "Undo: Guarantor Add",
  undo_comment_creation: "Undo: Comment Add",
  undo_expense_delete: "Undo: Expense Del",
  undo_guarantor_delete: "Undo: Guarantor Del",
  undo_comment_delete: "Undo: Comment Del",
};

// Colors for Chips based on action type
const actionChipColors = {
  loan_creation: "primary",
  edit: "default",
  payment_add: "success",
  login: "info",
  delete: "error",
  settings_update: "secondary",
  loan_defaulted: "warning",
  loan_refinanced: "secondary",
  loan_update: "default",
  loan_top_up: "primary",
  undo_loan_creation: "default",
  undo_payment: "default",
  undo_refinance: "default",
  undo_loan_delete: "default",
  undo_loan_update: "default",
  borrower_creation: "success",
  expense_creation: "warning",
  guarantor_creation: "info",
  comment_creation: "default",
  expense_deletion: "error",
  guarantor_deletion: "error",
  comment_deletion: "error",
};

const timelineDotColors = {
  ...actionChipColors,
  edit: "grey",
  payment_add: "success",
  loan_update: "grey",
  loan_top_up: "primary",
  undo_loan_creation: "grey",
  undo_payment: "grey",
  undo_refinance: "grey",
  undo_loan_delete: "grey",
  undo_loan_update: "grey",
};

const actionIcons = {
  loan_creation: <AddCircleOutlineIcon />,
  edit: <EditIcon />,
  payment_add: <PaymentIcon />,
  login: <LoginIcon />,
  delete: <DeleteIcon />,
  settings_update: <SettingsIcon />,
  loan_defaulted: <WarningIcon />,
  loan_refinanced: <AutorenewIcon />,
  loan_update: <EditIcon />,
  loan_top_up: <AttachMoneyIcon />,
  undo_loan_creation: <UndoIcon />,
  undo_payment: <UndoIcon />,
  undo_refinance: <UndoIcon />,
  undo_loan_delete: <UndoIcon />,
  undo_loan_update: <UndoIcon />,
  borrower_creation: <PeopleIcon />,
  expense_creation: <ReceiptIcon />,
  guarantor_creation: <SecurityIcon />,
  comment_creation: <CommentIcon />,
  expense_deletion: <DeleteIcon />,
  guarantor_deletion: <DeleteIcon />,
  comment_deletion: <DeleteIcon />,
};

const LogItem = React.memo(({ 
  log, 
  index, 
  search, 
  useRelativeTime, 
  handleMarkAsReviewed, 
  setConfirmUndo, 
  getUndoWarning, 
  highlightText, 
  theme 
}) => {
  const userDisplay = log.user || "System";
  const actionDisplay =
    actionLabels[log.type] ??
    (log.type ? log.type.replace(/_/g, " ") : "Unknown Action");

  const dateISO = log.date || log.createdAt;
  let dateStr = "No valid date";
  let relativeTime = "";
  if (dateISO) {
    try {
      const dateObj =
        typeof dateISO === "string"
          ? dayjs(dateISO)
          : dateISO.toDate
          ? dayjs(dateISO.toDate())
          : dayjs(dateISO);
      
      if (dateObj.isValid()) {
          relativeTime = dateObj.fromNow();
          dateStr = dateObj.toDate().toLocaleString();
      }
    } catch {
      // fallback if parsing fails
    }
  }

  const undoWarning = getUndoWarning(log);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={itemVariants}
    >
      <TimelineItem sx={{ '&::before': { content: 'none' } }}>
        <TimelineSeparator>
          <TimelineDot color={timelineDotColors[log.type] || "grey"} variant="outlined">
            {actionIcons[log.type] || null}
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent sx={{ py: '12px', px: 2 }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              backgroundColor: log.reviewed ? alpha(theme.palette.success.light, 0.1) : (index % 2 ? theme.palette.action.hover : 'transparent'),
              border: log.reviewed ? `1px solid ${alpha(theme.palette.success.main, 0.2)}` : 'none'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography
                      variant="subtitle1"
                      component="span"
                      fontWeight="bold"
                    >
                      {highlightText(userDisplay, search)}
                    </Typography>
                    <Chip
                      label={actionDisplay}
                      size="small"
                      color={actionChipColors[log.type] || "default"}
                      sx={{ textTransform: "capitalize" }}
                    />
                    {log.reviewed && <Chip label="Reviewed" size="small" variant="outlined" color="success" icon={<CheckCircleIcon fontSize="small" />} />}
                  </Box>
                }
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <>
                    <Tooltip
                      title={dateStr}
                      arrow
                      placement="top"
                      TransitionComponent={Fade}
                    >
                      <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5, fontStyle: "italic" }}
                    >
                      {useRelativeTime ? relativeTime : dateStr}
                    </Typography>
                    </Tooltip>
                    <Typography component="span" variant="body2">
                      {highlightText(log.description ?? "", search)}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      {log.undoable && !log.undone && (
                        <Tooltip title={undoWarning || ""}>
                          <span>
                            <Button
                              size="small"
                              onClick={() => setConfirmUndo({ open: true, log })}
                              startIcon={<UndoIcon />}
                              disabled={!!undoWarning}
                            >
                              Undo
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                      {!log.reviewed && (
                        <Button 
                          size="small" 
                          onClick={() => handleMarkAsReviewed(log.id)}
                          startIcon={<CheckCircleIcon />}
                          color="inherit"
                          sx={{ opacity: 0.6 }}
                        >
                          Mark Reviewed
                        </Button>
                      )}
                    </Box>
                  </>
                }
              />
            </Box>
          </Paper>
        </TimelineContent>
      </TimelineItem>
    </motion.div>
  );
});

export default function ActivityPage() {
  const { 
    activityLogs, 
    undoLoanCreation, 
    undoPayment, 
    undoRefinanceLoan, 
    undoDeleteLoan, 
    undoUpdateLoan,
    undoTopUpLoan,
    undoBorrowerCreation,
    undoExpenseCreation,
    undoGuarantorCreation,
    undoCommentCreation,
    undoExpenseDeletion,
    undoGuarantorDeletion,
    undoCommentDeletion,
    updateActivityLog,
    payments,
    fetchActivityLogs
  } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const showSnackbar = useSnackbar();

  const [confirmUndo, setConfirmUndo] = useState({ open: false, log: null });

  // Fetch activity logs on mount
  useEffect(() => {
    const unsub = fetchActivityLogs();
    return () => unsub && unsub();
  }, [fetchActivityLogs]);

  const ITEMS_PER_PAGE = 20;
  const [page, setPage] = useState(1);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const listRef = useRef(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [useRelativeTime, setUseRelativeTime] = useState(true);
  const [showUndoableOnly, setShowUndoableOnly] = useState(false);
  const [showUnreviewedOnly, setShowUnreviewedOnly] = useState(false);

  const getUndoWarning = useCallback((log) => {
    if (log.type === 'loan_creation') {
      const hasPayments = payments.some(p => p.loanId === log.relatedId);
      if (hasPayments) return "Cannot undo: Payments already recorded. Reverse payments first.";
    }
    return null;
  }, [payments]);

  // Reusable styles for the focused state of form fields
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

  const highlightText = useCallback((text = "", highlight) => {
    if (!text) return "";
    if (!highlight) return text;
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <Box
          component="span"
          key={i}
          sx={{ bgcolor: theme.palette.secondary.light, fontWeight: "bold" }}
        >
          {part}
        </Box>
      ) : (
        part
      )
    );
  }, [theme.palette.secondary.light]);

  const handleMarkAsReviewed = useCallback(async (id) => {
    try {
      await updateActivityLog(id, { reviewed: true });
      showSnackbar("Activity marked as reviewed", "success");
    } catch (error) {
      showSnackbar("Failed to mark as reviewed", "error");
    }
  }, [updateActivityLog, showSnackbar]);

  const filteredLogs = useMemo(() => {
    return activityLogs
      .filter((log) => {
        if (filterType !== "all" && log.type !== filterType) return false;
        if (showUndoableOnly && (!log.undoable || log.undone)) return false;
        if (showUnreviewedOnly && log.reviewed) return false;
        if (
          search &&
          !(log.description?.toLowerCase() || "").includes(search.toLowerCase()) &&
          !(log.user?.toLowerCase() || "").includes(search.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = a.date || a.createdAt || 0;
        const dateB = b.date || b.createdAt || 0;
        return new Date(dateB) - new Date(dateA);
      });
  }, [activityLogs, filterType, search, showUndoableOnly, showUnreviewedOnly]);

  const groupedLogs = useMemo(() => {
    const groups = {};
    displayedLogs.forEach(log => {
      const dateISO = log.date || log.createdAt;
      if (!dateISO) return;
      const date = typeof dateISO === "string" 
        ? dayjs(dateISO).toDate() 
        : dateISO.toDate ? dateISO.toDate() : new Date(dateISO);
      
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let dateKey = date.toLocaleDateString();
      if (date.toDateString() === today.toDateString()) dateKey = "Today";
      else if (date.toDateString() === yesterday.toDateString()) dateKey = "Yesterday";

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });
    return groups;
  }, [displayedLogs]);

  useEffect(() => {
    // Flatten grouped logs for initial display pagination if needed, 
    // or just use filteredLogs for the 'displayed' state.
    setDisplayedLogs(filteredLogs.slice(0, page * ITEMS_PER_PAGE));
  }, [filteredLogs, page]);

  useEffect(() => {
    if (!isMobile) return;

    const onScroll = () => {
      if (!listRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        if (displayedLogs.length < filteredLogs.length) {
          setPage((p) => p + 1);
        }
      }
    };

    const container = listRef.current;
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [displayedLogs.length, filteredLogs.length, isMobile]);

  useEffect(() => {
    setPage(1);
  }, [filterType, search]);

  const handleUndo = async () => {
    if (!confirmUndo.log) return;

    const { id, type, relatedId, amount, undoData } = confirmUndo.log;

    if (!relatedId && type !== "loan_deletion" && type !== "expense_deletion" && type !== "guarantor_deletion" && type !== "comment_deletion") {
      showSnackbar("Cannot undo: Missing related ID.", "error");
      setConfirmUndo({ open: false, log: null });
      return;
    }

    try {
      if (type === "loan_creation") {
        await undoLoanCreation(relatedId, id);
      } else if (type === "payment_add") {
        if (!confirmUndo.log.loanId) throw new Error("Missing loan ID for payment undo");
        await undoPayment(relatedId, confirmUndo.log.loanId, amount, id);
      } else if (type === "loan_refinanced") {
         if (!confirmUndo.log.oldLoanId) throw new Error("Missing old loan ID for refinance undo");
        await undoRefinanceLoan(relatedId, confirmUndo.log.oldLoanId, id);
      } else if (type === "loan_deletion" || type === "delete") { // Handle both just in case
        if (!undoData || !undoData.id) throw new Error("Missing data to undo deletion");
        await undoDeleteLoan(undoData, id);
      } else if (type === "loan_update") {
         if (!undoData) throw new Error("Missing data to undo update");
        await undoUpdateLoan(relatedId, undoData, id);
      } else if (type === "loan_top_up") {
         if (!undoData) throw new Error("Missing data to undo top-up");
        await undoTopUpLoan(relatedId, undoData, id);
      } else if (type === "borrower_creation") {
        await undoBorrowerCreation(relatedId, id);
      } else if (type === "expense_creation") {
        await undoExpenseCreation(relatedId, id);
      } else if (type === "guarantor_creation") {
        await undoGuarantorCreation(relatedId, id);
      } else if (type === "comment_creation") {
        await undoCommentCreation(relatedId, id);
      } else if (type === "expense_deletion") {
         if (!undoData || !undoData.id) throw new Error("Missing data to undo expense deletion");
        await undoExpenseDeletion(undoData, id);
      } else if (type === "guarantor_deletion") {
        if (!undoData || !undoData.id) throw new Error("Missing data to undo guarantor deletion");
        await undoGuarantorDeletion(undoData, id);
      } else if (type === "comment_deletion") {
         if (!undoData || !undoData.id) throw new Error("Missing data to undo comment deletion");
        await undoCommentDeletion(undoData, id);
      }

      // The undo functions in the provider delete the original activity log, 
      // so we don't need to update it here.
      
      showSnackbar("Action undone successfully!", "success");
    } catch (error) {
      console.error("Error undoing action:", error);
      showSnackbar(`Failed to undo action: ${error.message}`, "error");
    }

    setConfirmUndo({ open: false, log: null });
  };

  return (
    <Box
      p={3}
      maxWidth={700}
      mx="auto"
      height={isMobile ? "80vh" : "auto"}
      sx={{ overflowY: isMobile ? "auto" : "visible" }}
      ref={listRef}
    >
      <Typography variant="h4" gutterBottom component="span">
        Activity Log
      </Typography>
      <Tooltip
        title={
          <Box>
            <Typography variant="subtitle2" gutterBottom>Activity Type Legend</Typography>
            {Object.entries(actionLabels).map(([type, label]) => (
              <Stack direction="row" alignItems="center" spacing={1} key={type}>
                <TimelineDot
                  color={timelineDotColors[type] || "grey"}
                  variant="outlined"
                  sx={{ width: 16, height: 16, my: 0 }}
                >
                  {actionIcons[type] || null}
                </TimelineDot>
                <Chip
                  label={label}
                  size="small"
                  color={actionChipColors[type] || "default"}
                  sx={{ textTransform: "capitalize" }}
                />
              </Stack>
            ))}
          </Box>
        }
        arrow
        placement="right"
        TransitionComponent={Fade}
      >
        <IconButton size="small" sx={{ ml: 1 }}>
          <InfoIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <TextField
          sx={{ ...filterInputStyles, flexGrow: 2 }} // Increased flexGrow to make it wider
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
        />
        <FormControl sx={{ minWidth: 160, ...filterInputStyles, flexGrow: 1 }} size="small">
          <InputLabel>Type</InputLabel>
          <Select
            value={filterType}
            label="Type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="loan_creation">Loan Creation</MenuItem>
            <MenuItem value="edit">Edit</MenuItem>
            <MenuItem value="payment">Payment</MenuItem>
            <MenuItem value="login">Login</MenuItem>
            <MenuItem value="delete">Delete</MenuItem>
            <MenuItem value="settings_update">Settings Update</MenuItem>
            <MenuItem value="loan_defaulted">Loan Defaulted</MenuItem>
            <MenuItem value="loan_refinanced">Loan Refinanced</MenuItem>
            <MenuItem value="loan_deletion">Loan Deleted</MenuItem>
            <MenuItem value="borrower_creation">Borrower Added</MenuItem>
            <MenuItem value="expense_creation">Expense Added</MenuItem>
            <MenuItem value="guarantor_creation">Guarantor Added</MenuItem>
            <MenuItem value="comment_creation">Comment Added</MenuItem>
            <MenuItem value="expense_deletion">Expense Deleted</MenuItem>
            <MenuItem value="guarantor_deletion">Guarantor Deleted</MenuItem>
            <MenuItem value="comment_deletion">Comment Deleted</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={useRelativeTime}
              onChange={(e) => setUseRelativeTime(e.target.checked)}
              name="timeFormat"
              color="primary"
            />
          }
          label="Relative"
          labelPlacement="start"
        />
        <FormControlLabel
          control={
            <Switch
              checked={showUndoableOnly}
              onChange={(e) => setShowUndoableOnly(e.target.checked)}
              color="secondary"
            />
          }
          label="Undoable"
          labelPlacement="start"
        />
        <FormControlLabel
          control={
            <Switch
              checked={showUnreviewedOnly}
              onChange={(e) => setShowUnreviewedOnly(e.target.checked)}
              color="secondary"
            />
          }
          label="Unreviewed"
          labelPlacement="start"
        />
      </Stack>

      <Timeline sx={{ p: 0 }}>
        <AnimatePresence>
          {Object.entries(groupedLogs).map(([dateKey, logs]) => (
            <React.Fragment key={dateKey}>
              <Box sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.default', py: 1 }}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: 1.5 }}>
                  {dateKey}
                </Typography>
              </Box>
              {logs.map((log, index) => (
                <LogItem
                  key={log.id}
                  log={log}
                  index={index}
                  search={search}
                  useRelativeTime={useRelativeTime}
                  handleMarkAsReviewed={handleMarkAsReviewed}
                  setConfirmUndo={setConfirmUndo}
                  getUndoWarning={getUndoWarning}
                  highlightText={highlightText}
                  theme={theme}
                />
              ))}
            </React.Fragment>
          ))}
        </AnimatePresence>
      </Timeline>

      {!isMobile && filteredLogs.length > displayedLogs.length && (
        <Box textAlign="center" mt={2}>
          <Typography
            variant="button"
            onClick={() => setPage((p) => p + 1)}
            sx={{
              cursor: "pointer",
              color: theme.palette.secondary.main, // <-- Accent color for the link
              userSelect: "none",
            }}
          >
            Load More
          </Typography>
        </Box>
      )}

      {isMobile && displayedLogs.length < filteredLogs.length && (
        <Box textAlign="center" mt={2}>
          <CircularProgress size={24} />
        </Box>
      )}

      {displayedLogs.length === 0 && (
        <Box
          mt={6}
          textAlign="center"
          color={theme.palette.text.secondary}
          sx={{ userSelect: "none" }}
        >
          <Typography variant="h6" gutterBottom>
            No activity logs found
          </Typography>
          <Typography variant="body2">Try adjusting your search or filters.</Typography>
        </Box>
      )}

      <Dialog
        open={confirmUndo.open}
        onClose={() => setConfirmUndo({ open: false, log: null })}
      >
        <DialogTitle>Confirm Undo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to undo this action? This cannot be reversed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmUndo({ open: false, log: null })}>Cancel</Button>
          <Button onClick={handleUndo} color="error">
            Undo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
