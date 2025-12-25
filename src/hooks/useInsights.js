import { useMemo } from 'react';
import dayjs from 'dayjs';

export const useInsights = (loans, borrowers, payments) => {
  const insights = useMemo(() => {
    if (!loans || loans.length === 0) {
      return [];
    }

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

    const activeLoans = loans.filter(loan => loan.status !== 'Defaulted' && calcStatus(loan) === 'Active').length;

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
        title: 'Active Loans',
        message: `You have ${activeLoans} active loans.`,
      });
    }

    // Insight: Busiest day for issuing loans
    if (topDay !== 'N/A') {
      insightsList.push({
        type: 'info',
        title: 'Busiest Day',
        message: `Your busiest day for issuing loans is ${topDay}.`,
      });
    }

    // Insight: Top borrower
    if (topBorrower) {
      insightsList.push({
        type: 'info',
        title: 'Top Borrower',
        message: `Your top borrower is ${topBorrower.name}.`,
      });
    }

    // Insight: Average loan amount
    const totalLoanAmount = loans.reduce((acc, loan) => acc + Number(loan.principal || 0), 0);
    const averageLoanAmount = loans.length > 0 ? totalLoanAmount / loans.length : 0;

    if (averageLoanAmount > 0) {
      insightsList.push({
        type: 'info',
        title: 'Average Loan Amount',
        message: `Your average loan amount is ZMW ${averageLoanAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
      });
    }

    // Insight: Average loan duration
    const paidLoans = loans.filter(loan => calcStatus(loan) === 'Paid');
    if (paidLoans.length > 0 && payments) {
        const durations = paidLoans.map(loan => {
            const loanPayments = payments.filter(p => p.loanId === loan.id);
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
                message: `The average time to repay a loan is ${Math.round(averageDuration)} days.`,
            });
        }
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
        title: 'Overdue Loans',
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
        title: 'Loans Due This Week',
        message: `${dueThisWeek.length} loan(s) due this week.`,
        action: {
          label: 'View Upcoming Loans',
          onClick: () => { /* This will be handled in the Dashboard component */ },
        },
      });
    }

    return insightsList;
  }, [loans, borrowers, payments]);

  return insights;
};
