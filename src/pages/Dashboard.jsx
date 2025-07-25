// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  TextField,
  Tooltip,
  LinearProgress,
  Skeleton,
} from "@mui/material";
import PaidIcon from "@mui/icons-material/Payments";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import WarningIcon from "@mui/icons-material/Warning";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BarChartIcon from "@mui/icons-material/BarChart";
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

const DEFAULT_CARD_IDS = [
  "totalLoans",
  "paidLoans",
  "activeLoans",
  "overdueLoans",
  "investedCapital",
  "disbursedCapital",
  "availableCapital",
  "totalCollected",
  "totalOutstanding",
  "expectedInterest",
  "actualInterest",
  "averageLoan",
];

const iconMap = {
  totalLoans: <MonetizationOnIcon fontSize="large" color="primary" />,
  paidLoans: <CheckCircleIcon fontSize="large" color="success" />,
  activeLoans: <PendingIcon fontSize="large" color="info" />,
  overdueLoans: <WarningIcon fontSize="large" color="error" />,
  investedCapital: <AccountBalanceWalletIcon fontSize="large" color="primary" />,
  disbursedCapital: <MonetizationOnIcon fontSize="large" color="warning" />,
  availableCapital: <AccountBalanceWalletIcon fontSize="large" color="success" />,
  totalCollected: <PaidIcon fontSize="large" color="info" />,
  totalOutstanding: <WarningIcon fontSize="large" color="warning" />,
  expectedInterest: <BarChartIcon fontSize="large" color="info" />,
  actualInterest: <CheckCircleIcon fontSize="large" color="success" />,
  averageLoan: <MonetizationOnIcon fontSize="large" color="primary" />,
};

