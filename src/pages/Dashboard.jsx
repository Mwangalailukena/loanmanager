import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Backdrop,
  CircularProgress,
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
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useFirestore } from "../contexts/FirestoreProvider";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Charts from "../components/Charts";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNavBar";

// --- Constants & Animations ---
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

const STORAGE_KEY = "dashboardCardOrder";
const EXECUTIVE_SUMMARY_VISIBILITY_KEY = "dashboardExecutiveSummaryVisibility";
const METRICS_VISIBILITY_KEY = "dashboardMetricsVisibility";
const CHART_SECTION_VISIBILITY_KEY = "dashboardChartsVisibility";

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

const getInitialVisibility = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error("Failed to parse localStorage item:", key, e);
    return defaultValue;
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { loans, settings } = useFirestore();

  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [cardsOrder, setCardsOrder] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSections, setShowSections] = useState({
    executive: getInitialVisibility(EXECUTIVE_SUMMARY_VISIBILITY_KEY, true),
    metrics: getInitialVisibility(METRICS_VISIBILITY_KEY, true),
    charts: getInitialVisibility(CHART_SECTION_VISIBILITY_KEY, true),
  });

  const handleToggleSection = useCallback((section) => {
    setShowSections((prev) => {
      const newState = { ...prev, [section]: !prev[section] };
      const key =
        section === "executive"
          ? EXECUTIVE_SUMMARY_VISIBILITY_KEY
          : section === "metrics"
          ? METRICS_VISIBILITY_KEY
          : CHART_SECTION_VISIBILITY_KEY;
      localStorage.setItem(key, JSON.stringify(newState[section]));
      return newState;
    });
  }, []);

  const iconMap = useMemo(() => {
    const iconSize = { fontSize: isMobile ? 22 : 24 };
    return {
      totalLoans: <MonetizationOnIcon sx={iconSize} />,
      paidLoans: <CheckCircleIcon sx={iconSize} />,
      activeLoans: <PendingIcon sx={iconSize} />,
      overdueLoans: (overdueCount) => (
        <Badge
          badgeContent={overdueCount > 0 ? overdueCount : null}
          color="error"
          overlap="circular"
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{
            "& .MuiBadge-badge": {
              height: "18px",
              minWidth: "18px",
              padding: "0 4px",
              fontSize: "12px",
            },
          }}
        >
          <WarningIcon sx={iconSize} />
        </Badge>
      ),
      totalDisbursed: <MonetizationOnIcon sx={iconSize} />,
      investedCapital: <AccountBalanceWalletIcon sx={iconSize} />,
      availableCapital: <AccountBalanceWalletIcon sx={iconSize} />,
      totalCollected: <PaidIcon sx={iconSize} />,
      totalOutstanding: <WarningIcon sx={iconSize} />,
      expectedProfit: <BarChartIcon sx={iconSize} />,
      actualProfit: <CheckCircleIcon sx={iconSize} />,
      averageLoan: <MonetizationOnIcon sx={iconSize} />,
    };
  }, [isMobile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loans) {
        setLoading(false);
      }
    }, 500);

    if (loans) {
      const savedOrder = localStorage.getItem(STORAGE_KEY);
      try {
        const parsedOrder = savedOrder ? JSON.parse(savedOrder) : [];
        const validOrder = parsedOrder.filter((id) =>
          DEFAULT_CARD_IDS.includes(id)
        );
        const finalOrder = [...new Set([...validOrder, ...DEFAULT_CARD_IDS])];
        setCardsOrder(finalOrder);
      } catch (error) {
        console.error("Error parsing saved card order from localStorage:", error);
        setCardsOrder(DEFAULT_CARD_IDS);
      }

      if (loans.length > 0) {
        const now = dayjs();
        const UPCOMING_LOAN_THRESHOLD_DAYS = 3;
        const upcomingDueThreshold = now.add(UPCOMING_LOAN_THRESHOLD_DAYS, "day");

        const upcomingLoans = loans.filter(
          (l) =>
            l.status !== "Paid" &&
            dayjs(l.dueDate).isAfter(now) &&
            dayjs(l.dueDate).isBefore(upcomingDueThreshold)
        );
        const overdueLoansList = loans.filter(
          (l) => l.status !== "Paid" && dayjs(l.dueDate).isBefore(now, "day")
        );

        if (upcomingLoans.length > 0)
          toast.info(
            `You have ${upcomingLoans.length} loan(s) due within ${UPCOMING_LOAN_THRESHOLD_DAYS} days!`
          );
        if (overdueLoansList.length > 0)
          toast.error(
            `You have ${overdueLoansList.length} overdue loan(s)! Please take action.`
          );
      }
    }

    return () => clearTimeout(timer);
  }, [loans]);

  const { loansForCalculations, defaultCards } = useMemo(() => {
    const loansForCalculations = loans || [];
    const loansThisMonth = loansForCalculations.filter((loan) =>
      loan.startDate.startsWith(selectedMonth)
    );
    const previousMonth = dayjs(selectedMonth).subtract(1, "month").format("YYYY-MM");
    const loansLastMonth = loansForCalculations.filter(
      (loan) => dayjs(loan.startDate).format("YYYY-MM") === previousMonth
    );

    const totalDisbursed = loansThisMonth.reduce(
      (sum, loan) => sum + Number(loan.principal || 0),
      0
    );
    const totalCollected = loansThisMonth.reduce(
      (sum, loan) => sum + Number(loan.repaidAmount || 0),
      0
    );
    const totalDisbursedLastMonth = loansLastMonth.reduce(
      (sum, loan) => sum + Number(loan.principal || 0),
      0
    );
    const totalCollectedLastMonth = loansLastMonth.reduce(
      (sum, loan) => sum + Number(loan.repaidAmount || 0),
      0
    );

    const initialCapital = Number(settings?.initialCapital) || 60000;
    const availableCapital = initialCapital - totalDisbursed + totalCollected;
    const totalLoansCount = loansThisMonth.length;
    const paidLoansCount = loansThisMonth.filter((l) => l.status === "Paid").length;
    const activeLoansCount = loansThisMonth.filter(
      (l) => l.status === "Active"
    ).length;
    const overdueLoansCount = loansThisMonth.filter(
      (l) => l.status === "Active" && dayjs(l.dueDate).isBefore(dayjs(), "day")
    ).length;

    const totalOutstanding = loansThisMonth
      .filter((loan) => loan.status === "Active")
      .reduce(
        (sum, loan) =>
          sum +
          (Number(loan.principal || 0) +
            Number(loan.interest || 0) -
            Number(loan.repaidAmount || 0)),
        0
      );

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

    const averageLoan = totalLoansCount > 0 ? Math.round(totalDisbursed / totalLoansCount) : 0;

    const getTrendPercentage = (current, previous) => {
      if (previous === 0) return current > 0 ? "New" : null;
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
    };

    const disbursedTrend = getTrendPercentage(totalDisbursed, totalDisbursedLastMonth);
    const collectedTrend = getTrendPercentage(totalCollected, totalCollectedLastMonth);

    const defaultCards = [
      {
        id: "investedCapital",
        label: "Invested Capital",
        value: `K ${initialCapital.toLocaleString()}`,
        color: "primary",
        filter: "all",
        tooltip: "Initial capital invested into loans",
        progress: null,
        icon: iconMap.investedCapital,
      },
      {
        id: "availableCapital",
        label: "Available Capital",
        value: `K ${availableCapital.toLocaleString()}`,
        color: "success",
        filter: "all",
        tooltip: "Capital currently available to issue new loans. Progress against initial capital.",
        progress: initialCapital > 0 ? availableCapital / initialCapital : 0,
        icon: iconMap.availableCapital,
      },
      {
        id: "totalDisbursed",
        label: "Total Disbursed",
        value: `K ${totalDisbursed.toLocaleString()}`,
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
        value: `K ${totalCollected.toLocaleString()}`,
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
        icon: iconMap.overdueLoans(overdueLoansCount),
        pulse: overdueLoansCount > 0,
      },
      {
        id: "totalOutstanding",
        label: "Total Outstanding",
        value: `K ${totalOutstanding.toLocaleString()}`,
        color: "warning",
        filter: "active",
        tooltip: "Total outstanding repayments still due",
        progress: null,
        icon: iconMap.totalOutstanding,
      },
      {
        id: "expectedProfit",
        label: "Interest Expected",
        value: `K ${totalExpectedProfit.toLocaleString()}`,
        color: "secondary", // <-- Changed to accent color
        filter: "all",
        tooltip: "Total expected profit from interest",
        progress: null,
        icon: iconMap.expectedProfit,
      },
      {
        id: "actualProfit",
        label: "Actual Interest",
        value: `K ${actualProfit.toLocaleString()}`,
        color: "success",
        filter: "paid",
        tooltip: "Profit earned from fully repaid loans",
        progress: totalExpectedProfit > 0 ? actualProfit / totalExpectedProfit : null,
        icon: iconMap.actualProfit,
      },
      {
        id: "averageLoan",
        label: "Average Loan",
        value: `K ${averageLoan.toLocaleString()}`,
        color: "primary",
        filter: "all",
        tooltip: "Average loan amount issued this month",
        progress: null,
        icon: iconMap.averageLoan,
      },
    ];

    return { loansForCalculations, defaultCards };
  }, [loans, selectedMonth, settings, iconMap]);

  const cardsToRender = useMemo(
    () =>
      cardsOrder.length
        ? cardsOrder.map((id) => defaultCards.find((c) => c.id === id)).filter(Boolean)
        : defaultCards,
    [cardsOrder, defaultCards]
  );
  const executiveSummaryCards = cardsToRender.filter((card) =>
    EXECUTIVE_SUMMARY_IDS.includes(card.id)
  );
  const metricsCards = cardsToRender.filter(
    (card) => !EXECUTIVE_SUMMARY_IDS.includes(card.id)
  );

  const onDragEnd = useCallback(
    (result) => {
      const { source, destination } = result;
      if (!destination || source.droppableId !== destination.droppableId) {
        toast.error("Cards cannot be moved between sections.");
        return;
      }

      let reorderedCards;
      let newCardsOrder;

      if (source.droppableId === "executive-summary-droppable") {
        reorderedCards = Array.from(executiveSummaryCards);
        const [removed] = reorderedCards.splice(source.index, 1);
        reorderedCards.splice(destination.index, 0, removed);
        const metricsSectionIds = metricsCards.map((c) => c.id);
        newCardsOrder = [...reorderedCards.map((c) => c.id), ...metricsSectionIds];
      } else {
        reorderedCards = Array.from(metricsCards);
        const [removed] = reorderedCards.splice(source.index, 1);
        reorderedCards.splice(destination.index, 0, removed);
        const executiveSectionIds = executiveSummaryCards.map((c) => c.id);
        newCardsOrder = [...executiveSectionIds, ...reorderedCards.map((c) => c.id)];
      }

      setCardsOrder(newCardsOrder);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCardsOrder));
      toast.success("Dashboard layout saved!");
    },
    [executiveSummaryCards, metricsCards]
  );

  const handleCardClick = (filter) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (selectedMonth) params.set("month", selectedMonth);
    navigate(`/loans?${params.toString()}`);
  };

  const AccordionTitle = ({ title, sx }) => (
    <Typography
      variant="body1"
      sx={{
        fontWeight: 600,
        color: theme.palette.text.primary,
        fontSize: isMobile ? "0.9rem" : "1rem",
        ...sx,
      }}
    >
      {title}
    </Typography>
  );

  if (loading) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.palette.background.default,
        }}
        open={loading}
      >
        <CircularProgress color="primary" />
        <Typography variant="h6" sx={{ mt: 2, color: theme.palette.text.primary }}>
          Loading dashboard...
        </Typography>
      </Backdrop>
    );
  }

  const renderCardSection = (cards, droppableId) => (
    <Droppable droppableId={droppableId} direction="horizontal">
      {(provided) => (
        <Grid
          container
          spacing={isMobile ? 1 : 1.5}
          {...provided.droppableProps}
          ref={provided.innerRef}
        >
          {cards.map((card, index) => (
            <Draggable key={card.id} draggableId={card.id} index={index}>
              {(provided, snapshot) => (
                <Grid
                  item
                  xs={6}
                  sm={6}
                  md={6}
                  lg={6}
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={{
                    ...provided.draggableProps.style,
                    userSelect: snapshot.isDragging ? "none" : "auto",
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
                          alignItems: "center",
                          textAlign: "center",
                          backgroundColor: theme.palette.background.paper,
                          boxShadow: theme.shadows[0],
                          border: `1px solid ${theme.palette.grey[200]}`,
                          transition: "box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out",
                          "&:hover": {
                            boxShadow: theme.shadows[2],
                            cursor: "pointer",
                            borderColor: theme.palette[card.color]?.main || theme.palette.primary.main,
                          },
                          ...(card.pulse && { animation: "pulse 1.5s infinite" }),
                        }}
                      >
                        <Box
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          mb={0.5}
                          gap={0.5}
                        >
                          <Box sx={{ color: theme.palette[card.color]?.main || theme.palette.text.primary }}>
                            {typeof card.icon === "function" ? card.icon(card.value) : card.icon}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}
                          >
                            {card.label}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            flexGrow: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              lineHeight: 1.1,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: isMobile ? "1.5rem" : "1.8rem",
                            }}
                          >
                            {card.value}
                          </Typography>
                        </Box>
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
                              width: "80%",
                              mt: 0.5,
                              mb: 0.5,
                            }}
                          />
                        )}
                        {card.trend && (
                          <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                            {card.trend.startsWith("+") ? (
                              <ArrowUpwardIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                            ) : (
                              <ArrowDownwardIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                color: card.trend.startsWith("+")
                                  ? theme.palette.success.main
                                  : theme.palette.error.main,
                                fontWeight: 600,
                              }}
                            >
                              {card.trend} vs. last month
                            </Typography>
                          </Box>
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
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: theme.palette.background.default,
        p: isMobile ? 2 : 3,
        pb: isMobile ? `calc(${BOTTOM_NAV_HEIGHT}px + ${theme.spacing(2)})` : 3,
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: "1.5rem", md: "2rem" } }}>
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
          InputLabelProps={{ shrink: true }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1.5,
              backgroundColor: theme.palette.background.paper,
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.secondary.main,
              },
            },
            "& .MuiInputBase-input": {
              padding: isMobile ? "8px 10px" : "10px 14px",
            },
            "& .MuiInputLabel-root": {
              transform: isMobile ? "translate(14px, 7px) scale(0.75)" : "translate(14px, 10px) scale(0.75)",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: theme.palette.secondary.main,
            },
            "& .MuiInputLabel-shrink": {
              transform: "translate(14px, -9px) scale(0.75)",
            },
          }}
        />
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Accordion
          expanded={showSections.executive}
          onChange={() => handleToggleSection("executive")}
          sx={{
            borderRadius: 2,
            mb: isMobile ? 2 : 4,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[1],
            overflow: "hidden",
            "&.MuiAccordion-root": {
              p: 0,
              transition: theme.transitions.create(["box-shadow", "background-color"], {
                duration: theme.transitions.duration.short,
              }),
            },
            "&.MuiAccordion-root.Mui-expanded": {
              margin: 0,
              "&:before": { opacity: 0 },
              boxShadow: theme.shadows[4],
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.primary.contrastText }} />}
            sx={{
              backgroundColor: theme.palette.primary.main,
              p: isMobile ? "8px 16px" : "12px 24px",
              minHeight: "48px !important",
              "&.Mui-expanded": { minHeight: "48px !important" },
              "& .MuiAccordionSummary-content": { margin: 0, alignItems: "center" },
            }}
          >
            <AccordionTitle title="Executive Summary" sx={{ color: theme.palette.primary.contrastText }} />
          </AccordionSummary>
          <AccordionDetails sx={{ p: isMobile ? 1.5 : 2, pb: isMobile ? 2 : 3 }}>
            {renderCardSection(executiveSummaryCards, "executive-summary-droppable")}
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={showSections.metrics}
          onChange={() => handleToggleSection("metrics")}
          sx={{
            borderRadius: 2,
            mb: isMobile ? 2 : 4,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[1],
            overflow: "hidden",
            "&.MuiAccordion-root": {
              p: 0,
              transition: theme.transitions.create(["box-shadow", "background-color"], {
                duration: theme.transitions.duration.short,
              }),
            },
            "&.MuiAccordion-root.Mui-expanded": {
              margin: 0,
              "&:before": { opacity: 0 },
              boxShadow: theme.shadows[4],
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.primary.contrastText }} />}
            sx={{
              backgroundColor: theme.palette.primary.main,
              p: isMobile ? "8px 16px" : "12px 24px",
              minHeight: "48px !important",
              "&.Mui-expanded": { minHeight: "48px !important" },
              "& .MuiAccordionSummary-content": { margin: 0, alignItems: "center" },
            }}
          >
            <AccordionTitle title="Metrics" sx={{ color: theme.palette.primary.contrastText }} />
          </AccordionSummary>
          <AccordionDetails sx={{ p: isMobile ? 1.5 : 2, pb: isMobile ? 2 : 3 }}>
            {renderCardSection(metricsCards, "metrics-droppable")}
          </AccordionDetails>
        </Accordion>
      </DragDropContext>

      <Accordion
        expanded={showSections.charts}
        onChange={() => handleToggleSection("charts")}
        sx={{
          borderRadius: 2,
          mb: `calc(${BOTTOM_NAV_HEIGHT}px + ${theme.spacing(2)})`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[1],
          overflow: "hidden",
          "&.MuiAccordion-root": {
            p: 0,
            transition: theme.transitions.create(["box-shadow", "background-color"], {
              duration: theme.transitions.duration.short,
            }),
          },
          "&.MuiAccordion-root.Mui-expanded": {
            margin: 0,
            "&:before": { opacity: 0 },
            boxShadow: theme.shadows[4],
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.primary.contrastText }} />}
          sx={{
            backgroundColor: theme.palette.primary.main,
            p: isMobile ? "8px 16px" : "12px 24px",
            minHeight: "48px !important",
            "&.Mui-expanded": { minHeight: "48px !important" },
            "& .MuiAccordionSummary-content": { margin: 0, alignItems: "center" },
          }}
        >
          <AccordionTitle title="Charts & Analytics" sx={{ color: theme.palette.primary.contrastText }} />
        </AccordionSummary>
        <AccordionDetails sx={{ p: isMobile ? 1.5 : 2, pb: isMobile ? 2 : 3 }}>
          {loansForCalculations.length > 0 ? (
            <Charts loans={loansForCalculations} selectedMonth={selectedMonth} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No loan data available for charts.
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      <Zoom
        in
        style={{
          position: "fixed",
          bottom: isMobile ? `calc(${BOTTOM_NAV_HEIGHT}px + 16px)` : 16,
          right: 16,
        }}
        timeout={500}
        unmountOnExit
      >
        <Fab
          color="secondary" // <-- Changed to accent color
          aria-label="add loan"
          onClick={() => navigate("/new-loan")}
        >
          <AddIcon />
        </Fab>
      </Zoom>
    </Box>
  );
}
