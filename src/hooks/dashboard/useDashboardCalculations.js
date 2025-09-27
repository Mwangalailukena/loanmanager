import { useMemo } from "react";
import dayjs from "dayjs";
import {
    Box,
    Typography,
    Badge
  } from "@mui/material";
  import CheckCircleIcon from "@mui/icons-material/CheckCircle";
  import PendingIcon from "@mui/icons-material/Pending";
  import WarningIcon from "@mui/icons-material/Warning";
  import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
  import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
  import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
  import BarChartIcon from "@mui/icons-material/BarChart";
  import PaidIcon from "@mui/icons-material/Payments";

const calcStatus = (loan) => {
    if (loan.status === "Defaulted") return "Defaulted";
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
  
  const getTrendPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? "New" : null;
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

export const useDashboardCalculations = (loans, selectedMonth, settings, isMobile) => {
    const iconMap = useMemo(() => {
        const iconSize = { fontSize: isMobile ? 20 : 24 }; // MODIFIED: Reduced mobile icon size to 20
        return {
          totalLoans: <MonetizationOnIcon sx={iconSize} />,
          paidLoans: <CheckCircleIcon sx={iconSize} />,
          activeLoans: <PendingIcon sx={iconSize} />,
          defaultedLoans: <WarningIcon sx={iconSize} />,
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
          partnerDividends: <AccountBalanceIcon sx={iconSize} />,
        };
      }, [isMobile]);

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
        
        const actualProfit = loansThisMonth
            .filter(
                (loan) =>
                calcStatus(loan) === "Paid" &&
                Number(loan.repaidAmount || 0) >=
                    Number(loan.principal || 0) + Number(loan.interest || 0)
            )
            .reduce((sum, loan) => sum + Number(loan.interest || 0), 0);

        const totalExpectedProfit = loansThisMonth.reduce(
          (sum, loan) => sum + Number(loan.interest || 0),
          0
        );
        
        // --- FIX: Partner Dividends is now 100% of the totalExpectedProfit
        const totalPartnerDividends = totalExpectedProfit;

        // --- FIX: Individual partner dividends are now also based on the new total
        const individualPartnerDividends = [
            { name: "Agnes Ilukena", amount: totalExpectedProfit / 2 },
            { name: "Jones Ilukena", amount: totalExpectedProfit / 2 },
        ];

        const monthKey = dayjs(selectedMonth).format("YYYY-MM");
        const investedCapital = Number(settings?.monthlySettings?.[monthKey]?.capital) || 0;
        const availableCapital = investedCapital - totalDisbursed + totalCollected;
        const totalLoansCount = loansThisMonth.length;
        const paidLoansCount = loansThisMonth.filter((l) => calcStatus(l) === "Paid").length;
        const activeLoansCount = loansThisMonth.filter((l) => calcStatus(l) === "Active").length;
        const overdueLoansCount = loansThisMonth.filter((l) => calcStatus(l) === "Overdue").length;
        const defaultedLoansCount = loansThisMonth.filter((l) => calcStatus(l) === "Defaulted").length;

        const totalOutstanding = loansThisMonth
          .filter((loan) => calcStatus(loan) === "Active" || calcStatus(loan) === "Overdue" || calcStatus(loan) === "Defaulted")
          .reduce(
            (sum, loan) =>
              sum +
              (Number(loan.principal || 0) +
                Number(loan.interest || 0) -
                Number(loan.repaidAmount || 0)),
            0
          );
        
        const averageLoan = totalLoansCount > 0 ? Math.round(totalDisbursed / totalLoansCount) : 0;

        const disbursedTrend = getTrendPercentage(totalDisbursed, totalDisbursedLastMonth);
        const collectedTrend = getTrendPercentage(totalCollected, totalCollectedLastMonth);

        const defaultCards = [
          {
            id: "investedCapital",
            label: "Invested Capital",
            value: `K ${investedCapital.toLocaleString()}`,
            color: "primary",
            filter: "all",
            tooltip: "Invested capital for the selected month",
            progress: null,
            icon: iconMap.investedCapital,
          },
          {
            id: "availableCapital",
            label: "Available Capital",
            value: `K ${availableCapital.toLocaleString()}`,
            color: "success",
            filter: "all",
            tooltip: "Capital currently available to issue new loans. Progress against invested capital for the month.",
            progress: investedCapital > 0 ? availableCapital / investedCapital : 0,
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
            id: "partnerDividends",
            label: "Partner Dividends",
            value: `K ${totalPartnerDividends.toLocaleString()}`,
            color: "secondary",
            filter: "paid",
            tooltip: (
              <Box>
                  <Typography variant="body2" fontWeight="bold">
                      {/* FIX: Updated tooltip to reflect new calculation */}
                      Total Dividends (100% of Expected Profit)
                  </Typography>
                  <Typography variant="caption" display="block" mb={1}>
                      Expected Profit this month: K {totalExpectedProfit.toLocaleString()}
                  </Typography>
                  {individualPartnerDividends.map((p) => (
                      <Typography key={p.name} variant="caption" display="block">
                          {`${p.name}: K ${p.amount.toLocaleString()}`}
                      </Typography>
                  ))}
              </Box>
            ),
            // --- FIX: Removed the progress bar
            progress: null,
            icon: iconMap.partnerDividends,
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
            id: "defaultedLoans",
            label: "Defaulted Loans",
            value: defaultedLoansCount,
            color: "warning",
            filter: "defaulted",
            tooltip: "Loans marked as defaulted",
            progress: totalLoansCount ? defaultedLoansCount / totalLoansCount : 0,
            icon: iconMap.defaultedLoans,
            pulse: defaultedLoansCount > 0,
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
            color: "secondary",
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

    return { loansForCalculations, defaultCards };
};

