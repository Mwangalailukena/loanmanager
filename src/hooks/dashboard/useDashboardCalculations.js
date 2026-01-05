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
            const previousMonthString = dayjs(selectedMonth).subtract(1, "month").format("YYYY-MM");
            const loansLastMonth = loansForCalculations.filter(
              (loan) => loan.startDate.startsWith(previousMonthString)
            );
    
            const initialStats = {
              totalDisbursed: 0,
              totalCollected: 0,
              actualProfit: 0,
              totalExpectedProfit: 0,
              paidLoansCount: 0,
              activeLoansCount: 0,
              overdueLoansCount: 0,
              defaultedLoansCount: 0,
              totalOutstanding: 0,
            };
    
            // Calculate current month's stats
            const monthlyStats = loansThisMonth.reduce((stats, loan) => {
              const principal = Number(loan.principal || 0);
              const repaidAmount = Number(loan.repaidAmount || 0);
              const interest = Number(loan.interest || 0);
              const status = calcStatus(loan);
    
              stats.totalDisbursed += principal;
              stats.totalCollected += repaidAmount;
              stats.totalExpectedProfit += interest;
    
              if (status === "Paid") {
                stats.paidLoansCount += 1;
                if (repaidAmount >= principal + interest) {
                  stats.actualProfit += interest;
                }
              } else if (status === "Active") {
                stats.activeLoansCount += 1;
                stats.totalOutstanding += (principal + interest - repaidAmount);
              } else if (status === "Overdue") {
                stats.overdueLoansCount += 1;
                stats.totalOutstanding += (principal + interest - repaidAmount);
              } else if (status === "Defaulted") {
                stats.defaultedLoansCount += 1;
                stats.totalOutstanding += (principal + interest - repaidAmount);
              }
              return stats;
            }, initialStats);
    
            const {
              totalDisbursed,
              totalCollected,
              actualProfit,
              totalExpectedProfit,
              paidLoansCount,
              activeLoansCount,
              overdueLoansCount,
              defaultedLoansCount,
              totalOutstanding
            } = monthlyStats;
    
            const totalLoansCount = loansThisMonth.length;
            const monthKey = selectedMonth;
            const investedCapital = Number(settings?.monthlySettings?.[monthKey]?.capital) || 0;
            const availableCapital = investedCapital - totalDisbursed + totalCollected;
            const averageLoan = totalLoansCount > 0 ? Math.round(totalDisbursed / totalLoansCount) : 0;
    
            // Calculate previous month's stats
            const initialStatsLastMonth = {
                totalDisbursed: 0,
                totalCollected: 0,
                actualProfit: 0,
                totalExpectedProfit: 0,
                paidLoansCount: 0,
                activeLoansCount: 0,
                overdueLoansCount: 0,
                defaultedLoansCount: 0,
                totalOutstanding: 0,
            };
    
            const monthlyStatsLastMonth = loansLastMonth.reduce((stats, loan) => {
                const principal = Number(loan.principal || 0);
                const repaidAmount = Number(loan.repaidAmount || 0);
                const interest = Number(loan.interest || 0);
                const status = calcStatus(loan);
    
                stats.totalDisbursed += principal;
                stats.totalCollected += repaidAmount;
                stats.totalExpectedProfit += interest;
    
                if (status === "Paid") {
                    stats.paidLoansCount += 1;
                    if (repaidAmount >= principal + interest) {
                        stats.actualProfit += interest;
                    }
                } else if (status === "Active") {
                    stats.activeLoansCount += 1;
                    stats.totalOutstanding += (principal + interest - repaidAmount);
                } else if (status === "Overdue") {
                    stats.overdueLoansCount += 1;
                    stats.totalOutstanding += (principal + interest - repaidAmount);
                } else if (status === "Defaulted") {
                    stats.defaultedLoansCount += 1;
                    stats.totalOutstanding += (principal + interest - repaidAmount);
                }
                return stats;
            }, initialStatsLastMonth);
    
            const {
                totalDisbursed: totalDisbursedLastMonth,
                totalCollected: totalCollectedLastMonth,
                actualProfit: actualProfitLastMonth,
                totalExpectedProfit: totalExpectedProfitLastMonth,
                paidLoansCount: paidLoansCountLastMonth,
                activeLoansCount: activeLoansCountLastMonth,
                overdueLoansCount: overdueLoansCountLastMonth,
                defaultedLoansCount: defaultedLoansCountLastMonth,
                totalOutstanding: totalOutstandingLastMonth,
            } = monthlyStatsLastMonth;
    
            const totalLoansCountLastMonth = loansLastMonth.length;
            const investedCapitalLastMonth = Number(settings?.monthlySettings?.[previousMonthString]?.capital) || 0;
            const availableCapitalLastMonth = investedCapitalLastMonth - totalDisbursedLastMonth + totalCollectedLastMonth;
            const averageLoanLastMonth = totalLoansCountLastMonth > 0 ? Math.round(totalDisbursedLastMonth / totalLoansCountLastMonth) : 0;
    
    
            // Calculate trends for all relevant cards
            const investedCapitalTrend = getTrendPercentage(investedCapital, investedCapitalLastMonth);
            const availableCapitalTrend = getTrendPercentage(availableCapital, availableCapitalLastMonth);
            const disbursedTrend = getTrendPercentage(totalDisbursed, totalDisbursedLastMonth);
            const collectedTrend = getTrendPercentage(totalCollected, totalCollectedLastMonth);
            const partnerDividendsTrend = getTrendPercentage(totalExpectedProfit, totalExpectedProfitLastMonth);
            const expectedProfitTrend = getTrendPercentage(totalExpectedProfit, totalExpectedProfitLastMonth);
            const actualProfitTrend = getTrendPercentage(actualProfit, actualProfitLastMonth);
            const totalLoansTrend = getTrendPercentage(totalLoansCount, totalLoansCountLastMonth);
            const paidLoansTrend = getTrendPercentage(paidLoansCount, paidLoansCountLastMonth);
            const activeLoansTrend = getTrendPercentage(activeLoansCount, activeLoansCountLastMonth);
            const overdueLoansTrend = getTrendPercentage(overdueLoansCount, overdueLoansCountLastMonth);
            const defaultedLoansTrend = getTrendPercentage(defaultedLoansCount, defaultedLoansCountLastMonth);
            const totalOutstandingTrend = getTrendPercentage(totalOutstanding, totalOutstandingLastMonth);
            const averageLoanTrend = getTrendPercentage(averageLoan, averageLoanLastMonth);
    
    
            // --- FIX: Partner Dividends is now 100% of the totalExpectedProfit
            const totalPartnerDividends = totalExpectedProfit;
    
            // --- FIX: Individual partner dividends are now also based on the new total
            const individualPartnerDividends = [
                { name: "Agnes Ilukena", amount: totalExpectedProfit / 2 },
                { name: "Jones Ilukena", amount: totalExpectedProfit / 2 },
            ];
    
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
                value: `K ${totalDisbursed.toLocaleString()}`,
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
                value: `K ${totalCollected.toLocaleString()}`,
                color: "info",
                filter: "paid",
                tooltip: "Total amount collected from repayments this month",
                progress: totalDisbursed > 0 ? totalCollected / totalDisbursed : null,
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
                          Expected Profit this month: K {totalExpectedProfit.toLocaleString()}
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
                value: `K ${totalExpectedProfit.toLocaleString()}`,
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
                value: `K ${actualProfit.toLocaleString()}`,
                color: "success",
                filter: "paid",
                tooltip: "Profit earned from fully repaid loans",
                progress: totalExpectedProfit > 0 ? actualProfit / totalExpectedProfit : null,
                icon: iconMap.actualProfit,
                trend: actualProfitTrend,
                group: "Financial Overview",
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
                trend: totalLoansTrend,
                group: "Loan Portfolio",
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
                trend: paidLoansTrend,
                group: "Loan Portfolio",
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
                trend: activeLoansTrend,
                group: "Loan Portfolio",
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
                trend: overdueLoansTrend,
                group: "Loan Portfolio",
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
                trend: defaultedLoansTrend,
                group: "Loan Portfolio",
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
    
            return { loansForCalculations, defaultCards };
          }, [loans, selectedMonth, settings, iconMap]);
    return { loansForCalculations, defaultCards };
};

