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
    if (activeLoans > 0) {
      insightsList.push(`You have ${activeLoans} active loans.`);
    }
    if (topDay !== 'N/A') {
      insightsList.push(`Your busiest day for issuing loans is ${topDay}.`);
    }
    if (topBorrower) {
      insightsList.push(`Your top borrower is ${topBorrower.name}.`);
    }

    return insightsList;
  }, [loans, borrowers]);

  return insights;
};
