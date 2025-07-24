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
  Fab,
  Zoom,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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

const iconMap = {
  totalLoans: <MonetizationOnIcon fontSize="large" color="primary" />,
  paidLoans: <CheckCircleIcon fontSize="large" color="success" />,
  activeLoans: <PendingIcon fontSize="large" color="info" />,
  overdueLoans: <WarningIcon fontSize="large" color="error" />,
  investedCapital: <AccountBalanceWalletIcon fontSize="large" color="primary" />,
  availableCapital: <AccountBalanceWalletIcon fontSize="large" color="success" />,
  totalCollected: <PaidIcon fontSize="large" color="info" />,
  totalOutstanding: <WarningIcon fontSize="large" color="warning" />,
  expectedProfit: <BarChartIcon fontSize="large" color="info" />,
  actualProfit: <CheckCircleIcon fontSize="large" color="success" />,
  averageLoan: <MonetizationOnIcon fontSize="large" color="primary" />,
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
    if (!loans) return;
    setLoading(false);

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
  }, [loans]);

  useEffect(() => {
    const savedOrder = localStorage.getItem(STORAGE_KEY);
    if (savedOrder) {
      setCardsOrder(JSON.parse(savedOrder));
    }
  }, []);

  if (loading) {
    return (
      <Box p={2}>
        <Typography variant="h4" gutterBottom>
          Dashboard Loading...
        </Typography>
        <Stack spacing={2}>
          {[...Array(6)].map((_, i) => (
            <LinearProgress key={i} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="h5">No loans available.</Typography>
      </Box>
    );
  }

  // Filter loans by selected month
  const loansThisMonth = loans.filter((loan) =>
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

  // Cards default data with extra fields for progress bars
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
      id: "expectedProfit",
      label: "Expected Profit",
      value: `ZMW ${totalExpectedProfit.toLocaleString()}`,
      color: "info",
      filter: "all",
      tooltip: "Total expected profit from interest",
      progress: null,
      icon: iconMap.expectedProfit,
    },
    {
      id: "actualProfit",
      label: "Actual Profit",
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
        .filter(Boolean)
    : defaultCards;

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(cardsToRender);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);

    setCardsOrder(newOrder.map((c) => c.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder.map((c) => c.id)));
  };

  const handleCardClick = (filter) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (selectedMonth) params.set("month", selectedMonth);
    navigate(`/loans?${params.toString()}`);
  };

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

      {/* Cards with drag and drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="cards-droppable"
          direction={isMobile ? "vertical" : "horizontal"}
        >
          {(provided) =>
            isMobile ? (
              <Stack
                spacing={1}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {cardsToRender.map(
                  (
                    { id, label, value, color, filter, tooltip, progress, pulse, icon },
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
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps}
                          style={{
                            ...providedDraggable.draggableProps.style,
                            marginBottom: 8,
                          }}
                        >
                          <Tooltip title={tooltip} arrow>
                            <Card
                              sx={{
                                p: 1.5,
                                cursor: "grab",
                                borderLeft: `6px solid ${theme.palette[color].main}`,
                                position: "relative",
                                boxShadow: pulse
                                  ? `0 0 8px ${theme.palette.error.main}`
                                  : undefined,
                                animation: pulse ? "pulse 2s infinite" : undefined,
                                "&:hover": {
                                  boxShadow: `0 0 10px ${theme.palette[color].main}`,
                                },
                              }}
                              onClick={() => handleCardClick(filter)}
                              elevation={3}
                            >
                              <Box
                                display="flex"
                                alignItems="center"
                                mb={0.5}
                                gap={1}
                              >
                                {React.cloneElement(icon, { fontSize: "medium" })}
                                <Typography
                                  variant="subtitle2"
                                  color="textSecondary"
                                  flexGrow={1}
                                >
                                  {label}
                                </Typography>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {value}
                                </Typography>
                              </Box>
                              {progress !== null && progress !== undefined && (
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(progress * 100, 100)}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              )}
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
                {cardsToRender.map(
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
                          {...providedDraggable.dragHandleProps}
                          style={{
                            ...providedDraggable.draggableProps.style,
                          }}
                        >
                          <motion.div
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            variants={cardVariants}
                          >
                            <Tooltip title={tooltip} arrow>
                              <Card
                                sx={{
                                  p: 2,
                                  cursor: "grab",
                                  borderLeft: `6px solid ${theme.palette[color].main}`,
                                  position: "relative",
                                  boxShadow: pulse
                                    ? `0 0 12px ${theme.palette.error.main}`
                                    : undefined,
                                  animation: pulse ? "pulse 2s infinite" : undefined,
                                  "&:hover": {
                                    boxShadow: `0 0 12px ${theme.palette[color].main}`,
                                  },
                                }}
                                onClick={() => handleCardClick(filter)}
                                elevation={3}
                              >
                                <Box
                                  display="flex"
                                  alignItems="center"
                                  mb={1}
                                  gap={1}
                                >
                                  {icon}
                                  <Typography
                                    variant="subtitle1"
                                    color="textSecondary"
                                    flexGrow={1}
                                  >
                                    {label}
                                  </Typography>
                                  <Typography variant="h6" fontWeight="bold">
                                    {value}
                                  </Typography>
                                </Box>
                                {progress !== null && progress !== undefined && (
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(progress * 100, 100)}
                                    sx={{ height: 8, borderRadius: 4 }}
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
            )
          }
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
            bottom: isMobile ? 80 : 24,  // slightly above bottom nav on mobile
            right: 24,
            zIndex: 1300,
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

