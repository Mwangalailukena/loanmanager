import { useState, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import { useFirestore } from '../contexts/FirestoreProvider';

export const useNotifications = () => {
  const { loans, borrowers } = useFirestore();
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('readNotifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allNotifications = useMemo(() => {
    if (!loans || !borrowers) return [];
    const now = dayjs();
    const notes = [];

    loans.forEach((loan) => {
      if (loan.status === 'Paid' || loan.status === 'Refinanced') return;

      const borrower = borrowers.find((b) => b.id === loan.borrowerId);
      const borrowerName = borrower ? borrower.name : 'A borrower';
      const dueDate = dayjs(loan.dueDate);

      if (dueDate.isBefore(now, 'day')) {
        notes.push({
          id: `${loan.id}-overdue`,
          message: `Loan for ${borrowerName} is overdue!`,
          loanId: loan.id,
          type: 'overdue',
          severity: 'error',
          date: loan.dueDate,
        });
      } else {
        const diffInDays = dueDate.diff(now, 'day');
        if (diffInDays < 3) {
          notes.push({
            id: `${loan.id}-upcoming`,
            message: `Loan for ${borrowerName} is due ${diffInDays === 0 ? 'today' : `in ${diffInDays} days`}.`,
            loanId: loan.id,
            type: 'upcoming',
            severity: 'warning',
            date: loan.dueDate,
          });
        }
      }
    });

    // Sort: Overdue first, then by date
    return notes.sort((a, b) => {
      if (a.type === 'overdue' && b.type !== 'overdue') return -1;
      if (a.type !== 'overdue' && b.type === 'overdue') return 1;
      return dayjs(a.date).unix() - dayjs(b.date).unix();
    });
  }, [loans, borrowers]);

  const unreadNotifications = useMemo(
    () => allNotifications.filter((note) => !readNotifications.includes(note.id)),
    [allNotifications, readNotifications]
  );

  const markAsRead = useCallback((id) => {
    setReadNotifications((prev) => {
      const next = [...new Set([...prev, id])];
      localStorage.setItem('readNotifications', JSON.stringify(next));
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = allNotifications.map((n) => n.id);
    setReadNotifications(allIds);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
  }, [allNotifications]);

  return {
    allNotifications,
    unreadNotifications,
    markAsRead,
    markAllAsRead,
  };
};
