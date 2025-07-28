import React, { useState, useEffect, useMemo } from "react";
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
  Divider, // Divider might still be useful for visual separation inside if desired, but removed here for cleaner integration
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PaidIcon from "@mui/icons-material/Payments";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import WarningIcon from "@mui/icons-material/Warning";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BarChartIcon from "@mui/icons-material/BarChart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

const metricsContainerVariants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 100,
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    overflow: "hidden",
    transition: {
      when: "afterChildren",
      duration: 0.3,
    },
  },
};

const STORAGE_KEY = "dashboardCardOrder";
const METRICS_VISIBILITY_KEY = "dashboardMetricsVisibility";
const EXECUTIVE_SUMMARY_VISIBILITY_KEY = "dashboardExecutiveSummaryVisibility";

const DEFAULT_CARD_IDS = [
  "investedCapital",
  "availableCapital",
  "totalDisbursed",
  "totalCollected",
  "totalLoans",
  "paidLoans",
  "activeLoans",
  "overdueLoans",
  "totalOutstanding",
  "expectedProfit",
  "actualProfit",
  "averageLoan",
];

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
  const [showMetrics, setShowMetrics] = useState(() => {
    const savedVisibility = localStorage.getItem(METRICS_VISIBILITY_KEY);
    return savedVisibility ? JSON.parse(savedVisibility) : true;
  });
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(() => {
    const savedVisibility = localStorage.getItem(EXECUTIVE_SUMMARY_VISIBILITY_KEY);
    return savedVisibility ? JSON.parse(savedVisibility) : true;
  });

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
      const upcomingDueThreshold = new Date(now);
      upcomingDueThreshold.setDate(now.getDate() + 3);

      const upcomingLoans = loans.filter(
        (loan) =>
          loan.status !== "Paid" &&
          dayjs(loan.dueDate).isAfter(dayjs()) &&
          dayjs(loan.dueDate).diff(dayjs(), "day") < 3 &&
          dayjs(loan.dueDate).diff(dayjs(), 'day') >= 0
      );

      const overdueLoansList = loans.filter(
        (loan) => loan.status !== "Paid" && dayjs(loan.dueDate).isBefore(dayjs(), 'day')
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

  const handleToggleMetrics = () => {
    setShowMetrics((prev) => {
      const newState = !prev;
      localStorage.setItem(METRICS_VISIBILITY_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const handleToggleExecutiveSummary = () => {
    setShowExecutiveSummary((prev) => {
      const newState = !prev;
      localStorage.setItem(EXECUTIVE_SUMMARY_VISIBILITY_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const loansForCalculations = useMemo(() => loans || [], [loans]);

  const loansThisMonth = useMemo(() => {
    return loansForCalculations.filter((loan) =>
      loan.startDate.startsWith(selectedMonth)
    );
  }, [loansForCalculations, selectedMonth]);

  const previousMonth = useMemo(() => dayjs(selectedMonth).subtract(1, 'month').format('YYYY-MM'), [selectedMonth]);
  const loansLastMonth = useMemo(() => {
      return loansForCalculations.filter((loan) =>
          dayjs(loan.startDate).format('YYYY-MM') === previousMonth
      );
  }, [loansForCalculations, previousMonth]);

  const totalDisbursedLastMonth = useMemo(() => {
    return loansLastMonth.reduce(
        (sum, loan) => sum + Number(loan.principal || 0),
        0
    );
  }, [loansLastMonth]);

  const totalCollectedLastMonth = useMemo(() => {
    return loansLastMonth.reduce(
        (sum, loan) => sum + Number(loan.repaidAmount || 0),
        0
    );
  }, [loansLastMonth]);

  const totalLoansCount = useMemo(() => loansThisMonth.length, [loansThisMonth]);
  const paidLoansCount = useMemo(() => loansThisMonth.filter((l) => l.status === "Paid").length, [loansThisMonth]);
  const activeLoansCount = useMemo(() => loansThisMonth.filter((l) => l.status === "Active").length, [loansThisMonth]);
  const overdueLoansCount = useMemo(() => loansThisMonth.filter(
    (l) => l.status === "Active" && dayjs(l.dueDate).isBefore(dayjs(), 'day')
  ).length, [loansThisMonth]);

  const initialCapital = useMemo(() => Number(settings?.initialCapital) || 60000, [settings]);

  const totalDisbursed = useMemo(() => {
    return loansThisMonth.reduce(
      (sum, loan) => sum + Number(loan.principal || 0),
      0
    );
  }, [loansThisMonth]);

  const totalCollected = useMemo(() => {
    return loansThisMonth.reduce(
      (sum, loan) => sum + Number(loan.repaidAmount || 0),
      0
    );
  }, [loansThisMonth]);

  const availableCapital = useMemo(() => initialCapital - totalDisbursed + totalCollected, [initialCapital, totalDisbursed, totalCollected]);

  const totalOutstanding = useMemo(() => {
    return loansThisMonth
      .filter((loan) => loan.status === "Active")
      .reduce((sum, loan) => {
        const principal = Number(loan.principal || 0);
        const interest = Number(loan.interest || 0);
        const repaid = Number(loan.repaidAmount || 0);
        return sum + (principal + interest - repaid);
      }, 0);
  }, [loansThisMonth]);

  const totalExpectedProfit = useMemo(() => {
    return loansThisMonth.reduce(
      (sum, loan) => sum + Number(loan.interest || 0),
      0
    );
  }, [loansThisMonth]);

  const actualProfit = useMemo(() => {
    return loansThisMonth
      .filter(
        (loan) =>
          loan.status === "Paid" &&
          Number(loan.repaidAmount || 0) >=
            Number(loan.principal || 0) + Number(loan.interest || 0)
      )
      .reduce((sum, loan) => sum + Number(loan.interest || 0), 0);
  }, [loansThisMonth]);

  const averageLoan = useMemo(() => {
    return loansThisMonth.length > 0 ? Math.round(totalDisbursed / loansThisMonth.length) : 0;
  }, [loansThisMonth, totalDisbursed]);


  const getTrendPercentage = (current, previous) => {
    if (previous === 0) {
      return current > 0 ? "New" : "0%";
    }
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const disbursedTrend = useMemo(() => getTrendPercentage(totalDisbursed, totalDisbursedLastMonth), [totalDisbursed, totalDisbursedLastMonth]);
  const collectedTrend = useMemo(() => getTrendPercentage(totalCollected, totalCollectedLastMonth), [totalCollected, totalCollectedLastMonth]);


  const defaultCards = useMemo(() => [
    {
      id: "investedCapital",
      label: "Invested Capital",
      value: `ZMW ${initialCapital.toLocaleString()}`,
      color: "primary",
      filter: "all",
      tooltip: "Initial capital invested into loans",
      progress: null,
      icon: iconMap.investedCapital,
    },
    {
      id: "availableCapital",
      label: "Available Capital",
      value: `ZMW ${availableCapital.toLocaleString()}`,
      color: "success",
      filter: "all",
      tooltip: "Capital currently available to issue new loans. Progress against initial capital.",
      progress: initialCapital > 0 ? availableCapital / initialCapital : 0,
      icon: iconMap.availableCapital,
    },
    {
      id: "totalDisbursed",
      label: "Total Disbursed",
      value: `ZMW ${totalDisbursed.toLocaleString()}`,
      color: "primary",
      filter: "all",
      tooltip: "Total principal amount disbursed this month",
      progress: null,
      icon: iconMap.totalDisbursed,
      trend: disbursedTrend,
    },
    {
      id: "totalCollected",
      label: "Total Collected",
      value: `ZMW ${totalCollected.toLocaleString()}`,
      color: "info",
      filter: "paid",
      tooltip: "Total amount collected from repayments this month",
      progress: totalDisbursed > 0 ? totalCollected / totalDisbursed : null,
      icon: iconMap.totalCollected,
      trend: collectedTrend,
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
      label: "Interest Expected",
      value: `ZMW ${totalExpectedProfit.toLocaleString()}`,
      color: "info",
      filter: "all",
      tooltip: "Total expected profit from interest",
      progress: null,
      icon: iconMap.expectedProfit,
    },
    {
      id: "actualProfit",
      label: "Actual Interest",
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
  ], [initialCapital, availableCapital, totalDisbursed, disbursedTrend, totalCollected, collectedTrend, totalLoansCount, paidLoansCount, activeLoansCount, overdueLoansCount, totalOutstanding, totalExpectedProfit, actualProfit, averageLoan]);


  const cardsToRender = useMemo(() => cardsOrder.length
    ? cardsOrder
        .map((id) => defaultCards.find((c) => c.id === id))
        .filter(Boolean)
    : defaultCards, [cardsOrder, defaultCards]);

  const executiveSummaryCards = useMemo(() => cardsToRender.filter(card =>
    EXECUTIVE_SUMMARY_IDS.includes(card.id)
  ), [cardsToRender]);

  const metricsCards = useMemo(() => cardsToRender.filter(card =>
    !EXECUTIVE_SUMMARY_IDS.includes(card.id)
  ), [cardsToRender]);

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    // Prevent dragging between Executive Summary and Metrics sections
    if (source.droppableId !== destination.droppableId) {
      toast.error("Cards cannot be moved between sections.");
      return;
    }

    let reorderedSectionIds;
    let currentGlobalOrder = Array.from(cardsOrder); // Start with a copy of the global order

    if (source.droppableId === "executive-summary-droppable") {
      const currentExecIds = executiveSummaryCards.map(card => card.id);
      reorderedSectionIds = Array.from(currentExecIds);
      const [removedId] = reorderedSectionIds.splice(source.index, 1);
      reorderedSectionIds.splice(destination.index, 0, removedId);

      // Reconstruct the global order: reordered executive cards + existing metrics cards
      const metricsSectionIds = metricsCards.map(card => card.id);
      currentGlobalOrder = [...reorderedSectionIds, ...metricsSectionIds];

    } else if (source.droppableId === "metrics-droppable") {
      const currentMetricsIds = metricsCards.map(card => card.id);
      reorderedSectionIds = Array.from(currentMetricsIds);
      const [removedId] = reorderedSectionIds.splice(source.index, 1);
      reorderedSectionIds.splice(destination.index, 0, removedId);

      // Reconstruct the global order: existing executive cards + reordered metrics cards
      const executiveSectionIds = executiveSummaryCards.map(card => card.id);
      currentGlobalOrder = [...executiveSectionIds, ...reorderedSectionIds];
    }

    setCardsOrder(currentGlobalOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentGlobalOrder));
    toast.success("Dashboard layout saved!");
  };


  const handleCardClick = (filter) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (selectedMonth) params.set("month", selectedMonth);
    navigate(`/loans?${params.toString()}`);
  };

  // Common responsive skeleton sizes
  const skeletonIconSize = isMobile ? 24 : 28;
  const skeletonTextHeight = isMobile ? 16 : 18;
  const skeletonValueHeight = isMobile ? 22 : 26;
  const skeletonProgressHeight = isMobile ? 4 : 5;


  // Skeleton for loading state
  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", background: theme.palette.background.default, pt: 0 }}>
        <Typography variant={isMobile ? "h6" : "h5"} gutterBottom sx={{ fontWeight: 600, mb: 0.5, mt: 0 }}>
          <Skeleton variant="text" width="40%" />
        </Typography>
        <Box mb={isMobile ? 1 : 1.5} maxWidth={isMobile ? "100%" : 180}>
          <Skeleton variant="rectangular" height={30} width="100%" sx={{ borderRadius: 1 }} />
        </Box>

        {/* Executive Summary Skeleton */}
        {/* Adjusted skeleton to match new bordered container */}
        <Box sx={{
          borderRadius: 2,
          p: isMobile ? 1.5 : 2,
          mb: isMobile ? 1.5 : 2,
          backgroundColor: theme.palette.grey[100], // Lighter background for skeleton container
          boxShadow: theme.shadows[1],
          border: `2px solid ${theme.palette.grey[300]}`, // Gray border for skeleton
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={isMobile ? 1 : 1.5}
            sx={{
              p: isMobile ? 1 : 1.5, borderRadius: 1, backgroundColor: theme.palette.grey[200]
            }}>
              <Skeleton variant="text" width="30%" height={isMobile ? 24 : 28} />
              <Skeleton variant="circular" width={20} height={20} />
          </Box>
          <Grid container spacing={isMobile ? 1 : 1.5}>
            {[...Array(4)].map((_, i) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={`exec-skel-${i}`}>
                <Card sx={{ p: isMobile ? 1 : 1.5, borderRadius: 2, boxShadow: theme.shadows[0], height: "100%", backgroundColor: theme.palette.grey[50] }}>
                  <Box display="flex" alignItems="center" mb={0.5} gap={0.5}>
                    <Skeleton variant="circular" width={skeletonIconSize} height={skeletonIconSize} />
                    <Skeleton variant="text" width="50%" height={skeletonTextHeight} />
                  </Box>
                  <Skeleton variant="text" width="70%" height={skeletonValueHeight} />
                  <Skeleton variant="rectangular" width="100%" height={skeletonProgressHeight} sx={{ mt: 0.5, borderRadius: 1 }} />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Metrics Skeleton */}
        {/* Adjusted skeleton to match new bordered container */}
        <Box sx={{
          borderRadius: 2,
          p: isMobile ? 1.5 : 2,
          mb: isMobile ? 1.5 : 2,
          backgroundColor: theme.palette.grey[100], // Lighter background for skeleton container
          boxShadow: theme.shadows[1],
          border: `2px solid ${theme.palette.grey[300]}`, // Gray border for skeleton
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={isMobile ? 1 : 1.5}
            sx={{
              p: isMobile ? 1 : 1.5, borderRadius: 1, backgroundColor: theme.palette.grey[200]
            }}>
            <Skeleton variant="text" width="40%" height={isMobile ? 24 : 28} />
            <Skeleton variant="circular" width={20} height={20} />
          </Box>
          <Grid container spacing={isMobile ? 1 : 1.5}>
            {[...Array(8)].map((_, i) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={`metrics-skel-${i}`}>
                <Card sx={{ p: isMobile ? 1 : 1.5, borderRadius: 2, boxShadow: theme.shadows[0], height: "100%", backgroundColor: theme.palette.grey[50] }}>
                  <Box display="flex" alignItems="center" mb={0.5} gap={0.5}>
                    <Skeleton variant="circular" width={skeletonIconSize} height={skeletonIconSize} />
                    <Skeleton variant="text" width="50%" height={skeletonTextHeight} />
                  </Box>
                  <Skeleton variant="text" width="70%" height={skeletonValueHeight} />
                  <Skeleton variant="rectangular" width="100%" height={skeletonProgressHeight} sx={{ mt: 0.5, borderRadius: 1 }} />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        textAlign="center"
        sx={{ background: theme.palette.background.default, pt: 0 }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No loans available yet!
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Start by adding your first loan to see your financial overview here.
        </Typography>
        <Fab
          color="primary"
          aria-label="Add Loan"
          onClick={() => navigate("/add-loan")}
          variant="extended"
          sx={{ mt: 1, borderRadius: 8, height: isMobile ? 36 : 44 }}
        >
          <AddIcon sx={{ mr: 0.5, fontSize: isMobile ? "small" : "medium" }} />
          Add First Loan
        </Fab>
      </Box>
    );
  }

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: "100vh", pt: 0 }}>
      <Typography
        variant={isMobile ? "h6" : "h5"}
        gutterBottom
        sx={{
          fontWeight: 700,
          mb: isMobile ? 0.5 : 1,
          mt: 0
        }}
      >
        Dashboard
      </Typography>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <Box mb={isMobile ? 1 : 2} maxWidth={isMobile ? "100%" : 180}>
          <TextField
            label="Filter by Month"
            type="month"
            size="small"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 1,
              },
            }}
          />
        </Box>
      </motion.div>
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Executive Summary Section with Blue Border and Header Inside */}
        <Box
          sx={{
            borderRadius: 2,
            p: isMobile ? 1.5 : 2, // Adjusted padding for the whole bordered box
            mb: isMobile ? 1.5 : 2,
            backgroundColor: theme.palette.background.paper, // Background for the whole section
            boxShadow: theme.shadows[2],
            border: (theme) => `2px solid ${theme.palette.primary.main}`, // The blue border!
          }}
        >
          {/* Header (title + toggle) - Now INSIDE the bordered box */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              cursor: "pointer",
              p: isMobile ? 1 : 1.5,
              borderRadius: 1, // Slight rounding for the header itself
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              transition: "background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: theme.palette.primary.main,
                boxShadow: theme.shadows[3],
              },
              mb: isMobile ? 1 : 1.5, // Margin below the header to separate from content
            }}
            onClick={handleToggleExecutiveSummary}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "inherit" }}>
              Executive Summary
            </Typography>
            <IconButton
              size="small"
              sx={{
                transition: "transform 0.3s ease-in-out",
                transform: showExecutiveSummary ? "rotate(180deg)" : "rotate(0deg)",
                color: "inherit",
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>

          {/* Collapsible Executive Summary Content */}
          <AnimatePresence>
            {showExecutiveSummary && (
              <motion.div
                key="executive-summary-section"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={metricsContainerVariants}
              >
                <Box
                  // Removed border, background, and shadow from this inner Box
                  sx={{
                    borderRadius: 2, // Keep border-radius for inner content (Grid) if desired
                    p: isMobile ? 0 : 0, // Removed padding here as it's now on the outer box
                  }}
                >
                  <Droppable
                    droppableId="executive-summary-droppable"
                    direction={isMobile ? "vertical" : "horizontal"}
                  >
                    {(provided) => (
                      <Grid
                        container
                        spacing={isMobile ? 1 : 1.5}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {executiveSummaryCards.map(
                          ({ id, label, value, color, filter, tooltip, progress, pulse, icon, trend }, index) => (
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
                                    whileHover={{ scale: 1.02, boxShadow: theme.shadows[4] }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ height: "100%" }}
                                    {...providedDraggable.dragHandleProps}
                                  >
                                    <Tooltip title={tooltip} arrow>
                                      <Card
                                        sx={{
                                          p: isMobile ? 1 : 1.5,
                                          cursor: "grab",
                                          borderRadius: 2,
                                          boxShadow: theme.shadows[1],
                                          animation: pulse ? "pulse 2s infinite" : undefined,
                                          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                          "&:hover": {
                                            boxShadow: pulse ? `0 0 12px ${theme.palette.error.light}` : theme.shadows[3],
                                            transform: "translateY(-3px)"
                                          },
                                          height: "100%",
                                          display: "flex",
                                          flexDirection: "column",
                                          justifyContent: "space-between",
                                          backgroundColor: theme.palette.background.default,
                                        }}
                                        onClick={() => handleCardClick(filter)}
                                        elevation={0}
                                      >
                                        <Box display="flex" flexDirection="column" alignItems="flex-start" mb={isMobile ? 0.5 : 0.5}>
                                          {React.cloneElement(icon, {
                                            fontSize: isMobile ? "small" : "medium",
                                            sx: { color: theme.palette[color].main, mb: 0.5 },
                                          })}
                                          <Typography variant={isMobile ? "caption" : "body2"} color="textSecondary" sx={{ fontWeight: 500 }}>
                                            {label}
                                          </Typography>
                                          <Typography variant="h5" fontWeight="bold" color="text.primary">
                                            {value}
                                          </Typography>
                                          {trend && (
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                color: trend.startsWith('+') || trend === '0%' || trend === 'New' ? theme.palette.success.main : theme.palette.error.main,
                                                fontWeight: 600,
                                                mt: 0.5,
                                              }}
                                            >
                                              {trend} vs. Last Month
                                            </Typography>
                                          )}
                                        </Box>
                                        {progress !== null && progress !== undefined && (
                                          <Box sx={{ mt: 'auto', pt: 1 }}>
                                            <LinearProgress
                                              variant="determinate"
                                              value={Math.min(progress * 100, 100)}
                                              sx={{
                                                height: isMobile ? 4 : 5,
                                                borderRadius: 2,
                                                backgroundColor: theme.palette[color].light,
                                                "& .MuiLinearProgress-bar": {
                                                  backgroundColor: theme.palette[color].main,
                                                  borderRadius: 2,
                                                },
                                              }}
                                            />
                                            {id === "availableCapital" && (
                                                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                                                  {Math.round(progress * 100)}% of Initial Capital
                                                </Typography>
                                            )}
                                          </Box>
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
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Metrics Section with Blue Border and Header Inside */}
        <Box
          sx={{
            borderRadius: 2,
            p: isMobile ? 1.5 : 2, // Adjusted padding for the whole bordered box
            mb: isMobile ? 1.5 : 2,
            backgroundColor: theme.palette.background.paper, // Background for the whole section
            boxShadow: theme.shadows[2],
            border: (theme) => `2px solid ${theme.palette.primary.main}`, // The blue border!
          }}
        >
          {/* Header (title + toggle) - Now INSIDE the bordered box */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              cursor: "pointer",
              p: isMobile ? 1 : 1.5,
              borderRadius: 1, // Slight rounding for the header itself
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              transition: "background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: theme.palette.primary.main,
                boxShadow: theme.shadows[3],
              },
              mb: isMobile ? 1 : 1.5, // Margin below the header to separate from content
            }}
            onClick={handleToggleMetrics}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "inherit" }}>
              Metrics
            </Typography>
            <IconButton
              size="small"
              sx={{
                transition: "transform 0.3s ease-in-out",
                transform: showMetrics ? "rotate(180deg)" : "rotate(0deg)",
                color: "inherit",
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          <AnimatePresence>
            {showMetrics && (
              <motion.div
                key="metrics-section"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={metricsContainerVariants}
              >
                <Box
                  // Removed border, background, and shadow from this inner Box
                  sx={{
                    borderRadius: 2, // Keep border-radius for inner content (Grid) if desired
                    p: isMobile ? 0 : 0, // Removed padding here as it's now on the outer box
                  }}
                >
                  <Droppable
                    droppableId="metrics-droppable"
                    direction={isMobile ? "vertical" : "horizontal"}
                  >
                    {(provided) => (
                      <Grid
                        container
                        spacing={isMobile ? 1 : 1.5}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {metricsCards.map(
                          ({ id, label, value, color, filter, tooltip, progress, pulse, icon }, index) => (
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
                                    whileHover={{ scale: 1.02, boxShadow: theme.shadows[4] }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ height: "100%" }}
                                    {...providedDraggable.dragHandleProps}
                                  >
                                    <Tooltip title={tooltip} arrow>
                                      <Card
                                        sx={{
                                          p: isMobile ? 1 : 1.5,
                                          cursor: "grab",
                                          borderRadius: 2,
                                          boxShadow: theme.shadows[1],
                                          animation: pulse ? "pulse 2s infinite" : undefined,
                                          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                          "&:hover": {
                                            boxShadow: pulse ? `0 0 12px ${theme.palette.error.light}` : theme.shadows[3],
                                            transform: "translateY(-3px)"
                                          },
                                          height: "100%",
                                          display: "flex",
                                          flexDirection: "column",
                                          justifyContent: "space-between",
                                          backgroundColor: theme.palette.background.default,
                                        }}
                                        onClick={() => handleCardClick(filter)}
                                        elevation={0}
                                      >
                                        <Box display="flex" flexDirection="column" alignItems="flex-start" mb={isMobile ? 0.5 : 0.5}>
                                          {React.cloneElement(icon, {
                                            fontSize: isMobile ? "small" : "medium",
                                            sx: { color: theme.palette[color].main, mb: 0.5 },
                                          })}
                                          <Typography variant={isMobile ? "caption" : "body2"} color="textSecondary" sx={{ fontWeight: 500 }}>
                                            {label}
                                          </Typography>
                                          <Typography variant="h5" fontWeight="bold" color="text.primary">
                                            {value}
                                          </Typography>
                                        </Box>
                                        {progress !== null && progress !== undefined && (
                                          <Box sx={{ mt: 'auto', pt: 1 }}>
                                            <LinearProgress
                                              variant="determinate"
                                              value={Math.min(progress * 100, 100)}
                                              sx={{
                                                height: isMobile ? 4 : 5,
                                                borderRadius: 2,
                                                backgroundColor: theme.palette[color].light,
                                                "& .MuiLinearProgress-bar": {
                                                  backgroundColor: theme.palette[color].main,
                                                  borderRadius: 2,
                                                },
                                              }}
                                            />
                                          </Box>
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
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </DragDropContext>

      {/* Floating Add Loan Button */}
      <Zoom in={true} timeout={500} style={{ transitionDelay: "500ms" }}>
        <Fab
          color="primary"
          aria-label="Add Loan"
          onClick={() => navigate("/add-loan")}
          sx={{
            position: "fixed",
            bottom: isMobile ? 64 : 24,
            right: isMobile ? 16 : 24,
            zIndex: 1300,
            boxShadow: theme.shadows[4],
            borderRadius: "50%",
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
            box-shadow: 0 10px 10px 10px rgba(255, 0, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
          }
        }
      `}</style>
    </Box>
  );
}
