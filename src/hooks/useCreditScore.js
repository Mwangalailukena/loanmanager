import { useMemo } from 'react';
import dayjs from 'dayjs';

const MAX_SCORE = 100;

// Define the weights for each factor
const WEIGHTS = {
  repaymentRate: 0.4,
  paidLoans: 0.2,
  loanHistory: 0.2,
  overduePenalty: 0.15,
  defaultPenalty: 0.05,
};

const calcStatus = (loan) => {
  if (loan.status === 'Defaulted') return 'Defaulted';
  const totalRepayable = Number(loan.totalRepayable || 0);
  const repaidAmount = Number(loan.repaidAmount || 0);

  if (repaidAmount >= totalRepayable && totalRepayable > 0) {
    return 'Paid';
  }
  const now = dayjs();
  const due = dayjs(loan.dueDate);
  if (due.isBefore(now, 'day')) {
    return 'Overdue';
  }
  return 'Active';
};

export const useCreditScore = (loans) => {
  const creditScore = useMemo(() => {
    if (!loans || loans.length === 0) {
      return {
        score: 0,
        remarks: 'No loan history',
        positiveFactors: [],
        negativeFactors: [],
      };
    }

    const totalLoans = loans.length;
    const paidLoans = loans.filter(loan => calcStatus(loan) === 'Paid');
    const overdueLoans = loans.filter(loan => calcStatus(loan) === 'Overdue');
    const defaultedLoans = loans.filter(loan => loan.status === 'Defaulted');

    // 1. Repayment Rate Score
    const onTimeRepayments = paidLoans.filter(loan => {
      const paymentDate = dayjs(loan.updatedAt.toDate()); // Assuming updatedAt reflects payment date
      const dueDate = dayjs(loan.dueDate);
      return paymentDate.isBefore(dueDate) || paymentDate.isSame(dueDate, 'day');
    }).length;
    
    const repaymentRate = paidLoans.length > 0 ? onTimeRepayments / paidLoans.length : 0;
    const repaymentScore = repaymentRate * WEIGHTS.repaymentRate * MAX_SCORE;

    // 2. Paid Loans Score
    const paidLoansRatio = totalLoans > 0 ? paidLoans.length / totalLoans : 0;
    const paidLoansScore = Math.min(paidLoansRatio * 2, 1) * WEIGHTS.paidLoans * MAX_SCORE; // Cap at 1

    // 3. Loan History Score
    const loanHistoryRatio = Math.min(totalLoans / 10, 1); // Score increases up to 10 loans
    const loanHistoryScore = loanHistoryRatio * WEIGHTS.loanHistory * MAX_SCORE;

    // 4. Overdue Penalty
    const overduePenalty = (overdueLoans.length / totalLoans) * WEIGHTS.overduePenalty * MAX_SCORE;

    // 5. Default Penalty
    const defaultPenalty = (defaultedLoans.length / totalLoans) * WEIGHTS.defaultPenalty * MAX_SCORE;

    // Final Score
    let score = repaymentScore + paidLoansScore + loanHistoryScore - overduePenalty - defaultPenalty;
    score = Math.max(0, Math.min(score, MAX_SCORE)); // Clamp score between 0 and 100

    // Remarks and Factors
    let remarks = '';
    if (score >= 80) remarks = 'Excellent';
    else if (score >= 60) remarks = 'Good';
    else if (score >= 40) remarks = 'Fair';
    else if (score >= 20) remarks = 'Poor';
    else remarks = 'Very Poor';

    const positiveFactors = [];
    if (repaymentRate === 1) positiveFactors.push('Perfect on-time repayment record');
    if (paidLoans.length > 5) positiveFactors.push('Extensive history of repaid loans');

    const negativeFactors = [];
    if (overdueLoans.length > 0) negativeFactors.push(`${overdueLoans.length} overdue loan(s)`);
    if (defaultedLoans.length > 0) negativeFactors.push(`${defaultedLoans.length} defaulted loan(s)`);

    return {
      score: Math.round(score),
      remarks,
      positiveFactors,
      negativeFactors,
      stats: {
        totalLoans,
        paidLoans: paidLoans.length,
        overdueLoans: overdueLoans.length,
        defaultedLoans: defaultedLoans.length,
        repaymentRate,
      }
    };
  }, [loans]);

  return creditScore;
};