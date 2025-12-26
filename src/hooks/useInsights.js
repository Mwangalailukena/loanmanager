import { useMemo } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { calcStatus } from '../utils/loanUtils';

dayjs.extend(isBetween);

export const useInsights = (loans, borrowers, payments, filterStartDate, filterEndDate) => {
  const insights = useMemo(() => {
    if (!loans || loans.length === 0) {
      return [];
    }

    const start = dayjs(filterStartDate);
    const end = dayjs(filterEndDate);

    // Filter loans, borrowers, payments based on the date range
    const relevantLoans = loans.filter(loan => {
        const loanStartDate = dayjs(loan.startDate);
        // A loan is relevant if its start date is within the filter range OR if it was active/paid within the range
        // For simplicity, we'll primarily filter by loan.startDate being within the range for initial analysis.
        // More complex logic might involve checking repayment schedules or actual payment dates.
        return loanStartDate.isBetween(start, end, 'day', '[]');
    });

    // Filter payments relevant to the loans in the date range
    const relevantPayments = payments.filter(payment => {
      const paymentDate = payment.date?.toDate ? dayjs(payment.date.toDate()) : dayjs(payment.date);
      return paymentDate.isBetween(start, end, 'day', '[]');
    });

    const activeLoans = relevantLoans.filter(loan => loan.status !== 'Defaulted' && calcStatus(loan) === 'Active').length;

    const loanDays = relevantLoans.map(loan => dayjs(loan.startDate).format('dddd'));
    const busiestDay = loanDays.reduce((acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    const topDay = Object.keys(busiestDay).reduce((a, b) => busiestDay[a] > busiestDay[b] ? a : b, 'N/A');

    const borrowerLoanCounts = relevantLoans.reduce((acc, loan) => {
      acc[loan.borrowerId] = (acc[loan.borrowerId] || 0) + 1;
      return acc;
    }, {});
    const topBorrowerId = Object.keys(borrowerLoanCounts).reduce((a, b) => borrowerLoanCounts[a] > borrowerLoanCounts[b] ? a : b, null);
    const topBorrower = borrowers.find(b => b.id === topBorrowerId);

    const insightsList = [];

    // Insight: Number of active loans
    if (activeLoans > 0) {
      insightsList.push({
        type: 'info',
        title: 'Active Loans',
        message: `You have ${activeLoans} active loans in this period.`,
      });
    }

    // Insight: Busiest day for issuing loans
    if (topDay !== 'N/A') {
      insightsList.push({
        type: 'info',
        title: 'Busiest Day',
        message: `Your busiest day for issuing loans in this period is ${topDay}.`,
      });
    }

    // Insight: Top borrower
    if (topBorrower) {
      insightsList.push({
        type: 'info',
        title: 'Top Borrower',
        message: `Your top borrower in this period is ${topBorrower.name}.`,
      });
    }

    // Insight: Average loan amount
    const totalLoanAmount = relevantLoans.reduce((acc, loan) => acc + Number(loan.principal || 0), 0);
    const averageLoanAmount = relevantLoans.length > 0 ? totalLoanAmount / relevantLoans.length : 0;

    if (averageLoanAmount > 0) {
      insightsList.push({
        type: 'info',
        title: 'Average Loan Amount',
        message: `Your average loan amount in this period is ZMW ${averageLoanAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
      });
    }

    // Insight: Average loan duration
    const paidLoans = relevantLoans.filter(loan => calcStatus(loan) === 'Paid');
    if (paidLoans.length > 0 && relevantPayments) {
        const durations = paidLoans.map(loan => {
            const loanPayments = relevantPayments.filter(p => p.loanId === loan.id);
            if (loanPayments.length === 0) return null;
            
            const lastPaymentDate = loanPayments.reduce((latest, p) => {
                const pDate = p.date && typeof p.date.toDate === 'function' ? dayjs(p.date.toDate()) : dayjs(p.date);
                return pDate.isAfter(latest) ? pDate : latest;
            }, dayjs(loan.startDate));

            const startDate = dayjs(loan.startDate);
            return lastPaymentDate.diff(startDate, 'day');
        }).filter(d => d !== null);

        if (durations.length > 0) {
            const totalDuration = durations.reduce((acc, d) => acc + d, 0);
            const averageDuration = totalDuration / durations.length;

            insightsList.push({
                type: 'info',
                title: 'Average Repayment Time',
                message: `The average time to repay a loan in this period is ${Math.round(averageDuration)} days.`,
            });
        }
    }

    // Insight: Overdue loans (actionable) - considering loans *relevant* to the period and their current overdue status
    const overdueLoans = relevantLoans.filter(loan => {
      if (loan.status === 'Defaulted' || loan.status === 'Paid') return false; // Exclude defaulted and paid loans
      const totalRepayable = Number(loan.totalRepayable || 0);
      const repaidAmount = Number(loan.repaidAmount || 0);
      const dueDate = dayjs(loan.dueDate);
      const now = dayjs(); // Use current date for "overdue" status
      return (repaidAmount < totalRepayable || totalRepayable === 0) && dueDate.isBefore(now, 'day');
    });

    if (overdueLoans.length > 0) {
      insightsList.push({
        type: 'warning',
        title: 'Overdue Loans',
        message: `${overdueLoans.length} loan(s) are overdue in this period.`,
        action: {
          label: 'View Overdue Loans',
          onClick: () => { /* This will be handled in the Dashboard component */ },
        },
      });
    }

    // Insight: Loans due this week (actionable) - considering loans *relevant* to the period
    const dueThisWeek = relevantLoans.filter(loan => {
      const totalRepayable = Number(loan.totalRepayable || 0);
      const repaidAmount = Number(loan.repaidAmount || 0);
      const dueDate = dayjs(loan.dueDate);
      const now = dayjs(); // Use current date for "due this week" status
      return (repaidAmount < totalRepayable || totalRepayable === 0) && dueDate.isAfter(now, 'day') && dueDate.isBefore(now.add(7, 'day'), 'day');
    });

    if (dueThisWeek.length > 0) {
      insightsList.push({
        type: 'info',
        title: 'Loans Due This Week',
        message: `${dueThisWeek.length} loan(s) due this week in this period.`,
        action: {
          label: 'View Upcoming Loans',
          onClick: () => { /* This will be handled in the Dashboard component */ },
        },
      });
    }

    return insightsList;
  }, [loans, borrowers, payments, filterStartDate, filterEndDate]); // Added filterStartDate, filterEndDate

  return insights;
};
