import { useMemo } from 'react';
import dayjs from 'dayjs';

export const useInsights = (loans, borrowers) => {
  const insights = useMemo(() => {
    if (!loans || loans.length === 0) {
      return [];
    }

    const activeLoans = loans.filter(loan => loan.status === 'Active').length;

    const loanDays = loans.map(loan => dayjs(loan.startDate).format('dddd'));
    const busiestDay = loanDays.reduce((acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    const topDay = Object.keys(busiestDay).reduce((a, b) => busiestDay[a] > busiestDay[b] ? a : b, 'N/A');

    const borrowerLoanCounts = loans.reduce((acc, loan) => {
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
        message: `You have ${activeLoans} active loans.`,
      });
    }

    // Insight: Busiest day for issuing loans
    if (topDay !== 'N/A') {
      insightsList.push({
        type: 'info',
        message: `Your busiest day for issuing loans is ${topDay}.`,
      });
    }

    // Insight: Top borrower
    if (topBorrower) {
      insightsList.push({
        type: 'info',
        message: `Your top borrower is ${topBorrower.name}.`,
      });
    }

    // Insight: Overdue loans (actionable)
    const overdueLoans = loans.filter(loan => {
      if (loan.status === 'Defaulted' || loan.status === 'Paid') return false; // Exclude defaulted and paid loans
      const totalRepayable = Number(loan.totalRepayable || 0);
      const repaidAmount = Number(loan.repaidAmount || 0);
      const dueDate = dayjs(loan.dueDate);
      const now = dayjs();
      return (repaidAmount < totalRepayable || totalRepayable === 0) && dueDate.isBefore(now, 'day');
    });

    if (overdueLoans.length > 0) {
      insightsList.push({
        type: 'warning',
        message: `${overdueLoans.length} loan(s) are overdue.`,
        action: {
          label: 'View Overdue Loans',
          onClick: () => { /* This will be handled in the Dashboard component */ },
        },
      });
    }

    // Insight: Loans due this week (actionable)
    const dueThisWeek = loans.filter(loan => {
      const totalRepayable = Number(loan.totalRepayable || 0);
      const repaidAmount = Number(loan.repaidAmount || 0);
      const dueDate = dayjs(loan.dueDate);
      const now = dayjs();
      return (repaidAmount < totalRepayable || totalRepayable === 0) && dueDate.isAfter(now, 'day') && dueDate.isBefore(now.add(7, 'day'), 'day');
    });

    if (dueThisWeek.length > 0) {
      insightsList.push({
        type: 'info',
        message: `${dueThisWeek.length} loan(s) due this week.`,
        action: {
          label: 'View Upcoming Loans',
          onClick: () => { /* This will be handled in the Dashboard component */ },
        },
      });
    }

    return insightsList;
  }, [loans, borrowers]);

  return insights;
};
