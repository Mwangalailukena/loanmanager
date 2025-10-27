import { useEffect, useState } from 'react';
import { useFirestore } from '../contexts/FirestoreProvider';

const ACHIEVEMENTS_DEFINITIONS = [
  { id: 'first_loan_repaid', name: 'First Loan Repaid', description: 'Repay your first loan.', check: (loans) => loans.some(loan => loan.repaidAmount >= loan.totalRepayable && loan.totalRepayable > 0) },
  { id: 'five_loans_repaid', name: 'Five Loans Repaid', description: 'Repay five loans.', check: (loans) => loans.filter(loan => loan.repaidAmount >= loan.totalRepayable && loan.totalRepayable > 0).length >= 5 },
  { id: 'ten_loans_repaid', name: 'Ten Loans Repaid', description: 'Repay ten loans.', check: (loans) => loans.filter(loan => loan.repaidAmount >= loan.totalRepayable && loan.totalRepayable > 0).length >= 10 },
  { id: 'first_borrower_added', name: 'First Borrower Added', description: 'Add your first borrower.', check: (loans, borrowers) => borrowers.length >= 1 },
  { id: 'five_borrowers_added', name: 'Five Borrowers Added', description: 'Add five borrowers.', check: (loans, borrowers) => borrowers.length >= 5 },
];

export const useAchievements = () => {
  const { loans, borrowers, currentUser, updateUser } = useFirestore();
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);

  useEffect(() => {
    if (!currentUser || !loans || !borrowers) return;

    const newUnlocked = [];
    const currentUnlockedIds = currentUser.unlockedAchievements || [];

    ACHIEVEMENTS_DEFINITIONS.forEach(achievement => {
      if (!currentUnlockedIds.includes(achievement.id) && achievement.check(loans, borrowers)) {
        newUnlocked.push(achievement.id);
      }
    });

    if (newUnlocked.length > 0) {
      const updatedAchievements = [...currentUnlockedIds, ...newUnlocked];
      updateUser({ unlockedAchievements: updatedAchievements });
      setUnlockedAchievements(updatedAchievements);
    } else {
      setUnlockedAchievements(currentUnlockedIds);
    }

  }, [loans, borrowers, currentUser, updateUser]);

  return ACHIEVEMENTS_DEFINITIONS.map(achievement => ({
    ...achievement,
    unlocked: unlockedAchievements.includes(achievement.id),
  }));
};
