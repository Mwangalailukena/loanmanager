import { useState, useCallback, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useAuth } from '../contexts/AuthProvider';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

dayjs.extend(relativeTime);

export const useNotifications = () => {
  const { loans, borrowers } = useFirestore();
  const { currentUser } = useAuth();
  const [readNotifications, setReadNotifications] = useState([]);
  const [snoozedNotifications, setSnoozedNotifications] = useState({});

  // Fetch read states from Firestore for cross-device sync
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setReadNotifications(docSnap.data().readNotifications || []);
      }
    });
    return () => unsub();
  }, [currentUser]);

  const allNotifications = useMemo(() => {
    if (!loans || !borrowers) return [];
    const now = dayjs();
    const notes = [];

    loans.forEach((loan) => {
      const repaidAmount = loan.repaidAmount || 0;
      const totalRepayable = loan.totalRepayable || 0;
      
      // Best Practice: Skip if settled (by status OR by balance)
      if (loan.status === 'Paid' || loan.status === 'Refinanced' || repaidAmount >= totalRepayable) return;

      const borrower = borrowers.find((b) => b.id === loan.borrowerId);
      const borrowerName = borrower ? borrower.name : 'A borrower';
      const borrowerPhone = borrower ? borrower.phone : '';
      const dueDate = dayjs(loan.dueDate);
      const amount = loan.totalRepayable - (loan.repaidAmount || 0);

      // Check if snoozed
      if (snoozedNotifications[loan.id] && dayjs().isBefore(dayjs(snoozedNotifications[loan.id]))) {
        return;
      }

      if (dueDate.isBefore(now, 'day')) {
        notes.push({
          id: `${loan.id}-overdue`,
          loanId: loan.id,
          borrowerName,
          borrowerPhone,
          amount,
          message: `${borrowerName}'s loan is overdue by ${dueDate.fromNow(true)}!`,
          type: 'overdue',
          severity: 'error',
          date: loan.dueDate,
          fullDate: dueDate,
        });
      } else {
        const diffInHours = dueDate.diff(now, 'hour');
        const diffInDays = dueDate.diff(now, 'day');

        if (diffInHours <= 24 && diffInHours > 0) {
          notes.push({
            id: `${loan.id}-urgent`,
            loanId: loan.id,
            borrowerName,
            borrowerPhone,
            amount,
            message: `FINAL WARNING: ${borrowerName} is due in ${dueDate.fromNow(true)}!`,
            type: 'urgent',
            severity: 'error',
            date: loan.dueDate,
            fullDate: dueDate,
          });
        } else if (diffInDays < 3) {
          notes.push({
            id: `${loan.id}-upcoming`,
            loanId: loan.id,
            borrowerName,
            borrowerPhone,
            amount,
            message: `${borrowerName} is due ${dueDate.fromNow()}.`,
            type: 'upcoming',
            severity: 'warning',
            date: loan.dueDate,
            fullDate: dueDate,
          });
        }
      }
    });

    return notes.sort((a, b) => {
      const priority = { overdue: 0, urgent: 1, upcoming: 2 };
      if (priority[a.type] !== priority[b.type]) return priority[a.type] - priority[b.type];
      return a.fullDate.unix() - b.fullDate.unix();
    });
  }, [loans, borrowers, snoozedNotifications]);

  const unreadNotifications = useMemo(
    () => allNotifications.filter((note) => !readNotifications.includes(note.id)),
    [allNotifications, readNotifications]
  );

  const markAsRead = useCallback(async (id) => {
    if (!currentUser) return;
    const newRead = [...new Set([...readNotifications, id])];
    await setDoc(doc(db, 'users', currentUser.uid), { readNotifications: newRead }, { merge: true });
  }, [currentUser, readNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;
    const allIds = allNotifications.map((n) => n.id);
    const newRead = [...new Set([...readNotifications, ...allIds])];
    await setDoc(doc(db, 'users', currentUser.uid), { readNotifications: newRead }, { merge: true });
  }, [currentUser, allNotifications, readNotifications]);

  const snoozeNotification = useCallback((loanId, hours = 24) => {
    setSnoozedNotifications(prev => ({
      ...prev,
      [loanId]: dayjs().add(hours, 'hour').toISOString()
    }));
  }, []);

  return {
    allNotifications,
    unreadNotifications,
    markAsRead,
    markAllAsRead,
    snoozeNotification,
  };
};

