import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Stack,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  ListItemText,
  CircularProgress,
  Tooltip,
  Fade,
  Chip,
  Paper,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
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
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, useMediaQuery } from "@mui/material";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useSnackbar } from "../components/SnackbarProvider";

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
};

export default function ActivityPage() {
  const { activityLogs, undoLoanCreation, undoPayment, updateActivityLog, undoRefinanceLoan, undoDeleteLoan, undoUpdateLoan } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const showSnackbar = useSnackbar();

  const [confirmUndo, setConfirmUndo] = useState({ open: false, log: null });

  const ITEMS_PER_PAGE = 20;
  const [page, setPage] = useState(1);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const listRef = useRef(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

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

  // Helper to highlight search term inside text with accent color
  function highlightText(text, highlight) {
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
  }

  const filteredLogs = useMemo(() => {
    return activityLogs
      .filter((log) => {
        if (filterType !== "all" && log.type !== filterType) return false;
        if (
          search &&
          !log.description.toLowerCase().includes(search.toLowerCase()) &&
          !(log.user?.toLowerCase().includes(search.toLowerCase()))
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = a.date || a.createdAt || 0;
        const dateB = b.date || b.createdAt || 0;
        return new Date(dateB) - new Date(dateA);
      });
  }, [activityLogs, filterType, search]);

  useEffect(() => {
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

    const { id, type, relatedId, newLoanId, amount, previousRepaidAmount, undoData } = confirmUndo.log;

    try {
      if (type === "loan_creation") {
        await undoLoanCreation(relatedId);
      } else if (type === "payment_add") {
        await undoPayment(relatedId, confirmUndo.log.loanId, amount);
      } else if (type === "loan_refinanced") {
        await undoRefinanceLoan(relatedId, newLoanId, previousRepaidAmount);
      } else if (type === "delete") {
        await undoDeleteLoan(relatedId, undoData);
      } else if (type === "loan_update" || type === "loan_top_up") {
        await undoUpdateLoan(relatedId, undoData);
      }

      await updateActivityLog(id, { undone: true });
      showSnackbar("Action undone successfully!", "success");
    } catch (error) {
      console.error("Error undoing action:", error);
      showSnackbar("Failed to undo action.", "error");
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
      <Typography variant="h4" gutterBottom>
        Activity Log
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <TextField
          sx={filterInputStyles} // <-- Accent color on focus
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
        />
        <FormControl sx={{ minWidth: 160, ...filterInputStyles }} size="small">
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
          </Select>
        </FormControl>
      </Stack>

      <Timeline sx={{ p: 0 }}>
        <AnimatePresence>
          {displayedLogs.map((log, index) => {
            const userDisplay = log.user || "System";
            const actionDisplay =
              actionLabels[log.type] ??
              (log.type ? log.type.replace(/_/g, " ") : "Unknown Action");

            const dateISO = log.date || log.createdAt;
            let dateStr = "No valid date";
            let relativeTime = "";
            if (dateISO) {
              try {
                const parsedDate =
                  typeof dateISO === "string"
                    ? parseISO(dateISO)
                    : dateISO.toDate
                    ? dateISO.toDate()
                    : dateISO;
                relativeTime = formatDistanceToNow(parsedDate, { addSuffix: true });
                dateStr = parsedDate.toLocaleString();
              } catch {
                // fallback if parsing fails
              }
            }

            return (
              <motion.div
                key={log.id}
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
                    {index < displayedLogs.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: '12px', px: 2 }}>
                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
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
                          </Box>
                        }
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
                                {relativeTime}
                              </Typography>
                            </Tooltip>
                            <Typography component="span" variant="body2">
                              {highlightText(log.description ?? "", search)}
                            </Typography>
                            {log.undoable && !log.undone && (
                              <Button
                                size="small"
                                onClick={() => setConfirmUndo({ open: true, log })}
                                startIcon={<UndoIcon />}
                                sx={{ mt: 1 }}
                              >
                                Undo
                              </Button>
                            )}
                          </>
                        }
                      />
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              </motion.div>
            );
          })}
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
