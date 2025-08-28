import { useMemo } from 'react';

// This is a simplified credit scoring model. 
// In a real-world application, this would be significantly more complex.
const BASE_SCORE = 500;
const POINTS_PER_PAID_LOAN = 50;
const POINTS_PER_ACTIVE_LOAN = 10;
const DEDUCTION_FOR_OVERDUE_LOAN = -75;

const getRating = (score) => {
  if (score >= 750) return { label: 'Excellent', color: '#4CAF50' }; // Green
  if (score >= 650) return { label: 'Good', color: '#8BC34A' }; // Light Green
  if (score >= 550) return { label: 'Fair', color: '#FFC107' }; // Amber
  if (score >= 450) return { label: 'Poor', color: '#FF9800' }; // Orange
  return { label: 'Very Poor', color: '#F44336' }; // Red
};

export function useCreditScore(borrowerId, allLoans) {
  const creditScoreData = useMemo(() => {
    if (!borrowerId || !allLoans || allLoans.length === 0) {
      const score = BASE_SCORE;
      return { score, ...getRating(score) };
    }

    const borrowerLoans = allLoans.filter(loan => loan.borrowerId === borrowerId);

    if (borrowerLoans.length === 0) {
        const score = BASE_SCORE;
        return { score, ...getRating(score) };
    }

    let score = BASE_SCORE;

    borrowerLoans.forEach(loan => {
      switch (loan.status) {
        case 'Paid':
          score += POINTS_PER_PAID_LOAN;
          break;
        case 'Active':
          score += POINTS_PER_ACTIVE_LOAN;
          break;
        case 'Overdue':
          score += DEDUCTION_FOR_OVERDUE_LOAN;
          // Optional: Add further penalty for how long it's been overdue
          // const overdueDays = dayjs().diff(dayjs(loan.dueDate), 'day');
          // if (overdueDays > 0) {
          //   score += overdueDays * DEDUCTION_PER_OVERDUE_DAY;
          // }
          break;
        default:
          break;
      }
    });

    // Clamp the score between a min and max, e.g., 300-850
    const finalScore = Math.max(300, Math.min(score, 850));

    return { score: finalScore, ...getRating(finalScore) };

  }, [borrowerId, allLoans]);

  return creditScoreData;
}
