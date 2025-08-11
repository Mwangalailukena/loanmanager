import React, { useState, useEffect, useCallback, lazy, Suspense, useMemo } from "react";
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  TextField,
  Fab,
  Zoom,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useNavigate } from "react-router-dom";
import { useFirestore } from "../contexts/FirestoreProvider";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { DragDropContext } from "@hello-pangea/dnd";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNavBar";
import { useDashboardCalculations } from "../hooks/dashboard/useDashboardCalculations";
import DashboardSection from "../components/dashboard/DashboardSection";

const LazyCharts = lazy(() => import("../components/Charts"));

const STORAGE_KEY = "dashboardCardOrder";
const EXECUTIVE_SUMMARY_VISIBILITY_KEY = "dashboardExecutiveSummaryVisibility";
const METRICS_VISIBILITY_KEY = "dashboardMetricsVisibility";
const CHART_SECTION_VISIBILITY_KEY = "dashboardChartsVisibility";

const DEFAULT_CARD_IDS = [
  "investedCapital",
  "availableCapital",
  "totalDisbursed",
  "totalCollected",
  "partnerDividends",
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
  "partnerDividends",
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

  const { loansForCalculations, defaultCards } = useDashboardCalculations(
    loans,
    selectedMonth,
    settings,
    isMobile
  );

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

        const calcStatus = (loan) => {
          const totalRepayable = Number(loan.totalRepayable || 0);
          const repaidAmount = Number(loan.repaidAmount || 0);

          if (repaidAmount >= totalRepayable && totalRepayable > 0) {
            return "Paid";
          }
          const now = dayjs();
          const due = dayjs(loan.dueDate);
          if (due.isBefore(now, "day")) {
            return "Overdue";
          }
          return "Active";
        };

        const upcomingLoans = loans.filter(
          (l) =>
            calcStatus(l) === "Active" &&
            dayjs(l.dueDate).isAfter(now) &&
            dayjs(l.dueDate).isBefore(upcomingDueThreshold)
        );

        const overdueLoansList = loans.filter((l) => calcStatus(l) === "Overdue");

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
        fontSize: isMobile ? "0.8rem" : "1rem",
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
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
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
      <Box mb={isMobile ? 1.5 : 2} maxWidth={isMobile ? "100%" : 200}>
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
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.secondary.main,
              },
            },
            "& .MuiInputBase-input": {
              padding: isMobile ? "10px 14px" : "12px 16px",
            },
            "& .MuiInputLabel-root": {
              transform: isMobile ? "translate(14px, 10px) scale(0.75)" : "translate(14px, 12px) scale(0.75)",
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
            borderRadius: 3,
            mb: isMobile ? 2 : 4,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[2],
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
              boxShadow: theme.shadows[6],
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.primary.contrastText }} />}
            sx={{
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              p: isMobile ? "10px 16px" : "14px 24px",
              minHeight: "56px !important",
              "&.Mui-expanded": { minHeight: "56px !important" },
              "& .MuiAccordionSummary-content": { margin: 0, alignItems: "center" },
            }}
          >
            <AccordionTitle title="Executive Summary" sx={{ color: theme.palette.primary.contrastText }} />
          </AccordionSummary>
          <AccordionDetails sx={{ p: isMobile ? 2 : 3, pb: isMobile ? 2.5 : 4 }}>
            <DashboardSection
              cards={executiveSummaryCards}
              droppableId="executive-summary-droppable"
              isMobile={isMobile}
              handleCardClick={handleCardClick}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={showSections.metrics}
          onChange={() => handleToggleSection("metrics")}
          sx={{
            borderRadius: 3,
            mb: isMobile ? 2 : 4,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[2],
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
              boxShadow: theme.shadows[6],
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.primary.contrastText }} />}
            sx={{
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              p: isMobile ? "10px 16px" : "14px 24px",
              minHeight: "56px !important",
              "&.Mui-expanded": { minHeight: "56px !important" },
              "& .MuiAccordionSummary-content": { margin: 0, alignItems: "center" },
            }}
          >
            <AccordionTitle title="Metrics" sx={{ color: theme.palette.primary.contrastText }} />
          </AccordionSummary>
          <AccordionDetails sx={{ p: isMobile ? 2 : 3, pb: isMobile ? 2.5 : 4 }}>
            <DashboardSection
              cards={metricsCards}
              droppableId="metrics-droppable"
              isMobile={isMobile}
              handleCardClick={handleCardClick}
            />
          </AccordionDetails>
        </Accordion>
      </DragDropContext>

      <Accordion
        expanded={showSections.charts}
        onChange={() => handleToggleSection("charts")}
        sx={{
          borderRadius: 3,
          mb: `calc(${BOTTOM_NAV_HEIGHT}px + ${theme.spacing(2)})`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[2],
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
            boxShadow: theme.shadows[6],
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.primary.contrastText }} />}
          sx={{
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            p: isMobile ? "10px 16px" : "14px 24px",
            minHeight: "56px !important",
            "&.Mui-expanded": { minHeight: "56px !important" },
            "& .MuiAccordionSummary-content": { margin: 0, alignItems: "center" },
          }}
        >
          <AccordionTitle title="Charts & Analytics" sx={{ color: theme.palette.primary.contrastText }} />
        </AccordionSummary>
        <AccordionDetails sx={{ p: isMobile ? 2 : 3, pb: isMobile ? 2.5 : 4 }}>
          <Suspense
            fallback={
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress color="primary" />
              </Box>
            }
          >
            {loansForCalculations.length > 0 ? (
              <LazyCharts loans={loansForCalculations} selectedMonth={selectedMonth} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No loan data available for charts.
              </Typography>
            )}
          </Suspense>
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
          color="secondary"
          aria-label="add loan"
          onClick={() => navigate("/add-loan")}
        >
          <AddIcon />
        </Fab>
      </Zoom>
    </Box>
  );
}
