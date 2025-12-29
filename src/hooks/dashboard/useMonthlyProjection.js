import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useFirestore } from '../../contexts/FirestoreProvider';
import dayjs from 'dayjs';
import { getFunctions, httpsCallable } from 'firebase/functions'; // NEW: Import Firebase Functions SDK
import app from '../../firebase'; // Corrected: Import 'app' as default

const getMonthlyProjectionAIFunction = httpsCallable(getFunctions(app), 'getMonthlyProjectionAI'); // Initialize callable function

const useMonthlyProjection = (selectedMonth, selectedYear) => {
  const { loans, payments, loadingLoans, loadingPayments } = useFirestore();
  const [projection, setProjection] = useState({
    projectedRevenue: 0,
    projectedPayments: 0,
    projectedNewLoans: 0,
  });
  const [loadingProjection, setLoadingProjection] = useState(true);

  // Memoize the API call function to prevent unnecessary re-creation
  const fetchAIProjection = useCallback(async (historicalData, targetMonth, targetYear) => {
    try {
      setLoadingProjection(true);
      const result = await getMonthlyProjectionAIFunction({
        historicalData,
        targetMonth,
        targetYear,
      });
      setProjection(result.data);
    } catch (error) {
      console.error('Error fetching AI projection:', error);
      // Fallback to basic projection or set default values on error
      setProjection({
        projectedRevenue: 0,
        projectedPayments: 0,
        projectedNewLoans: 0,
      });
    } finally {
      setLoadingProjection(false);
    }
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    if (loadingLoans || loadingPayments || !loans || !payments) {
      setLoadingProjection(true);
      return;
    }

    const aggregateHistoricalData = () => {
      const historicalData = {}; // Stores data for each month (YYYY-MM)

      // Initialize historicalData for the past 24 months
      for (let i = 0; i < 24; i++) {
        const monthKey = dayjs().subtract(i, 'month').format('YYYY-MM');
        historicalData[monthKey] = {
          newLoansCount: 0,
          newLoansAmount: 0,
          totalPaymentsCollected: 0,
          overdueLoansCount: 0,
          closedLoansCount: 0,
          totalRepayableAmount: 0,
        };
      }

      loans.forEach(loan => {
        const loanDate = loan.loanDate ? dayjs(loan.loanDate.toDate ? loan.loanDate.toDate() : loan.loanDate) : null;
        if (!loanDate || !loanDate.isValid()) return;

        const monthKey = loanDate.format('YYYY-MM');
        if (historicalData[monthKey]) {
          historicalData[monthKey].newLoansCount += 1;
          historicalData[monthKey].newLoansAmount += loan.loanAmount || 0;
          historicalData[monthKey].totalRepayableAmount += loan.totalRepayable || 0;
        }
        
        const dueDate = loan.dueDate ? dayjs(loan.dueDate.toDate ? loan.dueDate.toDate() : loan.dueDate) : null;
        if (dueDate && dueDate.isValid() && loan.status === 'Overdue') {
            const overdueMonthKey = dueDate.add(1, 'month').format('YYYY-MM');
            if (historicalData[overdueMonthKey]) {
                historicalData[overdueMonthKey].overdueLoansCount += 1;
            }
        }

        if (loan.status === 'Paid') {
            const paidMonthKey = dueDate ? dueDate.format('YYYY-MM') : monthKey;
             if (historicalData[paidMonthKey]) {
                historicalData[paidMonthKey].closedLoansCount += 1;
            }
        }
      });

      payments.forEach(payment => {
        const paymentDate = payment.paymentDate ? dayjs(payment.paymentDate.toDate ? payment.paymentDate.toDate() : payment.paymentDate) : null;
        if (!paymentDate || !paymentDate.isValid()) return;

        const monthKey = paymentDate.format('YYYY-MM');
        if (historicalData[monthKey]) {
          historicalData[monthKey].totalPaymentsCollected += payment.amount || 0;
        }
      });

      const sortedHistoricalData = Object.keys(historicalData)
        .sort()
        .map(monthKey => ({ month: monthKey, ...historicalData[monthKey] }));
      
      console.log('Aggregated Historical Data:', sortedHistoricalData);
      
      return sortedHistoricalData;
    };

    const aggregatedData = aggregateHistoricalData();
    fetchAIProjection(aggregatedData, selectedMonth, selectedYear); // Call the AI function

  }, [loans, payments, loadingLoans, loadingPayments, selectedMonth, selectedYear, fetchAIProjection]); // Added fetchAIProjection to dependencies

  return { projection, loadingProjection };
};

export default useMonthlyProjection;
