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

const calcStatus = (loan, date) => {
  if (loan.status === 'Defaulted' && dayjs(loan.updatedAt.toDate()).isBefore(date)) return 'Defaulted';
  const totalRepayable = Number(loan.totalRepayable || 0);
  const repaidAmount = Number(loan.repaidAmount || 0);

  if (repaidAmount >= totalRepayable && totalRepayable > 0 && dayjs(loan.updatedAt.toDate()).isBefore(date)) {
    return 'Paid';
  }
  
  const due = dayjs(loan.dueDate);
  if (due.isBefore(date, 'day')) {
    return 'Overdue';
  }
  return 'Active';
};

const calculateScoreForDate = (loans, date) => {
  const loansUpToDate = loans.filter(loan => dayjs(loan.startDate).isBefore(date));

  if (loansUpToDate.length === 0) {
    return 0;
  }

  const totalLoans = loansUpToDate.length;
  const paidLoans = loansUpToDate.filter(loan => calcStatus(loan, date) === 'Paid');
  const overdueLoans = loansUpToDate.filter(loan => calcStatus(loan, date) === 'Overdue');
  const defaultedLoans = loansUpToDate.filter(loan => calcStatus(loan, date) === 'Defaulted');

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
  return Math.max(0, Math.min(score, MAX_SCORE)); // Clamp score between 0 and 100
}

export const useCreditScore = (loans) => {
  const creditScore = useMemo(() => {
    if (!loans || loans.length === 0) {
      return {
        score: 0,
        remarks: 'No loan history',
        positiveFactors: [],
        negativeFactors: [],
        history: [],
        stats: {},
      };
    }

    const score = calculateScoreForDate(loans, dayjs());

    // Remarks and Factors
    let remarks = '';
    if (score >= 80) remarks = 'Excellent';
    else if (score >= 60) remarks = 'Good';
    else if (score >= 40) remarks = 'Fair';
    else if (score >= 20) remarks = 'Poor';
    else remarks = 'Very Poor';

    const paidLoans = loans.filter(loan => calcStatus(loan, dayjs()) === 'Paid');
    const overdueLoans = loans.filter(loan => calcStatus(loan, dayjs()) === 'Overdue');
    const defaultedLoans = loans.filter(loan => calcStatus(loan, dayjs()) === 'Defaulted');
    const onTimeRepayments = paidLoans.filter(loan => {
      const paymentDate = dayjs(loan.updatedAt.toDate()); // Assuming updatedAt reflects payment date
      const dueDate = dayjs(loan.dueDate);
      return paymentDate.isBefore(dueDate) || paymentDate.isSame(dueDate, 'day');
    }).length;
    const repaymentRate = paidLoans.length > 0 ? onTimeRepayments / paidLoans.length : 0;

    const positiveFactors = [];
    if (repaymentRate === 1) positiveFactors.push('Perfect on-time repayment record');
    if (paidLoans.length > 5) positiveFactors.push('Extensive history of repaid loans');

    const negativeFactors = [];
    if (overdueLoans.length > 0) negativeFactors.push(`${overdueLoans.length} overdue loan(s)`);
    if (defaultedLoans.length > 0) negativeFactors.push(`${defaultedLoans.length} defaulted loan(s)`);

    const firstLoanDate = loans.reduce((oldest, loan) => {
      const loanDate = dayjs(loan.startDate);
      return loanDate.isBefore(oldest) ? loanDate : oldest;
    }, dayjs());

    const history = [];
    let currentDate = firstLoanDate;
    while(currentDate.isBefore(dayjs())) {
      history.push({
        date: currentDate.format('YYYY-MM-DD'),
        score: calculateScoreForDate(loans, currentDate),
      });
      currentDate = currentDate.add(1, 'month');
    }

    return {
      score: Math.round(score),
      remarks,
      positiveFactors,
      negativeFactors,
      history,
      stats: {
        totalLoans: loans.length,
        paidLoans: paidLoans.length,
        overdueLoans: overdueLoans.length,
        defaultedLoans: defaultedLoans.length,
        repaymentRate,
      }
    };
  }, [loans]);

  return creditScore;
};