// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  useTheme,
  useMediaQuery,
  TextField,
  Tooltip,
  LinearProgress,
  Fab,
  Zoom,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PaidIcon from "@mui/icons-material/Payments";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import WarningIcon from "@mui/icons-material/Warning";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BarChartIcon from "@mui/icons-material/BarChart";
// import DragIndicatorIcon from "@mui/icons-material/DragIndicator"; // Removed this for cleaner visual, rely on cursor
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useFirestore } from "../contexts/FirestoreProvider";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

const STORAGE_KEY = "dashboardCardOrder";

// Define ALL default card IDs as a static constant outside the component
const DEFAULT_CARD_IDS = [
  "investedCapital", // Now listed first for summary
  "availableCapital",
  "totalDisbursed",
  "totalCollected",
  "totalLoans",
  "paidLoans",
  "activeLoans",
  "overdueLoans",
  "totalOutstanding",
  "expectedProfit", // Still referred to by old ID for logic, label will change
  "actualProfit", // Still referred to by old ID for logic, label will change
  "averageLoan",
];

// Define the IDs for the Executive Summary section
const EXECUTIVE_SUMMARY_IDS = [
  "investedCapital",
  "availableCapital",
  "totalDisbursed",
  "totalCollected",
];

const iconMap = {
  totalLoans: <MonetizationOnIcon fontSize="large" />,
  paidLoans: <CheckCircleIcon fontSize="large" />,
  activeLoans: <PendingIcon fontSize="large" />,
  overdueLoans: <WarningIcon fontSize="large" />,
  totalDisbursed: <MonetizationOnIcon fontSize="large" />,
  investedCapital: <AccountBalanceWalletIcon fontSize="large" />,
  availableCapital: <AccountBalanceWalletIcon fontSize="large" />,
  totalCollected: <PaidIcon fontSize="large" />,
  totalOutstanding: <WarningIcon fontSize="large" />,
  expectedProfit: <BarChartIcon fontSize="large" />,
  actualProfit: <CheckCircleIcon fontSize="large" />,
  averageLoan: <MonetizationOnIcon fontSize="large" />,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { loans, settings } = useFirestore();

  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [cardsOrder, setCardsOrder] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loans) {
        setLoading(false);
      }
    }, 500);

    if (loans) {
      const savedOrder = localStorage.getItem(STORAGE_KEY);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        const validOrder = parsedOrder.filter(id => DEFAULT_CARD_IDS.includes(id));
        const finalOrder = [...new Set([...validOrder, ...DEFAULT_CARD_IDS])];
        setCardsOrder(finalOrder);
      } else {
        setCardsOrder(DEFAULT_CARD_IDS);
      }

      const now = new Date();
      const upcomingThreshold = new Date(now);
      upcomingThreshold.setDate(now.getDate() + 3);

      const upcomingLoans = loans.filter(
        (loan) =>
          loan.status === "Active" &&
          new Date(loan.dueDate) <= upcomingThreshold &&
          new Date(loan.dueDate) >= now
      );

      const overdueLoansList = loans.filter(
        (loan) => loan.status === "Active" && new Date(loan.dueDate) < now
      );

      if (upcomingLoans.length > 0) {
        toast.info(`You have ${upcomingLoans.length} loan(s) due within 3 days!`);
      }
      if (overdueLoansList.length > 0) {
        toast.error(`You have ${overdueLoansList.length} overdue loan(s)! Please take action.`);
      }
    }

    return () => clearTimeout(timer);
  }, [loans]);

  // Calculate metrics
  const loansForCalculations = loans || [];

  const loansThisMonth = loansForCalculations.filter((loan) =>
    loan.startDate.startsWith(selectedMonth)
  );

  const totalLoansCount = loansThisMonth.length;
  const paidLoansCount = loansThisMonth.filter((l) => l.status === "Paid").length;
  const activeLoansCount = loansThisMonth.filter((l) => l.status === "Active").length;
  const overdueLoansCount = loansThisMonth.filter(
    (l) => l.status === "Active" && new Date(l.dueDate) < new Date()
  ).length;

  const initialCapital = Number(settings?.initialCapital) || 60000;

  const totalDisbursed = loansThisMonth.reduce(
    (sum, loan) => sum + Number(loan.principal || 0),
    0
  );

  const totalCollected = loansThisMonth.reduce(
    (sum, loan) => sum + Number(loan.repaidAmount || 0),
    0
  );

  const availableCapital = initialCapital - totalDisbursed + totalCollected;

  const totalOutstanding = loansThisMonth
    .filter((loan) => loan.status === "Active")
    .reduce((sum, loan) => {
      const principal = Number(loan.principal || 0);
      const interest = Number(loan.interest || 0);
      const repaid = Number(loan.repaidAmount || 0);
      return sum + (principal + interest - repaid);
    }, 0);

  const totalExpectedProfit = loansThisMonth.reduce(
    (sum, loan) => sum + Number(loan.interest || 0),
    0
  );

  const actualProfit = loansThisMonth
    .filter(
      (loan) =>
        loan.status === "Paid" &&
        Number(loan.repaidAmount || 0) >=
          Number(loan.principal || 0) + Number(loan.interest || 0)
    )
    .reduce((sum, loan) => sum + Number(loan.interest || 0), 0);

  const averageLoan =
    loansThisMonth.length > 0 ? Math.round(totalDisbursed / loansThisMonth.length) : 0;

  const defaultCards = [
    {
      id: "investedCapital",
      label: "Invested Capital",
      value: `ZMW ${initialCapital.toLocaleString()}`,
      color: "primary", // Keep primary
      filter: "all",
      tooltip: "Initial capital invested into loans",
      progress: null,
      icon: iconMap.investedCapital,
    },
    {
      id: "availableCapital",
      label: "Available Capital",
      value: `ZMW ${availableCapital.toLocaleString()}`,
      color: "success", // Keep success
      filter: "all",
      tooltip: "Capital currently available to issue new loans",
      progress: initialCapital > 0 ? availableCapital / initialCapital : null,
      icon: iconMap.availableCapital,
    },
    {
      id: "totalDisbursed",
      label: "Total Disbursed",
      value: `ZMW ${totalDisbursed.toLocaleString()}`,
      color: "primary", // Keep primary
      filter: "all",
      tooltip: "Total principal amount disbursed this month",
      progress: null,
      icon: iconMap.totalDisbursed,
    },
    {
      id: "totalCollected",
      label: "Total Collected",
      value: `ZMW ${totalCollected.toLocaleString()}`,
      color: "info", // Keep info
      filter: "paid",
      tooltip: "Total amount collected from repayments this month",
      progress: totalDisbursed > 0 ? totalCollected / totalDisbursed : null,
      icon: iconMap.totalCollected,
    },
    {
      id: "totalLoans",
      label: "Total Loans",
      value: totalLoansCount,
      color: "primary",
      filter: "all",
      tooltip: "Total number of loans issued this month",
      progress: null,
      icon: iconMap.totalLoans,
    },
    {
      id: "paidLoans",
      label: "Paid Loans",
      value: paidLoansCount,
      color: "success",
      filter: "paid",
      tooltip: "Loans fully paid back this month",
      progress: totalLoansCount ? paidLoansCount / totalLoansCount : 0,
      icon: iconMap.paidLoans,
    },
    {
      id: "activeLoans",
      label: "Active Loans",
      value: activeLoansCount,
      color: "info",
      filter: "active",
      tooltip: "Loans currently active and being repaid",
      progress: totalLoansCount ? activeLoansCount / totalLoansCount : 0,
      icon: iconMap.activeLoans,
    },
    {
      id: "overdueLoans",
      label: "Overdue Loans",
      value: overdueLoansCount,
      color: "error",
      filter: "overdue",
      tooltip: "Loans overdue for repayment",
      progress: totalLoansCount ? overdueLoansCount / totalLoansCount : 0,
      icon: iconMap.overdueLoans,
      pulse: true,
    },
    {
      id: "totalOutstanding",
      label: "Total Outstanding",
      value: `ZMW ${totalOutstanding.toLocaleString()}`,
      color: "warning",
      filter: "active",
      tooltip: "Total outstanding repayments still due",
      progress: null,
      icon: iconMap.totalOutstanding,
    },
    {
      id: "expectedProfit",
      label: "Interest Expected", // RENAMED LABEL
      value: `ZMW ${totalExpectedProfit.toLocaleString()}`,
      color: "info",
      filter: "all",
      tooltip: "Total expected profit from interest",
      progress: null,
      icon: iconMap.expectedProfit,
    },
    {
      id: "actualProfit",
      label: "Actual Interest", // RENAMED LABEL
      value: `ZMW ${actualProfit.toLocaleString()}`,
      color: "success",
      filter: "paid",
      tooltip: "Profit earned from fully repaid loans",
      progress:
        totalExpectedProfit > 0 ? actualProfit / totalExpectedProfit : null,
      icon: iconMap.actualProfit,
    },
    {
      id: "averageLoan",
      label: "Average Loan",
      value: `ZMW ${averageLoan.toLocaleString()}`,
      color: "primary",
      filter: "all",
      tooltip: "Average loan amount issued this month",
      progress: null,
      icon: iconMap.averageLoan,
    },
  ];

  // Compose cards based on stored order or default order
  const cardsToRender = cardsOrder.length
    ? cardsOrder
        .map((id) => defaultCards.find((c) => c.id === id))
        .filter(Boolean) // Filter out any card IDs that might no longer exist
    : defaultCards;

  // Separate cards into Executive Summary and Metrics sections for rendering
  const executiveSummaryCards = cardsToRender.filter(card =>
    EXECUTIVE_SUMMARY_IDS.includes(card.id)
  );
  const metricsCards = cardsToRender.filter(card =>
    !EXECUTIVE_SUMMARY_IDS.includes(card.id)
  );

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) {
      return; // Dropped outside a droppable area
    }

    // IMPORTANT: This implementation prevents dragging cards between sections.
    // Cards can only be reordered within their own Executive Summary or Metrics list.
    if (source.droppableId !== destination.droppableId) {
      toast.error("Cards cannot be moved between sections.");
      return;
    }

    // Determine which list was affected (Executive Summary or Metrics)
    let currentCardsInSection;
    if (source.droppableId === "executive-summary-droppable") {
      currentCardsInSection = executiveSummaryCards;
    } else { // "metrics-droppable"
      currentCardsInSection = metricsCards;
    }

    // Get the ID of the card being dragged and its target destination ID within that section
    const draggedCardId = currentCardsInSection[source.index].id;
    const targetCardId = currentCardsInSection[destination.index].id;

    // Perform the reorder on the global `cardsOrder` array
    const newGlobalOrder = Array.from(cardsOrder);

    const sourceGlobalIndex = newGlobalOrder.indexOf(draggedCardId);
    const destinationGlobalIndex = newGlobalOrder.indexOf(targetCardId);

    // If for some reason indices are not found, return
    if (sourceGlobalIndex === -1 || destinationGlobalIndex === -1) {
        console.error("Dragged card ID or target ID not found in global order. This should not happen if logic is correct.");
        return;
    }

    // Perform the move directly on the global order array
    const [removed] = newGlobalOrder.splice(sourceGlobalIndex, 1);
    newGlobalOrder.splice(destinationGlobalIndex, 0, removed);

    setCardsOrder(newGlobalOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGlobalOrder));
    toast.success("Dashboard layout saved!");
  };

  const handleCardClick = (filter) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (selectedMonth) params.set("month", selectedMonth);
    navigate(`/loans?${params.toString()}`);
  };

  // Skeleton for loading state
  if (loading) {
    return (
      <Box p={isMobile ? 2 : 4}> {/* Increased padding */}
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
          Dashboard
        </Typography>
        <Box mb={isMobile ? 2 : 3} maxWidth={isMobile ? "100%" : 180}>
          <Skeleton variant="rectangular" height={40} width="100%" />
        </Box>
        <Typography variant="h6" gutterBottom mt={2} mb={1}>
          <Skeleton variant="text" width="40%" />
        </Typography>
        <Grid container spacing={isMobile ? 2 : 3}> {/* Increased spacing */}
          {[...Array(isMobile ? 4 : 4)].map((_, i) => ( // 4 for executive summary
            <Grid item xs={6} sm={4} md={3} lg={2} key={`exec-skel-${i}`}>
              <Card sx={{ p: isMobile ? 2 : 3, borderRadius: 3, boxShadow: theme.shadows[2], height: "100%" }}> {/* Increased padding, rounded corners, subtle shadow */}
                <Box display="flex" alignItems="center" mb={1} gap={1}>
                  <Skeleton variant="circular" width={isMobile ? 32 : 40} height={isMobile ? 32 : 40} />
                  <Skeleton variant="text" width="60%" height={isMobile ? 20 : 25} />
                </Box>
                <Skeleton variant="text" width="80%" height={isMobile ? 30 : 40} />
                <Skeleton variant="rectangular" width="100%" height={isMobile ? 6 : 8} sx={{ mt: 1, borderRadius: 2 }} /> {/* Rounded progress skeleton */}
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h6" gutterBottom mt={4} mb={1}> {/* More margin top */}
          <Skeleton variant="text" width="30%" />
        </Typography>
        <Grid container spacing={isMobile ? 2 : 3}> {/* Increased spacing */}
          {[...Array(isMobile ? 6 : 8)].map((_, i) => ( // More for metrics
            <Grid item xs={6} sm={4} md={3} lg={2} key={`metrics-skel-${i}`}>
              <Card sx={{ p: isMobile ? 2 : 3, borderRadius: 3, boxShadow: theme.shadows[2], height: "100%" }}> {/* Increased padding, rounded corners, subtle shadow */}
                <Box display="flex" alignItems="center" mb={1} gap={1}>
                  <Skeleton variant="circular" width={isMobile ? 32 : 40} height={isMobile ? 32 : 40} />
                  <Skeleton variant="text" width="60%" height={isMobile ? 20 : 25} />
                </Box>
                <Skeleton variant="text" width="80%" height={isMobile ? 30 : 40} />
                <Skeleton variant="rectangular" width="100%" height={isMobile ? 6 : 8} sx={{ mt: 1, borderRadius: 2 }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // No loans state
  if (!loans || loans.length === 0) {
    return (
      <Box
        p={isMobile ? 2 : 4} // Increased padding
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="70vh"
        textAlign="center"
      >
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No loans available yet!
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Start by adding your first loan to see your financial overview here.
        </Typography>
        <Fab
          color="primary"
          aria-label="Add Loan"
          onClick={() => navigate("/add-loan")}
          variant="extended"
          sx={{ mt: 2, borderRadius: 10 }} // More rounded button
        >
          <AddIcon sx={{ mr: 1 }} />
          Add First Loan
        </Fab>
      </Box>
    );
  }

  return (
    <Box p={isMobile ? 2 : 4} sx={{ background: theme.palette.background.default }}> {/* Added background for overall feel */}
      <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ fontWeight: 600 }}> {/* Bolder title */}
        Dashboard
      </Typography>

      {/* Month picker */}
      <Box mb={isMobile ? 3 : 4} maxWidth={isMobile ? "100%" : 200}> {/* Increased mb, slightly wider */}
        <TextField
          label="Filter by Month"
          type="month"
          size="small"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }} // Always show label as if input is focused
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2, // Rounded input field
            },
          }}
        />
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Executive Summary Section */}
        <Typography variant="h6" gutterBottom mt={2} mb={isMobile ? 2 : 3} sx={{ fontWeight: 600 }}>
          Executive Summary
        </Typography>
        <Droppable
          droppableId="executive-summary-droppable"
          direction={isMobile ? "vertical" : "horizontal"}
        >
          {(provided) => (
            <Grid
              container
              spacing={isMobile ? 2 : 3} // Increased spacing
              {...provided.droppableProps}
              ref={provided.innerRef}
              sx={{ mb: isMobile ? 4 : 6 }} // Add more margin bottom to separate sections
            >
              {executiveSummaryCards.map(
                (
                  { id, label, value, color, filter, tooltip, progress, pulse, icon },
                  index
                ) => (
                  <Draggable key={id} draggableId={id} index={index}>
                    {(providedDraggable) => (
                      <Grid
                        item
                        xs={6}
                        sm={4}
                        md={3}
                        lg={2}
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        // We are removing the dragHandleProps from the Grid and
                        // instead applying it to the content Box within the Card
                        // so that the entire card is clickable, but drag is only via the content.
                        // For a cleaner look like the examples, we'll make the whole card draggable.
                        // So, we'll keep `providedDraggable.dragHandleProps` on the Card itself or a wrapper
                        // if you want the whole card to be draggable, or on a specific handle element.
                        // For now, let's keep it on the motion.div wrapper to make the whole card draggable.
                        style={{ ...providedDraggable.draggableProps.style }}
                      >
                        <motion.div
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          variants={cardVariants}
                          whileHover={{ scale: 1.02, boxShadow: theme.shadows[4] }} // More subtle hover
                          whileTap={{ scale: 0.98 }}
                          style={{ height: "100%" }}
                          {...providedDraggable.dragHandleProps} // Make the whole motion.div (card) draggable
                        >
                          <Tooltip title={tooltip} arrow>
                            <Card
                              sx={{
                                p: isMobile ? 2 : 3, // Increased padding
                                cursor: "grab",
                                borderRadius: 3, // Very rounded corners
                                // Removed borderLeft for a cleaner, more image-like aesthetic.
                                // Instead, use a subtle background color or gradient if desired,
                                // or rely on the icon color for emphasis.
                                // For now, we'll keep it simple: no borderLeft.
                                // boxShadow: pulse ? `0 0 15px ${theme.palette.error.light}` : theme.shadows[2], // More subtle shadow
                                boxShadow: theme.shadows[2], // Default subtle shadow
                                animation: pulse ? "pulse 2s infinite" : undefined,
                                transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                "&:hover": {
                                  boxShadow: pulse ? `0 0 15px ${theme.palette.error.light}` : theme.shadows[4], // Stronger shadow on hover
                                  transform: "translateY(-4px)"
                                },
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                backgroundColor: theme.palette.background.paper, // Ensure cards have a distinct background
                              }}
                              onClick={() => handleCardClick(filter)}
                              elevation={0} // We'll manage boxShadow manually for finer control
                            >
                              <Box display="flex" flexDirection="column" alignItems="flex-start" mb={isMobile ? 1 : 1.5}>
                                {React.cloneElement(icon, {
                                  fontSize: isMobile ? "medium" : "large",
                                  sx: { color: theme.palette[color].main, mb: 1 }, // Icon on top, colored
                                })}
                                <Typography variant={isMobile ? "subtitle2" : "subtitle1"} color="textSecondary" sx={{ fontWeight: 500 }}>
                                  {label}
                                </Typography>
                                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" color="text.primary">
                                  {value}
                                </Typography>
                              </Box>
                              {progress !== null && progress !== undefined && (
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(progress * 100, 100)}
                                  sx={{
                                    height: isMobile ? 6 : 8,
                                    borderRadius: 4, // More rounded progress bar
                                    backgroundColor: theme.palette[color].light, // Lighter track color
                                    "& .MuiLinearProgress-bar": {
                                      backgroundColor: theme.palette[color].main, // Main bar color
                                      borderRadius: 4,
                                    },
                                  }}
                                />
                              )}
                            </Card>
                          </Tooltip>
                        </motion.div>
                      </Grid>
                    )}
                  </Draggable>
                )
              )}
              {provided.placeholder}
            </Grid>
          )}
        </Droppable>

        {/* Metrics Section */}
        <Typography variant="h6" gutterBottom mt={2} mb={isMobile ? 2 : 3} sx={{ fontWeight: 600 }}>
          Metrics
        </Typography>
        <Droppable
          droppableId="metrics-droppable"
          direction={isMobile ? "vertical" : "horizontal"}
        >
          {(provided) => (
            <Grid
              container
              spacing={isMobile ? 2 : 3} // Increased spacing
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {metricsCards.map(
                (
                  { id, label, value, color, filter, tooltip, progress, pulse, icon },
                  index
                ) => (
                  <Draggable key={id} draggableId={id} index={index}>
                    {(providedDraggable) => (
                      <Grid
                        item
                        xs={6}
                        sm={4}
                        md={3}
                        lg={2}
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        style={{ ...providedDraggable.draggableProps.style }}
                      >
                        <motion.div
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          variants={cardVariants}
                          whileHover={{ scale: 1.02, boxShadow: theme.shadows[4] }} // More subtle hover
                          whileTap={{ scale: 0.98 }}
                          style={{ height: "100%" }}
                          {...providedDraggable.dragHandleProps} // Make the whole motion.div (card) draggable
                        >
                          <Tooltip title={tooltip} arrow>
                            <Card
                              sx={{
                                p: isMobile ? 2 : 3, // Increased padding
                                cursor: "grab",
                                borderRadius: 3, // Very rounded corners
                                boxShadow: theme.shadows[2], // Default subtle shadow
                                animation: pulse ? "pulse 2s infinite" : undefined,
                                transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                "&:hover": {
                                  boxShadow: pulse ? `0 0 15px ${theme.palette.error.light}` : theme.shadows[4], // Stronger shadow on hover
                                  transform: "translateY(-4px)"
                                },
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                backgroundColor: theme.palette.background.paper, // Ensure cards have a distinct background
                              }}
                              onClick={() => handleCardClick(filter)}
                              elevation={0}
                            >
                              <Box display="flex" flexDirection="column" alignItems="flex-start" mb={isMobile ? 1 : 1.5}>
                                {React.cloneElement(icon, {
                                  fontSize: isMobile ? "medium" : "large",
                                  sx: { color: theme.palette[color].main, mb: 1 }, // Icon on top, colored
                                })}
                                <Typography variant={isMobile ? "subtitle2" : "subtitle1"} color="textSecondary" sx={{ fontWeight: 500 }}>
                                  {label}
                                </Typography>
                                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" color="text.primary">
                                  {value}
                                </Typography>
                              </Box>
                              {progress !== null && progress !== undefined && (
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(progress * 100, 100)}
                                  sx={{
                                    height: isMobile ? 6 : 8,
                                    borderRadius: 4, // More rounded progress bar
                                    backgroundColor: theme.palette[color].light, // Lighter track color
                                    "& .MuiLinearProgress-bar": {
                                      backgroundColor: theme.palette[color].main, // Main bar color
                                      borderRadius: 4,
                                    },
                                  }}
                                />
                              )}
                            </Card>
                          </Tooltip>
                        </motion.div>
                      </Grid>
                    )}
                  </Draggable>
                )
              )}
              {provided.placeholder}
            </Grid>
          )}
        </Droppable>
      </DragDropContext>

      {/* Floating Add Loan Button */}
      <Zoom in={true} timeout={500} style={{ transitionDelay: "500ms" }}>
        <Fab
          color="primary"
          aria-label="Add Loan"
          onClick={() => navigate("/add-loan")}
          sx={{
            position: "fixed",
            bottom: isMobile ? 80 : 32, // Adjusted further from bottom on mobile
            right: isMobile ? 24 : 32, // Adjusted further from right on mobile
            zIndex: 1300,
            boxShadow: theme.shadows[6], // More prominent shadow for FAB
            borderRadius: "50%", // Ensure it's perfectly round
          }}
        >
          <AddIcon />
        </Fab>
      </Zoom>

      {/* Pulse keyframes */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7);
          }
          70% {
            box-shadow: 0 0 12px 12px rgba(255, 0, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
          }
        }
      `}</style>
    </Box>
  );
}
