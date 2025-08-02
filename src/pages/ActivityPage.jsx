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
  ListItemText,
  CircularProgress,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Skeleton,
  styled,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useFirestore } from "../contexts/FirestoreProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, useMediaQuery } from "@mui/material";

// Framer Motion variants for animations
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Map action types to readable labels and colors
const actionConfig = {
  loan_creation: { label: "Loan Created", color: "primary" },
  edit: { label: "Edited", color: "info" },
  payment: { label: "Payment Made", color: "success" },
  login: { label: "Login", color: "default" },
  delete: { label: "Loan Deleted", color: "error" },
  updateSettings: { label: "Settings Updated", color: "secondary" },
  unknown: { label: "Unknown Action", color: "default" },
};

// Helper function to format date
const formatDate = (dateValue) => {
  if (!dateValue) return "No valid date";
  
  // Firestore timestamps might be objects, so handle them
  const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
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

// Custom styled components
const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(90deg)",
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
  },
}));

export default function ActivityPage() {
  const { activityLogs } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [page, setPage] = useState(1);
  const listRef = useRef(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredLogs = useMemo(() => {
    if (!activityLogs) return [];
    
    return activityLogs
      .filter((log) => {
        // Filter by type
        if (filterType !== "all" && log.type !== filterType) return false;
        
        // Filter by search string
        if (search) {
          const lowerSearch = search.toLowerCase();
          const logDescription = log.description?.toLowerCase() || "";
          const logUserName = log.userName?.toLowerCase() || "";
          const logBorrower = log.borrower?.toLowerCase() || "";
          
          if (
            !logDescription.includes(lowerSearch) &&
            !logUserName.includes(lowerSearch) &&
            !logBorrower.includes(lowerSearch)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : b.createdAt?.getTime() || 0;
        return dateB - dateA;
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
          disabled={isLoading}
        />
        <FormControl sx={{ minWidth: 160 }} size="small" disabled={isLoading}>
          <InputLabel>Type</InputLabel>
          <Select
            value={filterType}
            label="Type"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            {Object.keys(actionConfig).filter(key => key !== 'unknown').map(key => (
              <MenuItem key={key} value={key}>
                {actionConfig[key].label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

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
                  const action = actionConfig[log.type] || actionConfig.unknown;
                  const userDisplay = log.userName ?? log.user ?? "System";
                  const dateStr = formatDate(log.createdAt);

                  return (
                    <motion.div
                      key={log.id}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={itemVariants}
                    >
                      <Accordion
                        variant="outlined"
                        sx={{ my: 1, boxShadow: 0 }}
                      >
                        <Tooltip
                          title={log.description ?? "No description available"}
                        >
                          <StyledAccordionSummary
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
                                label={action.label}
                                size="small"
                                color={action.color}
                              />
                              <ListItemText
                                primary={<strong>{userDisplay}</strong>}
                                secondary={dateStr}
                              />
                            </Stack>
                          </StyledAccordionSummary>
                        </Tooltip>
                        <AccordionDetails>
                          <Typography variant="body2" color="text.secondary">
                            Full description:
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 1 }}>
                            {log.description ?? "No description provided."}
                          </Typography>
                          {log.borrower && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              **Borrower:** {log.borrower} ({log.borrowerPhone})
                            </Typography>
                          )}
                          {log.loanId && (
                            <Typography variant="body2" color="text.secondary">
                              **Loan ID:** {log.loanId}
                            </Typography>
                          )}
                          {log.userEmail && (
                            <Typography variant="body2" color="text.secondary">
                              **Admin:** {log.userEmail}
                            </Typography>
                          )}
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
