
import { useMemo } from 'react';
import dayjs from 'dayjs';

export function usePortfolioCalculations(loans, startDate, endDate) {
  const portfolioData = useMemo(() => {
    if (!loans || loans.length === 0) {
      return null;
    }

    const filteredLoans = loans.filter(loan => {
      const loanDate = dayjs(loan.startDate);
      return loanDate.isAfter(startDate) && loanDate.isBefore(endDate);
    });

    const totalDisbursed = filteredLoans.reduce((acc, loan) => acc + Number(loan.principal), 0);
    const totalCollected = filteredLoans.reduce((acc, loan) => acc + Number(loan.repaidAmount), 0);
    const totalOutstanding = filteredLoans.reduce((acc, loan) => acc + (Number(loan.totalRepayable) - Number(loan.repaidAmount)), 0);
    const averageLoanSize = totalDisbursed / filteredLoans.length;
    const averageLoanDuration = filteredLoans.reduce((acc, loan) => {
      const startDate = dayjs(loan.startDate);
      const dueDate = dayjs(loan.dueDate);
      return acc + dueDate.diff(startDate, 'days');
    }, 0) / filteredLoans.length;

    const portfolioYield = (totalCollected / totalDisbursed) - 1;
    const repaymentRate = totalCollected / filteredLoans.reduce((acc, loan) => acc + Number(loan.totalRepayable), 0);

    const overdueLoans = filteredLoans.filter(loan => {
        const totalRepayable = Number(loan.totalRepayable || 0);
        const repaidAmount = Number(loan.repaidAmount || 0);
        if (repaidAmount >= totalRepayable && totalRepayable > 0) {
            return false;
        }
        return dayjs(loan.dueDate).isBefore(dayjs(), "day");
    });

    const defaultRate = overdueLoans.length / filteredLoans.length;

    const valueOfOverdueLoans = overdueLoans.reduce((acc, loan) => acc + (Number(loan.totalRepayable) - Number(loan.repaidAmount)), 0);

    const overdueBreakdown = overdueLoans.reduce((acc, loan) => {
        const overdueDays = dayjs().diff(dayjs(loan.dueDate), 'day');
        if (overdueDays <= 30) {
            acc['1-30'] += 1;
        } else if (overdueDays <= 60) {
            acc['31-60'] += 1;
        } else {
            acc['60+'] += 1;
        }
        return acc;
    }, { '1-30': 0, '31-60': 0, '60+': 0 });

    return {
      totalDisbursed,
      totalCollected,
      totalOutstanding,
      averageLoanSize,
      averageLoanDuration,
      portfolioYield,
      repaymentRate,
      defaultRate,
      numberOfOverdueLoans: overdueLoans.length,
      valueOfOverdueLoans,
      overdueBreakdown,
    };
  }, [loans, startDate, endDate]);

  return portfolioData;
}
