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
} from "@mui/material";
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
  // add other action types here if any
};

export default function ActivityPage() {
  const { activityLogs } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // For pagination
  const ITEMS_PER_PAGE = 20;
  const [page, setPage] = useState(1);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const listRef = useRef(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Filter and sort logs based on search and filterType
  const filteredLogs = useMemo(() => {
    return activityLogs
      .filter((log) => {
        if (filterType !== "all" && log.type !== filterType) return false;
        if (
          search &&
          !log.description.toLowerCase().includes(search.toLowerCase()) &&
          !(log.userName?.toLowerCase().includes(search.toLowerCase()) ||
            log.user?.toLowerCase().includes(search.toLowerCase()))
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        // Prefer timestamp or createdAt for sorting desc
        const dateA = a.timestamp || a.createdAt || 0;
        const dateB = b.timestamp || b.createdAt || 0;
        return new Date(dateB) - new Date(dateA);
      });
  }, [activityLogs, filterType, search]);

  // For desktop: paginate logs
  useEffect(() => {
    if (!isMobile) {
      setDisplayedLogs(filteredLogs.slice(0, page * ITEMS_PER_PAGE));
    }
  }, [filteredLogs, page, isMobile]);

  // For mobile: infinite scroll
  useEffect(() => {
    if (isMobile) {
      setDisplayedLogs(filteredLogs.slice(0, page * ITEMS_PER_PAGE));
    }
  }, [filteredLogs, page, isMobile]);

  // Infinite scroll handler for mobile
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

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [filterType, search]);

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
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
        />
        <FormControl sx={{ minWidth: 160 }} size="small">
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

      <List>
        <AnimatePresence>
          {displayedLogs.map((log) => {
            const userDisplay = log.userName ?? log.user ?? "System";
            const actionDisplay =
              actionLabels[log.type] ??
              (log.type ? log.type.replace(/_/g, " ") : "Unknown Action");
            const dateStr = (() => {
              const dateVal = log.timestamp || log.createdAt;
              if (!dateVal) return "No valid date";
              const d = new Date(dateVal);
              return !isNaN(d) ? d.toLocaleString() : "No valid date";
            })();

            return (
              <motion.div
                key={log.id}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={itemVariants}
              >
                <ListItem alignItems="flex-start" divider>
                  <ListItemText
                    primary={
                      <>
                        <strong>{userDisplay}</strong> — {actionDisplay}
                      </>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: "block" }}
                        >
                          {dateStr}
                        </Typography>
                        {log.description ?? ""}
                      </>
                    }
                  />
                </ListItem>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </List>

      {/* Pagination controls for desktop */}
      {!isMobile && filteredLogs.length > displayedLogs.length && (
        <Box textAlign="center" mt={2}>
          <Typography
            variant="button"
            onClick={() => setPage((p) => p + 1)}
            sx={{
              cursor: "pointer",
              color: theme.palette.primary.main,
              userSelect: "none",
            }}
          >
            Load More
          </Typography>
        </Box>
      )}

      {/* Loading indicator for mobile infinite scroll */}
      {isMobile && displayedLogs.length < filteredLogs.length && (
        <Box textAlign="center" mt={2}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* No results fallback */}
      {displayedLogs.length === 0 && (
        <Typography variant="body1" align="center" mt={4} color="text.secondary">
          No activity logs found.
        </Typography>
      )}
    </Box>
  );
}