const CARD_GROUPS = [
  {
    id: "capitalFlow",
    label: "💰 Capital Flow",
    cardIds: ["investedCapital", "disbursedCapital", "availableCapital"],
  },
  {
    id: "repayments",
    label: "📈 Repayments",
    cardIds: [
      "totalCollected",
      "totalOutstanding",
      "expectedInterest",
      "actualInterest",
    ],
  },
  {
    id: "loanStatus",
    label: "📊 Loan Status",
    cardIds: ["totalLoans", "paidLoans", "activeLoans", "overdueLoans"],
  },
  {
    id: "metricsCharts",
    label: "📐 Metrics and Charts",
    cardIds: ["averageLoan"],
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { loans, settings } = useFirestore();

  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [cardsOrder, setCardsOrder] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load order and trigger loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loans) setLoading(false);
    }, 500);

    if (loans) {
      const savedOrder = localStorage.getItem(STORAGE_KEY);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        // Filter to valid cards only
        const validOrder = parsedOrder.filter((id) =>
          DEFAULT_CARD_IDS.includes(id)
        );
        // Ensure all cards present, add missing at end
        const finalOrder = [...new Set([...validOrder, ...DEFAULT_CARD_IDS])];
        setCardsOrder(finalOrder);
      } else {
        setCardsOrder(DEFAULT_CARD_IDS);
      }

      // Notify about upcoming and overdue loans
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
        toast.error(
          `You have ${overdueLoansList.length} overdue loan(s)! Please take action.`
        );
      }
    }
    return () => clearTimeout(timer);
  }, [loans]);

  // Filter loans for selected month
  const loansThisMonth = (loans || []).filter((loan) =>
    loan.startDate.startsWith(selectedMonth)
  );

  // Calculations for cards
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

  const totalExpectedInterest = loansThisMonth.reduce(
    (sum, loan) => sum + Number(loan.interest || 0),
    0
  );

  const actualInterest = loansThisMonth
    .filter(
      (loan) =>
        loan.status === "Paid" &&
        Number(loan.repaidAmount || 0) >=
          Number(loan.principal || 0) + Number(loan.interest || 0)
    )
    .reduce((sum, loan) => sum + Number(loan.interest || 0), 0);

  const averageLoan =
    loansThisMonth.length > 0 ? Math.round(totalDisbursed / loansThisMonth.length) : 0;

  // Define all cards with their data
  const defaultCards = [
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
      id: "disbursedCapital",
      label: "Disbursed Capital",
      value: `ZMW ${totalDisbursed.toLocaleString()}`,
      color: "warning",
      filter: "all",
      tooltip: "Total principal amount disbursed this month",
      progress: initialCapital > 0 ? totalDisbursed / initialCapital : null,
      icon: iconMap.disbursedCapital,
    },
    {
      id: "availableCapital",
      label: "Available Capital",
      value: `ZMW ${availableCapital.toLocaleString()}`,
      color: "success",
      filter: "all",
      tooltip: "Capital currently available to issue new loans",
      progress: initialCapital > 0 ? availableCapital / initialCapital : null,
      icon: iconMap.availableCapital,
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
      id: "expectedInterest",
      label: "Expected Interest",
      value: `ZMW ${totalExpectedInterest.toLocaleString()}`,
      color: "info",
      filter: "all",
      tooltip: "Total expected interest from all loans",
      progress: null,
      icon: iconMap.expectedInterest,
    },
    {
      id: "actualInterest",
      label: "Actual Interest",
      value: `ZMW ${actualInterest.toLocaleString()}`,
      color: "success",
      filter: "paid",
      tooltip: "Interest earned from fully repaid loans",
      progress:
        totalExpectedInterest > 0 ? actualInterest / totalExpectedInterest : null,
      icon: iconMap.actualInterest,
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

  // Use cardsOrder from localStorage or default order
  const cardsToRender = cardsOrder.length
    ? cardsOrder
        .map((id) => defaultCards.find((c) => c.id === id))
        .filter(Boolean)
    : defaultCards;

  // Get cards belonging to a group in order
  const getCardsForGroup = (group) =>
    cardsToRender.filter((card) => group.cardIds.includes(card.id));

  // Handle drag end only reorder cards inside the group
  const onDragEndGroup = (groupId) => (result) => {
    if (!result.destination) return;

    const group = CARD_GROUPS.find((g) => g.id === groupId);
    if (!group) return;

    const groupCards = getCardsForGroup(group);

    const newGroupCards = Array.from(groupCards);
    const [moved] = newGroupCards.splice(result.source.index, 1);
    newGroupCards.splice(result.destination.index, 0, moved);

    const newCardsOrder = [...cardsOrder];

    // Remove group's cards from current order
    group.cardIds.forEach((id) => {
      const idx = newCardsOrder.indexOf(id);
      if (idx !== -1) newCardsOrder.splice(idx, 1);
    });

    // Insert reordered group cards back at the original group's start position
    const firstIndex = cardsOrder.findIndex((id) => group.cardIds.includes(id));
    newCardsOrder.splice(firstIndex, 0, ...newGroupCards.map((c) => c.id));

    setCardsOrder(newCardsOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCardsOrder));
    toast.success("Dashboard layout saved!");
  };

  // Navigate to loans page with filter
  const handleCardClick = (filter) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (selectedMonth) params.set("month", selectedMonth);
    navigate(`/loans?${params.toString()}`);
  };

  // Show skeleton loader while loading
  if (loading) {
    return (
      <Box p={isMobile ? 1 : 2}>
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
          Dashboard
        </Typography>
        <Grid container spacing={isMobile ? 1 : 2}>
          {[...Array(isMobile ? 6 : 10)].map((_, i) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
              <Card sx={{ p: isMobile ? 1.5 : 2, height: isMobile ? 90 : 120 }}>
                <Skeleton variant="text" width="70%" height={isMobile ? 20 : 25} />
                <Skeleton variant="text" width="90%" height={isMobile ? 30 : 40} />
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={isMobile ? 6 : 8}
                  sx={{ mt: 1 }}
                />
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Show no loans message if none
  if (!loans || loans.length === 0) {
    return (
      <Box
        p={isMobile ? 1 : 2}
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
      </Box>
    );
  }

  // Render cards grouped with drag & drop inside each group
  return (
    <Box p={isMobile ? 1 : 2}>
      <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
        Dashboard
      </Typography>

      {/* Month picker */}
      <Box mb={isMobile ? 2 : 3} maxWidth={isMobile ? "100%" : 180}>
        <TextField
          label="Filter by Month"
          type="month"
          size="small"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          fullWidth
        />
      </Box>

      {/* Render each group */}
      {CARD_GROUPS.map(({ id: groupId, label, cardIds }) => {
        const groupCards = getCardsForGroup({ cardIds });
        if (!groupCards.length) return null;

        return (
          <Box key={groupId} mb={4}>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              mb={isMobile ? 1 : 2}
              sx={{ fontWeight: "bold" }}
            >
              {label}
            </Typography>

            <DragDropContext onDragEnd={onDragEndGroup(groupId)}>
              <Droppable
                droppableId={`droppable-${groupId}`}
                direction={isMobile ? "vertical" : "horizontal"}
              >
                {(provided) =>
                  isMobile ? (
                    <Stack
                      spacing={1}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {groupCards.map(
                        (
                          {
                            id,
                            label,
                            value,
                            color,
                            filter,
                            tooltip,
                            progress,
                            pulse,
                            icon,
                          },
                          index
                        ) => (
                          <Draggable key={id} draggableId={id} index={index}>
                            {(providedDraggable) => (
                              <motion.div
                                key={id}
                                custom={index}
                                initial="hidden"
                                animate="visible"
                                variants={cardVariants}
                                ref={providedDraggable.innerRef}
                                {...providedDraggable.dragHandleProps}>
                                <Tooltip title={tooltip || ""} arrow>
                                  <Card
                                    onClick={() => handleCardClick(filter)}
                                    sx={{
                                      cursor: "pointer",
                                      p: 2,
                                      display: "flex",
                                      alignItems: "center",
                                      backgroundColor: theme.palette.background.paper,
                                      boxShadow: pulse
                                        ? `0 0 10px 2px ${theme.palette.error.main}`
                                        : "none",
                                      borderRadius: 2,
                                      userSelect: "none",
                                    }}
                                    elevation={3}
                                  >
                                    <Box mr={2} color={color}>
                                      {icon}
                                    </Box>
                                    <Box flexGrow={1}>
                                      <Typography
                                        variant={isMobile ? "body1" : "h6"}
                                        fontWeight="bold"
                                        noWrap
                                      >
                                        {label}
                                      </Typography>
                                      <Typography
                                        variant={isMobile ? "h6" : "h4"}
                                        color={theme.palette.text.primary}
                                        fontWeight="bold"
                                      >
                                        {value}
                                      </Typography>
                                      {progress !== null && progress !== undefined && (
                                        <LinearProgress
                                          variant="determinate"
                                          value={Math.min(progress * 100, 100)}
                                          sx={{ height: 8, borderRadius: 4, mt: 1 }}
                                          color={color}
                                        />
                                      )}
                                    </Box>
                                  </Card>
                                </Tooltip>
                              </motion.div>
                            )}
                          </Draggable>
                        )
                      )}
                      {provided.placeholder}
                    </Stack>
                  ) : (
                    <Grid
                      container
                      spacing={2}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {groupCards.map(
                        (
                          {
                            id,
                            label,
                            value,
                            color,
                            filter,
                            tooltip,
                            progress,
                            pulse,
                            icon,
                          },
                          index
                        ) => (
                          <Draggable key={id} draggableId={id} index={index}>
                            {(providedDraggable) => (
                              <Grid
                                item
                                xs={6}
                                sm={3}
                                md={2}
                                ref={providedDraggable.innerRef}
                                {...providedDraggable.draggableProps}
                                {...providedDraggable.dragHandleProps}
                              >
                                <motion.div
                                  custom={index}
                                  initial="hidden"
                                  animate="visible"
                                  variants={cardVariants}
                                >
                                  <Tooltip title={tooltip || ""} arrow>
                                    <Card
                                      onClick={() => handleCardClick(filter)}
                                      sx={{
                                        cursor: "pointer",
                                        p: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        backgroundColor: theme.palette.background.paper,
                                        boxShadow: pulse
                                          ? `0 0 15px 3px ${theme.palette.error.main}`
                                          : "none",
                                        borderRadius: 2,
                                        userSelect: "none",
                                        height: "100%",
                                      }}
                                      elevation={3}
                                    >
                                      <Box mr={2} color={color}>
                                        {icon}
                                      </Box>
                                      <Box>
                                        <Typography
                                          variant="h6"
                                          fontWeight="bold"
                                          noWrap
                                        >
                                          {label}
                                        </Typography>
                                        <Typography
                                          variant="h4"
                                          color={theme.palette.text.primary}
                                          fontWeight="bold"
                                        >
                                          {value}
                                        </Typography>
                                        {progress !== null && progress !== undefined && (
                                          <LinearProgress
                                            variant="determinate"
                                            value={Math.min(progress * 100, 100)}
                                            sx={{ height: 8, borderRadius: 4, mt: 1 }}
                                            color={color}
                                          />
                                        )}
                                      </Box>
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
                  )
                }
              </Droppable>
            </DragDropContext>
          </Box>
        );
      })}
    </Box>
  );
}