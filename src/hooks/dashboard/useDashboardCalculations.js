import { useMemo, useState, useEffect } from "react";
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

import { calcStatus } from "../../utils/loanUtils";
  
  const getTrendPercentage = (current, previous) => {
    if (previous === 0) {
      return current > 0 ? { direction: 'up', value: 'New' } : null;
    }
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 0.1) return null;
    return {
      direction: change >= 0 ? 'up' : 'down',
      value: `${Math.abs(change).toFixed(1)}%`,
    };
  };

  const initialStats = () => ({
    totalDisbursed: 0,
    totalCollected: 0,
    actualProfit: 0,
    totalExpectedProfit: 0,
    paidLoansCount: 0,
    activeLoansCount: 0,
    overdueLoansCount: 0,
    defaultedLoansCount: 0,
    totalOutstanding: 0,
    totalLoansCount: 0,
  });

  const generateCards = (currentStats, lastMonthStats, settings, currentMonthStr, previousMonthStr, iconMap) => {
      const investedCapital = Number(settings?.monthlySettings?.[currentMonthStr]?.capital) || 0;
      const availableCapital = investedCapital - currentStats.totalDisbursed + currentStats.totalCollected;
      const averageLoan = currentStats.totalLoansCount > 0 ? Math.round(currentStats.totalDisbursed / currentStats.totalLoansCount) : 0;

      const investedCapitalLastMonth = Number(settings?.monthlySettings?.[previousMonthStr]?.capital) || 0;
      const availableCapitalLastMonth = investedCapitalLastMonth - lastMonthStats.totalDisbursed + lastMonthStats.totalCollected;
      const averageLoanLastMonth = lastMonthStats.totalLoansCount > 0 ? Math.round(lastMonthStats.totalDisbursed / lastMonthStats.totalLoansCount) : 0;

      // Calculate trends
      const investedCapitalTrend = getTrendPercentage(investedCapital, investedCapitalLastMonth);
      const availableCapitalTrend = getTrendPercentage(availableCapital, availableCapitalLastMonth);
      const disbursedTrend = getTrendPercentage(currentStats.totalDisbursed, lastMonthStats.totalDisbursed);
      const collectedTrend = getTrendPercentage(currentStats.totalCollected, lastMonthStats.totalCollected);
      const partnerDividendsTrend = getTrendPercentage(currentStats.totalExpectedProfit, lastMonthStats.totalExpectedProfit);
      const expectedProfitTrend = getTrendPercentage(currentStats.totalExpectedProfit, lastMonthStats.totalExpectedProfit);
      const actualProfitTrend = getTrendPercentage(currentStats.actualProfit, lastMonthStats.actualProfit);
      const totalLoansTrend = getTrendPercentage(currentStats.totalLoansCount, lastMonthStats.totalLoansCount);
      const paidLoansTrend = getTrendPercentage(currentStats.paidLoansCount, lastMonthStats.paidLoansCount);
      const activeLoansTrend = getTrendPercentage(currentStats.activeLoansCount, lastMonthStats.activeLoansCount);
      const overdueLoansTrend = getTrendPercentage(currentStats.overdueLoansCount, lastMonthStats.overdueLoansCount);
      const defaultedLoansTrend = getTrendPercentage(currentStats.defaultedLoansCount, lastMonthStats.defaultedLoansCount);
      const totalOutstandingTrend = getTrendPercentage(currentStats.totalOutstanding, lastMonthStats.totalOutstanding);
      const averageLoanTrend = getTrendPercentage(averageLoan, averageLoanLastMonth);

      const totalPartnerDividends = currentStats.totalExpectedProfit;

      const individualPartnerDividends = [
          { name: "Agnes Ilukena", amount: totalPartnerDividends / 2 },
          { name: "Jones Ilukena", amount: totalPartnerDividends / 2 },
      ];

      const rolloverAmount = availableCapital - totalPartnerDividends;

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
          trend: investedCapitalTrend,
          group: "Financial Overview",
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
          trend: availableCapitalTrend,
          group: "Financial Overview",
        },
        {
          id: "totalDisbursed",
          label: "Total Disbursed",
          value: `K ${currentStats.totalDisbursed.toLocaleString()}`,
          color: "primary",
          filter: "all",
          tooltip: "Total principal amount disbursed this month",
          progress: null,
          icon: iconMap.totalDisbursed,
          trend: disbursedTrend,
          group: "Financial Overview",
        },
        {
          id: "totalCollected",
          label: "Total Collected",
          value: `K ${currentStats.totalCollected.toLocaleString()}`,
          color: "info",
          filter: "paid",
          tooltip: "Total amount collected from repayments this month",
          progress: currentStats.totalDisbursed > 0 ? currentStats.totalCollected / currentStats.totalDisbursed : null,
          icon: iconMap.totalCollected,
          trend: collectedTrend,
          group: "Financial Overview",
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
                    Total Dividends (100% of Expected Profit)
                </Typography>
                <Typography variant="caption" display="block" mb={1}>
                    Expected Profit this month: K {currentStats.totalExpectedProfit.toLocaleString()}
                </Typography>
                {individualPartnerDividends.map((p) => (
                    <Typography key={p.name} variant="caption" display="block">
                        {`${p.name}: K ${p.amount.toLocaleString()}`}
                    </Typography>
                ))}
            </Box>
          ),
          progress: null,
          icon: iconMap.partnerDividends,
          trend: partnerDividendsTrend,
          group: "Financial Overview",
        },
        {
          id: "expectedProfit",
          label: "Interest Expected",
          value: `K ${currentStats.totalExpectedProfit.toLocaleString()}`,
          color: "secondary",
          filter: "all",
          tooltip: "Total expected profit from interest",
          progress: null,
          icon: iconMap.expectedProfit,
          trend: expectedProfitTrend,
          group: "Financial Overview",
        },
        {
          id: "actualProfit",
          label: "Actual Interest",
          value: `K ${currentStats.actualProfit.toLocaleString()}`,
          color: "success",
          filter: "paid",
          tooltip: "Profit earned from fully repaid loans",
          progress: currentStats.totalExpectedProfit > 0 ? currentStats.actualProfit / currentStats.totalExpectedProfit : null,
          icon: iconMap.actualProfit,
          trend: actualProfitTrend,
          group: "Financial Overview",
        },
        {
          id: "totalLoans",
          label: "Total Loans",
          value: currentStats.totalLoansCount,
          color: "primary",
          filter: "all",
          tooltip: "Total number of loans issued this month",
          progress: null,
          icon: iconMap.totalLoans,
          trend: totalLoansTrend,
          group: "Loan Portfolio",
        },
        {
          id: "paidLoans",
          label: "Paid Loans",
          value: currentStats.paidLoansCount,
          color: "success",
          filter: "paid",
          tooltip: "Loans fully paid back this month",
          progress: currentStats.totalLoansCount ? currentStats.paidLoansCount / currentStats.totalLoansCount : 0,
          icon: iconMap.paidLoans,
          trend: paidLoansTrend,
          group: "Loan Portfolio",
        },
        {
          id: "activeLoans",
          label: "Active Loans",
          value: currentStats.activeLoansCount,
          color: "info",
          filter: "active",
          tooltip: "Loans currently active and being repaid",
          progress: currentStats.totalLoansCount ? currentStats.activeLoansCount / currentStats.totalLoansCount : 0,
          icon: iconMap.activeLoans,
          trend: activeLoansTrend,
          group: "Loan Portfolio",
        },
        {
          id: "overdueLoans",
          label: "Overdue Loans",
          value: currentStats.overdueLoansCount,
          color: "error",
          filter: "overdue",
          tooltip: "Loans overdue for repayment",
          progress: currentStats.totalLoansCount ? currentStats.overdueLoansCount / currentStats.totalLoansCount : 0,
          icon: iconMap.overdueLoans(currentStats.overdueLoansCount),
          pulse: currentStats.overdueLoansCount > 0,
          trend: overdueLoansTrend,
          group: "Loan Portfolio",
        },
        {
          id: "defaultedLoans",
          label: "Defaulted Loans",
          value: currentStats.defaultedLoansCount,
          color: "warning",
          filter: "defaulted",
          tooltip: "Loans marked as defaulted",
          progress: currentStats.totalLoansCount ? currentStats.defaultedLoansCount / currentStats.totalLoansCount : 0,
          icon: iconMap.defaultedLoans,
          pulse: currentStats.defaultedLoansCount > 0,
          trend: defaultedLoansTrend,
          group: "Loan Portfolio",
        },
        {
          id: "totalOutstanding",
          label: "Total Outstanding",
          value: `K ${currentStats.totalOutstanding.toLocaleString()}`,
          color: "warning",
          filter: "active",
          tooltip: "Total outstanding repayments still due",
          progress: null,
          icon: iconMap.totalOutstanding,
          trend: totalOutstandingTrend,
          group: "Loan Portfolio",
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
          trend: averageLoanTrend,
          group: "Loan Portfolio",
        },
      ];
      
      return { defaultCards, rolloverAmount };
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

    // Initialize state with zeroed stats for immediate render
    const [calculationResult, setCalculationResult] = useState(() => {
        const currentStats = initialStats();
        const lastMonthStats = initialStats();
        const currentMonthStr = selectedMonth;
        const previousMonthStr = dayjs(selectedMonth).subtract(1, "month").format("YYYY-MM");
        
        const { defaultCards, rolloverAmount } = generateCards(
            currentStats, 
            lastMonthStats, 
            settings, 
            currentMonthStr, 
            previousMonthStr, 
            iconMap
        );

        return {
            loansForCalculations: [],
            defaultCards,
            rolloverAmount,
            hasUnsettledLoans: false
        };
    });

    useEffect(() => {
        const loansForCalculations = loans || [];
        const currentMonthStr = selectedMonth;
        const previousMonthStr = dayjs(selectedMonth).subtract(1, "month").format("YYYY-MM");

        const currentStats = initialStats();
        const lastMonthStats = initialStats();
        let hasUnsettledLoans = false;

        loansForCalculations.forEach((loan) => {
            const principal = Number(loan.principal || 0);
            const repaidAmount = Number(loan.repaidAmount || 0);
            const interest = Number(loan.interest || 0);
            const status = calcStatus(loan);
            const isCurrentMonth = loan.startDate.startsWith(currentMonthStr);
            const isLastMonth = loan.startDate.startsWith(previousMonthStr);

            if (isCurrentMonth || isLastMonth) {
                const stats = isCurrentMonth ? currentStats : lastMonthStats;
            
                stats.totalLoansCount += 1;
                stats.totalDisbursed += principal;
                stats.totalCollected += repaidAmount;
                stats.totalExpectedProfit += interest;
    
                if (status === "Paid") {
                    stats.paidLoansCount += 1;
                    if (repaidAmount >= principal + interest) {
                    stats.actualProfit += interest;
                    }
                } else {
                    if (status === "Active") stats.activeLoansCount += 1;
                    else if (status === "Overdue") stats.overdueLoansCount += 1;
                    else if (status === "Defaulted") stats.defaultedLoansCount += 1;
                    
                    stats.totalOutstanding += (principal + interest - repaidAmount);
                    
                    if (isCurrentMonth && status !== "Defaulted") {
                    hasUnsettledLoans = true;
                    }
                }
            }
        });

        const { defaultCards, rolloverAmount } = generateCards(
            currentStats, 
            lastMonthStats, 
            settings, 
            currentMonthStr, 
            previousMonthStr, 
            iconMap
        );

        setCalculationResult({
            loansForCalculations,
            defaultCards,
            rolloverAmount,
            hasUnsettledLoans
        });

    }, [loans, selectedMonth, settings, iconMap]);

    return calculationResult;
};

