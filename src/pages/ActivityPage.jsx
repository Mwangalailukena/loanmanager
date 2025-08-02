// src/pages/ActivityPage.jsx
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
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Button,
  Chip, // Added Chip
  Accordion, // Added Accordion
  AccordionSummary, // Added AccordionSummary
  AccordionDetails, // Added AccordionDetails
  Tooltip, // Added Tooltip
  Skeleton, // Added Skeleton
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"; // Added icon for the Accordion
import { useFirestore } from "../contexts/FirestoreProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, useMediaQuery } from "@mui/material";

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Map action types to readable labels
const actionLabels = {
  loan_creation: "Loan Created",
  edit: "Edited",
  payment: "Payment Made",
  login: "Login",
  delete: "Loan Deleted",
};

// Helper function to format date
const formatDate = (dateValue) => {
  if (!dateValue) return "No valid date";
  const date = new Date(dateValue);
  if (isNaN(date)) return "No valid date";

  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

const ITEMS_PER_PAGE = 20;

export default function ActivityPage() {
  const { activityLogs } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [page, setPage] = useState(1);
  const listRef = useRef(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredLogs = useMemo(() => {
    return activityLogs
      .filter((log) => {
        if (filterType !== "all" && log.type !== filterType) return false;
        if (
          search &&
          !log.description?.toLowerCase().includes(search.toLowerCase()) &&
          !(
            log.userName?.toLowerCase().includes(search.toLowerCase()) ||
            log.user?.toLowerCase().includes(search.toLowerCase())
          )
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        const dateA = a.timestamp || a.createdAt || 0;
        const dateB = b.timestamp || b.createdAt || 0;
        return new Date(dateB) - new Date(dateA);
      });
  }, [activityLogs, filterType, search]);

  useEffect(() => {
    setPage(1);
  }, [filterType, search]);

  const displayedLogs = useMemo(() => {
    return filteredLogs.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredLogs, page]);

  useEffect(() => {
    if (!isMobile) return;

    const onScroll = () => {
      if (!listRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        if (displayedLogs.length < filteredLogs.length) {
          setPage((p) => p + 1);
        }
      }
    };

    const container = listRef.current;
    if (container) {
      container.addEventListener("scroll", onScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", onScroll);
      }
    };
  }, [displayedLogs, filteredLogs, isMobile]);

  // Determine if data is still loading
  const isLoading = !activityLogs;

  return (
    <Box
      p={3}
      maxWidth={700}
      mx="auto"
      height={isMobile ? "80vh" : "auto"}
      sx={{
        overflowY: isMobile ? "auto" : "visible",
        display: "flex",
        flexDirection: "column",
      }}
      ref={listRef}
    >
      <Typography variant="h4" gutterBottom>
        Activity Log
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
          disabled={isLoading} // Disable input while loading
        />
        <FormControl sx={{ minWidth: 160 }} size="small" disabled={isLoading}>
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
          </Select>
        </FormControl>
      </Stack>

      {/* Conditional rendering for Skeleton loading state */}
      {isLoading ? (
        <Stack spacing={1}>
          <Skeleton variant="text" height={24} />
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={60} />
        </Stack>
      ) : (
        <>
          <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
            <List>
              <AnimatePresence>
                {displayedLogs.length === 0 && (
                  <Typography
                    variant="body1"
                    align="center"
                    mt={4}
                    color="text.secondary"
                  >
                    No activity logs found.
                  </Typography>
                )}
                {displayedLogs.map((log) => {
                  const userDisplay = log.userName ?? log.user ?? "System";
                  const actionDisplay =
                    actionLabels[log.type] ??
                    (log.type ? log.type.replace(/_/g, " ") : "Unknown Action");

                  const dateStr = formatDate(log.timestamp || log.createdAt);

                  return (
                    <motion.div
                      key={log.id}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={itemVariants}
                    >
                      {/* Use Accordion for expandable log details */}
                      <Accordion
                        variant="outlined"
                        sx={{ my: 1, boxShadow: 0 }}
                      >
                        {/* Summary section with a Chip and Tooltip */}
                        <Tooltip
                          title={log.description ?? "No description available"}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls={`panel-${log.id}-content`}
                            id={`panel-${log.id}-header`}
                          >
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={2}
                              sx={{ width: "100%" }}
                            >
                              <Chip
                                label={actionDisplay}
                                size="small"
                                color={
                                  log.type === "delete"
                                    ? "error"
                                    : log.type === "payment"
                                    ? "success"
                                    : "primary"
                                }
                              />
                              <ListItemText
                                primary={<strong>{userDisplay}</strong>}
                                secondary={dateStr}
                              />
                            </Stack>
                          </AccordionSummary>
                        </Tooltip>
                        {/* Details section */}
                        <AccordionDetails>
                          <Typography variant="body2" color="text.secondary">
                            Full description:
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            {log.description ?? "No description provided."}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </List>
          </Box>

          {displayedLogs.length < filteredLogs.length && (
            <Box textAlign="center" mt={2}>
              {isMobile ? (
                <CircularProgress size={24} />
              ) : (
                <Button onClick={() => setPage((p) => p + 1)}>
                  Load More
                </Button>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
