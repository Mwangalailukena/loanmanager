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
  Fab, // Make sure Fab is imported
  Zoom,
  Skeleton,
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
import Charts from "../components/Charts";

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

const CHART_SECTION_VISIBILITY_KEY = "dashboardChartsVisibility";
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
  const [showCharts, setShowCharts] = useState(() => {
    const savedVisibility = localStorage.getItem(CHART_SECTION_VISIBILITY_KEY);
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
        try {
          const parsedOrder = JSON.parse(savedOrder);
          const validOrder = parsedOrder.filter(id => DEFAULT_CARD_IDS.includes(id));
          const finalOrder = [...new Set([...validOrder, ...DEFAULT_CARD_IDS])];
          setCardsOrder(finalOrder);
        } catch (error) {
          console.error("Error parsing saved card order from localStorage:", error);
          setCardsOrder(DEFAULT_CARD_IDS); // Fallback to default
        }
      } else {
        setCardsOrder(DEFAULT_CARD_IDS);
      }

      if (loans.length > 0) {
        const now = dayjs();
        const UPCOMING_LOAN_THRESHOLD_DAYS = 3;
        const upcomingDueThreshold = now.add(UPCOMING_LOAN_THRESHOLD_DAYS, 'day');

        const upcomingLoans = loans.filter(
          (loan) =>
            loan.status !== "Paid" &&
            dayjs(loan.dueDate).isAfter(now) &&
            dayjs(loan.dueDate).isBefore(upcomingDueThreshold)
        );

        const overdueLoansList = loans.filter(
          (loan) => loan.status !== "Paid" && dayjs(loan.dueDate).isBefore(now, 'day')
        );

        if (upcomingLoans.length > 0) {
          toast.info(`You have ${upcomingLoans.length} loan(s) due within ${UPCOMING_LOAN_THRESHOLD_DAYS} days!`);
        }
        if (overdueLoansList.length > 0) {
          toast.error(`You have ${overdueLoansList.length} overdue loan(s)! Please take action.`);
        }
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

  const handleToggleCharts = () => {
    setShowCharts((prev) => {
      const newState = !prev;
      localStorage.setItem(CHART_SECTION_VISIBILITY_KEY, JSON.stringify(newState));
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

    if (source.droppableId !== destination.droppableId) {
      toast.error("Cards cannot be moved between sections.");
      return;
    }

    let reorderedSectionIds;
    let currentGlobalOrder = Array.from(cardsOrder);

    if (source.droppableId === "executive-summary-droppable") {
      const currentExecIds = executiveSummaryCards.map(card => card.id);
      reorderedSectionIds = Array.from(currentExecIds);
      const [removedId] = reorderedSectionIds.splice(source.index, 1);
      reorderedSectionIds.splice(destination.index, 0, removedId);

      const metricsSectionIds = metricsCards.map(card => card.id);
      currentGlobalOrder = [...reorderedSectionIds, ...metricsSectionIds];

    } else if (source.droppableId === "metrics-droppable") {
      const currentMetricsIds = metricsCards.map(card => card.id);
      reorderedSectionIds = Array.from(currentMetricsIds);
      const [removedId] = reorderedSectionIds.splice(source.index, 1);
      reorderedSectionIds.splice(destination.index, 0, removedId);

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

  const skeletonIconSize = isMobile ? 24 : 28;
  const skeletonTextHeight = isMobile ? 16 : 18;
  const skeletonValueHeight = isMobile ? 22 : 26;
  const skeletonProgressHeight = isMobile ? 4 : 5;


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
        <Box sx={{
          borderRadius: 2,
          p: isMobile ? 1.5 : 2,
          mb: isMobile ? 1.5 : 2,
          backgroundColor: theme.palette.grey[100],
          boxShadow: theme.shadows[1],
          border: `2px solid ${theme.palette.primary.main}`, // Blue border for skeleton
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
        <Box sx={{
          borderRadius: 2,
          p: isMobile ? 1.5 : 2,
          mb: isMobile ? 1.5 : 2,
          backgroundColor: theme.palette.grey[100],
          boxShadow: theme.shadows[1],
          border: `2px solid ${theme.palette.primary.main}`, // Blue border for skeleton
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={isMobile ? 1 : 1.5}
            sx={{
              p: isMobile ? 1 : 1.5, borderRadius: 1, backgroundColor: theme.palette.grey[200]
            }}>
              <Skeleton variant="text" width="30%" height={isMobile ? 24 : 28} />
              <Skeleton variant="circular" width={20} height={20} />
          </Box>
          <Grid container spacing={isMobile ? 1 : 1.5}>
            {[...Array(6)].map((_, i) => ( // 6 skeletons for general metrics
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

        {/* Charts Skeleton */}
        <Box sx={{
          borderRadius: 2,
          p: isMobile ? 1.5 : 2,
          mb: isMobile ? 1.5 : 2,
          backgroundColor: theme.palette.grey[100],
          boxShadow: theme.shadows[1],
          border: `2px solid ${theme.palette.primary.main}`, // Blue border for skeleton
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={isMobile ? 1 : 1.5}
            sx={{
              p: isMobile ? 1 : 1.5, borderRadius: 1, backgroundColor: theme.palette.grey[200]
            }}>
              <Skeleton variant="text" width="30%" height={isMobile ? 24 : 28} />
              <Skeleton variant="circular" width={20} height={20} />
          </Box>
          <Grid container spacing={isMobile ? 1.5 : 2}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />
            </Grid>
          </Grid>
        </Box>

      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: theme.palette.background.default, p: isMobile ? 2 : 3 }}>
      <Typography variant={isMobile ? "h6" : "h5"} gutterBottom sx={{ fontWeight: 600, mb: 0.5 }}>
        Dashboard
      </Typography>

      <Box mb={isMobile ? 1 : 1.5} maxWidth={isMobile ? "100%" : 180}>
        <TextField
          label="Select Month"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          size="small"
          fullWidth
          InputLabelProps={{
            shrink: true,
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              backgroundColor: theme.palette.background.paper,
            },
            "& .MuiInputBase-input": {
              padding: isMobile ? "8px 10px" : "10px 14px",
            },
            "& .MuiInputLabel-root": {
              transform: isMobile ? "translate(14px, 7px) scale(0.75)" : "translate(14px, 10px) scale(0.75)",
            },
            "& .MuiInputLabel-shrink": {
              transform: "translate(14px, -9px) scale(0.75)",
            }
          }}
        />
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Executive Summary Section */}
        <Box sx={{
          borderRadius: 2,
          p: isMobile ? 1.5 : 2,
          mb: isMobile ? 1.5 : 2,
          backgroundColor: theme.palette.grey[100],
          boxShadow: theme.shadows[1],
          border: `2px solid ${theme.palette.primary.main}`, // Changed to primary.main for blue
          overflow: 'hidden',
        }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={isMobile ? 1 : 1.5}
            sx={{
              p: isMobile ? 1 : 1.5,
              borderRadius: 1,
              backgroundColor: theme.palette.grey[200],
              cursor: 'pointer',
            }}
            onClick={handleToggleExecutiveSummary}
          >
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Executive Summary
            </Typography>
            <IconButton
              onClick={handleToggleExecutiveSummary}
              size="small"
              sx={{
                transform: showExecutiveSummary ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease-in-out',
                width: 20,
                height: 20,
                color: theme.palette.primary.main, // Changed icon color to primary.main
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          <AnimatePresence>
            {showExecutiveSummary && (
              <motion.div
                key="executive-summary-content"
                variants={metricsContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Droppable droppableId="executive-summary-droppable" direction="horizontal">
                  {(provided) => (
                    <Grid
                      container
                      spacing={isMobile ? 1 : 1.5}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {executiveSummaryCards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <Grid
                              item
                              xs={6}
                              sm={4}
                              md={3}
                              lg={2}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                userSelect: snapshot.isDragging ? 'none' : 'auto',
                              }}
                            >
                              <Tooltip title={card.tooltip} arrow placement="top">
                                <motion.div
                                  variants={cardVariants}
                                  initial="hidden"
                                  animate="visible"
                                  custom={index}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleCardClick(card.filter)}
                                  style={{ height: "100%" }}
                                >
                                  <Card
                                    sx={{
                                      p: isMobile ? 1 : 1.5,
                                      borderRadius: 2,
                                      height: "100%",
                                      display: "flex",
                                      flexDirection: "column",
                                      justifyContent: "space-between",
                                      backgroundColor: theme.palette.background.paper,
                                      boxShadow: theme.shadows[0],
                                      border: `1px solid ${theme.palette.grey[200]}`,
                                      transition: "box-shadow 0.3s ease-in-out",
                                      "&:hover": {
                                        boxShadow: theme.shadows[2],
                                        cursor: "pointer",
                                      },
                                      ...(card.pulse && {
                                        animation: 'pulse 1.5s infinite',
                                      }),
                                    }}
                                  >
                                    <Box display="flex" alignItems="center" mb={0.5} gap={0.5}>
                                      <Box
                                        sx={{
                                          color: theme.palette[card.color]?.main || theme.palette.text.primary,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        {card.icon}
                                      </Box>
                                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                                        {card.label}
                                      </Typography>
                                    </Box>
                                    <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, mb: card.progress !== null ? 0.5 : 0 }}>
                                      {card.value}
                                    </Typography>
                                    {card.progress !== null && (
                                      <LinearProgress
                                        variant="determinate"
                                        value={card.progress * 100}
                                        sx={{
                                          height: 5,
                                          borderRadius: 2,
                                          backgroundColor: theme.palette.grey[300],
                                          "& .MuiLinearProgress-bar": {
                                            backgroundColor: theme.palette[card.color]?.main || theme.palette.primary.main,
                                          },
                                        }}
                                      />
                                    )}
                                    {card.trend && (
                                        <Typography variant="caption" sx={{ color: card.trend.startsWith('+') ? theme.palette.success.main : (card.trend.startsWith('-') ? theme.palette.error.main : theme.palette.text.secondary), fontWeight: 600, mt: 0.5 }}>
                                          {card.trend} vs. last month
                                        </Typography>
                                    )}
                                  </Card>
                                </motion.div>
                              </Tooltip>
                            </Grid>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Grid>
                  )}
                </Droppable>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Metrics Section */}
        <Box sx={{
          borderRadius: 2,
          p: isMobile ? 1.5 : 2,
          mb: isMobile ? 1.5 : 2,
          backgroundColor: theme.palette.grey[100],
          boxShadow: theme.shadows[1],
          border: `2px solid ${theme.palette.primary.main}`, // Changed to primary.main for blue
          overflow: 'hidden',
        }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={isMobile ? 1 : 1.5}
            sx={{
              p: isMobile ? 1 : 1.5,
              borderRadius: 1,
              backgroundColor: theme.palette.grey[200],
              cursor: 'pointer',
            }}
            onClick={handleToggleMetrics}
          >
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Key Metrics
            </Typography>
            <IconButton
              onClick={handleToggleMetrics}
              size="small"
              sx={{
                transform: showMetrics ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease-in-out',
                width: 20,
                height: 20,
                color: theme.palette.primary.main, // Changed icon color to primary.main
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          <AnimatePresence>
            {showMetrics && (
              <motion.div
                key="metrics-content"
                variants={metricsContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Droppable droppableId="metrics-droppable" direction="horizontal">
                  {(provided) => (
                    <Grid
                      container
                      spacing={isMobile ? 1 : 1.5}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {metricsCards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <Grid
                              item
                              xs={6}
                              sm={4}
                              md={3}
                              lg={2}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                userSelect: snapshot.isDragging ? 'none' : 'auto',
                              }}
                            >
                              <Tooltip title={card.tooltip} arrow placement="top">
                                <motion.div
                                  variants={cardVariants}
                                  initial="hidden"
                                  animate="visible"
                                  custom={index}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleCardClick(card.filter)}
                                  style={{ height: "100%" }}
                                >
                                  <Card
                                    sx={{
                                      p: isMobile ? 1 : 1.5,
                                      borderRadius: 2,
                                      height: "100%",
                                      display: "flex",
                                      flexDirection: "column",
                                      justifyContent: "space-between",
                                      backgroundColor: theme.palette.background.paper,
                                      boxShadow: theme.shadows[0],
                                      border: `1px solid ${theme.palette.grey[200]}`,
                                      transition: "box-shadow 0.3s ease-in-out",
                                      "&:hover": {
                                        boxShadow: theme.shadows[2],
                                        cursor: "pointer",
                                      },
                                      ...(card.pulse && {
                                        animation: 'pulse 1.5s infinite',
                                      }),
                                    }}
                                  >
                                    <Box display="flex" alignItems="center" mb={0.5} gap={0.5}>
                                      <Box
                                        sx={{
                                          color: theme.palette[card.color]?.main || theme.palette.text.primary,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        {card.icon}
                                      </Box>
                                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                                        {card.label}
                                      </Typography>
                                    </Box>
                                    <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, mb: card.progress !== null ? 0.5 : 0 }}>
                                      {card.value}
                                    </Typography>
                                    {card.progress !== null && (
                                      <LinearProgress
                                        variant="determinate"
                                        value={card.progress * 100}
                                        sx={{
                                          height: 5,
                                          borderRadius: 2,
                                          backgroundColor: theme.palette.grey[300],
                                          "& .MuiLinearProgress-bar": {
                                            backgroundColor: theme.palette[card.color]?.main || theme.palette.primary.main,
                                          },
                                        }}
                                      />
                                    )}
                                    {card.trend && (
                                        <Typography variant="caption" sx={{ color: card.trend.startsWith('+') ? theme.palette.success.main : (card.trend.startsWith('-') ? theme.palette.error.main : theme.palette.text.secondary), fontWeight: 600, mt: 0.5 }}>
                                          {card.trend} vs. last month
                                        </Typography>
                                    )}
                                  </Card>
                                </motion.div>
                              </Tooltip>
                            </Grid>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Grid>
                  )}
                </Droppable>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Charts Section */}
        <Box sx={{
          borderRadius: 2,
          p: isMobile ? 1.5 : 2,
          mb: isMobile ? 1.5 : 2,
          backgroundColor: theme.palette.grey[100],
          boxShadow: theme.shadows[1],
          border: `2px solid ${theme.palette.primary.main}`, // Changed to primary.main for blue
          overflow: 'hidden',
        }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={isMobile ? 1 : 1.5}
            sx={{
              p: isMobile ? 1 : 1.5,
              borderRadius: 1,
              backgroundColor: theme.palette.grey[200],
              cursor: 'pointer',
            }}
            onClick={handleToggleCharts}
          >
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Charts
            </Typography>
            <IconButton
              onClick={handleToggleCharts}
              size="small"
              sx={{
                transform: showCharts ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease-in-out',
                width: 20,
                height: 20,
                color: theme.palette.primary.main, // Changed icon color to primary.main
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          <AnimatePresence>
            {showCharts && (
              <motion.div
                key="charts-content"
                variants={metricsContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Charts loans={loansForCalculations} selectedMonth={selectedMonth} />
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </DragDropContext>

      <Zoom in timeout={300} style={{ transitionDelay: '50ms' }}>
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: "fixed",
            bottom: isMobile ? 16 : 32,
            right: isMobile ? 16 : 32,
            zIndex: theme.zIndex.speedDial, // <-- Add this line
          }}
          onClick={() => navigate("/loans/new")}
        >
          <AddIcon />
        </Fab>
      </Zoom>
    </Box>
  );
}
