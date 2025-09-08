import { useMemo } from 'react';
import dayjs from 'dayjs';

// --- Enhanced Credit Scoring Model ---
// The model is more dynamic, considering loan value, payment history, and overdue severity.

const BASE_SCORE = 500;

// --- Positive Factors ---
const POINTS_PER_PAID_LOAN = 20; 
const BONUS_PER_1000_PRINCIPAL_PAID = 5; // Reward for handling larger amounts
const ON_TIME_PAYMENT_BONUS = 5; // Bonus for each on-time payment

// --- Negative Factors ---
const DEDUCTION_FOR_OVERDUE_LOAN = -50;
const DEDUCTION_PER_DAY_OVERDUE = -2; // Penalty increases with time
const DEDUCTION_PER_1000_PRINCIPAL_OVERDUE = -5; // Higher penalty for large overdue loans

const getRating = (score) => {
  if (score >= 750) return { label: 'Excellent', color: '#4CAF50' };
  if (score >= 650) return { label: 'Good', color: '#8BC34A' };
  if (score >= 550) return { label: 'Fair', color: '#FFC107' };
  if (score >= 450) return { label: 'Poor', color: '#FF9800' };
  return { label: 'Very Poor', color: '#F44336' };
};

export function useCreditScore(borrowerId, allLoans, allPayments) {
  const creditScoreData = useMemo(() => {
    const defaultScore = { score: BASE_SCORE, ...getRating(BASE_SCORE), history: ['Base score assigned.'] };

    if (!borrowerId || !allLoans || allLoans.length === 0) {
      return defaultScore;
    }

    const borrowerLoans = allLoans.filter(loan => loan.borrowerId === borrowerId);
    if (borrowerLoans.length === 0) {
        return defaultScore;
    }

    let score = BASE_SCORE;
    let history = [`Base Score: ${score}`];

    borrowerLoans.forEach(loan => {
      const principalInThousands = (loan.principal || 0) / 1000;

      // --- Scoring based on current loan status ---
      switch (loan.status) {
        case 'Paid':
          score += POINTS_PER_PAID_LOAN;
          history.push(`+${POINTS_PER_PAID_LOAN} pts for paid loan.`);
          
          score += principalInThousands * BONUS_PER_1000_PRINCIPAL_PAID;
          history.push(`+${(principalInThousands * BONUS_PER_1000_PRINCIPAL_PAID).toFixed(1)} pts for paid principal.`);
          break;

        case 'Overdue':
          score += DEDUCTION_FOR_OVERDUE_LOAN;
          history.push(`${DEDUCTION_FOR_OVERDUE_LOAN} pts for overdue loan.`);

          const overdueDays = dayjs().diff(dayjs(loan.dueDate), 'day');
          if (overdueDays > 0) {
            const penalty = overdueDays * DEDUCTION_PER_DAY_OVERDUE;
            score += penalty;
            history.push(`${penalty} pts for ${overdueDays} days overdue.`);
          }

          const overduePrincipalPenalty = principalInThousands * DEDUCTION_PER_1000_PRINCIPAL_OVERDUE;
          score += overduePrincipalPenalty;
          history.push(`${overduePrincipalPenalty.toFixed(1)} pts for overdue principal amount.`);
          break;

        default: // Active loans, etc.
          break;
      }
    });

    // --- Scoring based on payment history ---
    if (allPayments) {
        const borrowerPayments = allPayments.filter(p => 
            borrowerLoans.some(l => l.id === p.loanId)
        );

        borrowerPayments.forEach(payment => {
            const associatedLoan = borrowerLoans.find(l => l.id === payment.loanId);
            if (associatedLoan) {
                const paymentDate = dayjs(payment.date);
                const dueDate = dayjs(associatedLoan.dueDate);

                if (paymentDate.isBefore(dueDate) || paymentDate.isSame(dueDate, 'day')) {
                    score += ON_TIME_PAYMENT_BONUS;
                    history.push(`+${ON_TIME_PAYMENT_BONUS} pts for on-time payment.`);
                }
            }
        });
    }

    // Clamp the score between a min and max (e.g., 300-850)
    const finalScore = Math.max(300, Math.min(Math.round(score), 850));
    history.push(`Final Score: ${finalScore}`);

    return { score: finalScore, ...getRating(finalScore), history };

  }, [borrowerId, allLoans, allPayments]);

  return creditScoreData;
}
