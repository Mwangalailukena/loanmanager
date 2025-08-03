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
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Tooltip,
  Fade,
  Chip,
  Badge,
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, useMediaQuery } from "@mui/material";
import { formatDistanceToNow, parseISO } from "date-fns";

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const actionLabels = {
  loan_creation: "Loan Created",
  edit: "Edited",
  payment: "Payment Made",
  login: "Login",
  delete: "Loan Deleted",
  settings_update: "Settings Updated",
};

// Colors for Chips based on action type
const actionChipColors = {
  loan_creation: "primary",
  edit: "default",
  payment: "success",
  login: "info",
  delete: "error",
  settings_update: "secondary",
};

// Helper to highlight search term inside text
function highlightText(text, highlight) {
  if (!highlight) return text;
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <Box component="span" key={i} sx={{ bgcolor: "yellow", fontWeight: "bold" }}>
        {part}
      </Box>
    ) : (
      part
    )
  );
}

// Helper to get initials from username/email
function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ActivityPage() {
  const { activityLogs } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const ITEMS_PER_PAGE = 20;
  const [page, setPage] = useState(1);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const listRef = useRef(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

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
            <MenuItem value="settings_update">Settings Update</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <List>
        <AnimatePresence>
          {displayedLogs.map((log) => {
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

            // Example badge usage:
            // Suppose we treat logs less than 1 day old as "new"
            const isNew =
              dateISO &&
              (() => {
                try {
                  const parsedDate =
                    typeof dateISO === "string"
                      ? parseISO(dateISO)
                      : dateISO.toDate
                      ? dateISO.toDate()
                      : dateISO;
                  return new Date() - parsedDate < 1000 * 60 * 60 * 24; // less than 24h old
                } catch {
                  return false;
                }
              })();

            return (
              <motion.div
                key={log.id}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={itemVariants}
              >
                <ListItemButton
                  divider
                  sx={{
                    py: 1.5,
                    "&:hover": { bgcolor: theme.palette.action.hover },
                    cursor: "default",
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      color="error"
                      variant="dot"
                      overlap="circular"
                      invisible={!isNew}
                      anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {getInitials(userDisplay)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
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

                        <Tooltip
                          title={actionDisplay}
                          placement="top"
                          TransitionComponent={Fade}
                          arrow
                        >
                          <Chip
                            label={actionDisplay}
                            size="small"
                            color={actionChipColors[log.type] || "default"}
                            sx={{ textTransform: "capitalize", cursor: "help" }}
                          />
                        </Tooltip>
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
                      </>
                    }
                  />
                </ListItemButton>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </List>

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
    </Box>
  );
}

