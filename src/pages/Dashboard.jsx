// src/pages/Dashboard.jsx
import React, { useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useFirestore } from "../contexts/FirestoreProvider";
import { toast } from "react-toastify";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { loans, settings } = useFirestore();

  useEffect(() => {
    if (!loans || loans.length === 0) return;

    const now = new Date();
    const upcomingThreshold = new Date(now);
    upcomingThreshold.setDate(now.getDate() + 3); // 3 days ahead

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

  if (!loans || loans.length === 0) {
    return (
      <Box p={2}>
        <Typography variant="h5">No loans available.</Typography>
      </Box>
    );
  }

  // Fallback initialCapital to 60000 if not set in settings
  const initialCapital = settings?.initialCapital ?? 60000;

  // Calculate totals
  const investedCapital = loans.reduce((sum, loan) => sum + Number(loan.principal || 0), 0);
  const totalExpectedProfit = loans.reduce((sum, loan) => sum + Number(loan.interest || 0), 0);
  const totalCollected = loans.reduce((sum, loan) => sum + Number(loan.repaidAmount || 0), 0);
  const totalOutstanding = investedCapital - totalCollected;
  const totalDisbursed = investedCapital;
  const availableCapital = initialCapital - totalDisbursed;
  const overdueLoans = loans.filter((loan) => loan.status === "Active" && new Date(loan.dueDate) < new Date()).length;
  const activeLoans = loans.filter((loan) => loan.status === "Active").length;
  const actualProfit = totalCollected - investedCapital;
  const averageLoan = loans.length > 0 ? Math.round(investedCapital / loans.length) : 0;

  const cardsData = [
    { label: "Invested Capital", value: `ZMW ${investedCapital.toLocaleString()}`, color: "primary" },
    { label: "Available Capital", value: `ZMW ${availableCapital.toLocaleString()}`, color: "success" },
    { label: "Total Collected", value: `ZMW ${totalCollected.toLocaleString()}`, color: "info" },
    { label: "Total Outstanding", value: `ZMW ${totalOutstanding.toLocaleString()}`, color: "warning" },
    { label: "Total Disbursed", value: `ZMW ${totalDisbursed.toLocaleString()}`, color: "secondary" },
    { label: "Overdue Loans", value: `${overdueLoans}`, color: "error" },
    { label: "Active Loans", value: `${activeLoans}`, color: "success" },
    { label: "Actual Profit", value: `ZMW ${actualProfit.toLocaleString()}`, color: "success" },
    { label: "Expected Profit", value: `ZMW ${totalExpectedProfit.toLocaleString()}`, color: "info" },
    { label: "Average Loan", value: `ZMW ${averageLoan.toLocaleString()}`, color: "primary" },
  ];

  const handleCardClick = (label) => {
    switch (label) {
      case "Total Collected":
        navigate("/activity");
        break;
      case "Total Outstanding":
        navigate("/loans?filter=outstanding");
        break;
      case "Total Disbursed":
        navigate("/loans");
        break;
      case "Overdue Loans":
        navigate("/loans?filter=overdue");
        break;
      case "Active Loans":
        navigate("/loans?filter=active");
        break;
      default:
        break;
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      {isMobile ? (
        <Stack spacing={2}>
          {cardsData.map(({ label, value, color }, i) => (
            <motion.div
              key={label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Card
                sx={{
                  p: 2,
                  cursor: "pointer",
                  borderLeft: `6px solid ${theme.palette[color].main}`,
                }}
                onClick={() => handleCardClick(label)}
                elevation={3}
              >
                <Typography variant="subtitle1" color="textSecondary">
                  {label}
                </Typography>
                <Typography variant="h6">{value}</Typography>
              </Card>
            </motion.div>
          ))}
        </Stack>
      ) : (
        <Grid container spacing={3}>
          {cardsData.map(({ label, value, color }, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={label}>
              <motion.div
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    borderLeft: `6px solid ${theme.palette[color].main}`,
                  }}
                  onClick={() => handleCardClick(label)}
                  elevation={3}
                >
                  <Typography variant="subtitle1" color="textSecondary">
                    {label}
                  </Typography>
                  <Typography variant="h5">{value}</Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

