import { useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const calcStatus = (loan) => {
  if (loan.status === "Defaulted") return "Defaulted";
  const now = dayjs();
  const due = dayjs(loan.dueDate);
  if (loan.isPaid || (loan.repaidAmount >= loan.totalRepayable && loan.totalRepayable > 0 && !loan.status)) return "Paid";
  if (loan.status === "Paid") return "Paid";
  if (due.isBefore(now, "day")) return "Overdue";
  return "Active";
};

export const useReportCalculations = (loans, payments, borrowers, filters) => {
  const { startDate, endDate, selectedBorrower, includePaid, includeActive, includeOverdue, includeDefaulted, isCompareMode } = filters;

  const getDisplayBorrowerInfo = useCallback((loan) => {
    if (loan.borrowerId) {
      const borrower = borrowers?.find(b => b.id === loan.borrowerId);
      return { name: borrower?.name || 'Unknown', phone: borrower?.phone || '' };
    } else {
      return { name: loan.borrower, phone: loan.phone };
    }
  }, [borrowers]);

  return useMemo(() => {
    if (!loans || !payments || !borrowers) {
      return {
        filteredLoans: [],
        portfolioSummary: {},
        arrearsAging: { buckets: {}, list: [], chartData: [] },
        cashFlow: { data: [], totals: {} },
        detailedLoanList: [],
        prevPeriodSummary: null,
      };
    }

    // 1. Filter Loans
    const filteredLoans = loans
      .map(loan => {
        const displayInfo = getDisplayBorrowerInfo(loan);
        const status = calcStatus(loan);
        return { ...loan, borrower: displayInfo.name, phone: displayInfo.phone, status };
      })
      .filter(loan => {
        const loanStartDate = dayjs(loan.startDate);
        const inDateRange = loanStartDate.isBetween(startDate, endDate, 'day', '[]');

        let statusMatches = false;
        if (loan.status === "Paid" && includePaid) statusMatches = true;
        if (loan.status === "Active" && includeActive) statusMatches = true;
        if (loan.status === "Overdue" && includeOverdue) statusMatches = true;
        if (loan.status === "Defaulted" && includeDefaulted) statusMatches = true;

        const borrowerMatches = !selectedBorrower || loan.borrowerId === selectedBorrower.id;
        return inDateRange && statusMatches && borrowerMatches;
      });

    // 2. Portfolio Summary
    let activeLoans = 0, paidLoans = 0, overdueLoans = 0, defaultedLoans = 0;
    let totalPrincipalDisbursed = 0, totalInterestAccrued = 0, totalOutstanding = 0, totalRepaid = 0;

    filteredLoans.forEach(loan => {
      if (loan.status === "Active") activeLoans++;
      else if (loan.status === "Paid") paidLoans++;
      else if (loan.status === "Overdue") overdueLoans++;
      else if (loan.status === "Defaulted") defaultedLoans++;

      totalPrincipalDisbursed += Number(loan.principal || 0);
      totalInterestAccrued += Number(loan.interest || 0);
      totalRepaid += Number(loan.repaidAmount || 0);
      totalOutstanding += (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0));
    });

    const portfolioSummary = {
      totalLoans: filteredLoans.length,
      activeLoans, paidLoans, overdueLoans, defaultedLoans,
      totalPrincipalDisbursed, totalInterestAccrued, totalOutstanding, totalRepaid,
      portfolioYield: totalPrincipalDisbursed > 0 ? (totalRepaid / totalPrincipalDisbursed) - 1 : 0,
      repaymentRate: (totalPrincipalDisbursed + totalInterestAccrued) > 0 ? totalRepaid / (totalPrincipalDisbursed + totalInterestAccrued) : 0,
      defaultRate: filteredLoans.length > 0 ? overdueLoans / filteredLoans.length : 0,
    };

    // 3. Comparison
    let prevPeriodSummary = null;
    if (isCompareMode) {
      const diff = endDate.diff(startDate, 'day');
      const prevStart = startDate.subtract(diff + 1, 'day');
      const prevEnd = startDate.subtract(1, 'day');
      const prevLoans = loans.filter(l => dayjs(l.startDate).isBetween(prevStart, prevEnd, 'day', '[]'));
      
      let pDisbursed = 0, pRepaid = 0, pInterest = 0;
      prevLoans.forEach(l => {
        pDisbursed += Number(l.principal || 0);
        pRepaid += Number(l.repaidAmount || 0);
        pInterest += Number(l.interest || 0);
      });
      prevPeriodSummary = { disbursed: pDisbursed, repaid: pRepaid, interest: pInterest, count: prevLoans.length };
    }

    // 4. Arrears Aging
    const now = dayjs();
    const buckets = { 
      '1-7 Days': { loans: [], total: 0 }, 
      '8-14 Days': { loans: [], total: 0 }, 
      '15-30 Days': { loans: [], total: 0 }, 
      '30+ Days': { loans: [], total: 0 } 
    };
    const overdueList = [];

    filteredLoans.forEach(loan => {
      if (loan.status === "Overdue" || loan.status === "Defaulted") {
        const outstanding = (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0));
        if (outstanding <= 0) return;
        const daysOverdue = now.diff(dayjs(loan.dueDate), 'day');
        const loanData = { ...loan, outstanding, daysOverdue };
        
        if (daysOverdue >= 1 && daysOverdue <= 7) { buckets['1-7 Days'].loans.push(loanData); buckets['1-7 Days'].total += outstanding; }
        else if (daysOverdue >= 8 && daysOverdue <= 14) { buckets['8-14 Days'].loans.push(loanData); buckets['8-14 Days'].total += outstanding; }
        else if (daysOverdue >= 15 && daysOverdue <= 30) { buckets['15-30 Days'].loans.push(loanData); buckets['15-30 Days'].total += outstanding; }
        else if (daysOverdue > 30) { buckets['30+ Days'].loans.push(loanData); buckets['30+ Days'].total += outstanding; }
        overdueList.push(loanData);
      }
    });

    // 5. Cash Flow
    const inflows = payments
      .filter(p => dayjs(p.date?.toDate ? p.date.toDate() : p.date).isBetween(startDate, endDate, 'day', '[]'))
      .map(p => ({ 
        date: dayjs(p.date?.toDate ? p.date.toDate() : p.date).format('YYYY-MM-DD'), 
        type: 'Inflow (Payment)', 
        amount: Number(p.amount || 0), 
        description: `Payment for Loan ID: ${p.loanId}` 
      }));
    const outflows = filteredLoans.map(l => ({ 
      date: l.startDate, 
      type: 'Outflow (Disbursement)', 
      amount: -Number(l.principal || 0), 
      description: `Loan to ${l.borrower}` 
    }));
    const combinedCashFlow = [...inflows, ...outflows].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    return {
      filteredLoans,
      portfolioSummary,
      prevPeriodSummary,
      arrearsAging: { 
        buckets, 
        list: overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue), 
        chartData: Object.entries(buckets).map(([name, data]) => ({ name, value: data.total })) 
      },
      cashFlow: { 
        data: combinedCashFlow, 
        totals: { 
          totalInflow: inflows.reduce((sum, item) => sum + item.amount, 0), 
          totalOutflow: Math.abs(outflows.reduce((sum, item) => sum + item.amount, 0)), 
          netCashFlow: inflows.reduce((sum, item) => sum + item.amount, 0) + outflows.reduce((sum, item) => sum + item.amount, 0) 
        } 
      },
      detailedLoanList: filteredLoans.map(l => ({
        id: l.id,
        borrowerName: l.borrower,
        phone: l.phone,
        principal: Number(l.principal || 0),
        interest: Number(l.interest || 0),
        totalRepayable: Number(l.totalRepayable || 0),
        amountRepaid: Number(l.repaidAmount || 0),
        outstanding: (Number(l.totalRepayable || 0) - Number(l.repaidAmount || 0)),
        startDate: l.startDate,
        dueDate: l.dueDate,
        status: l.status,
        daysOverdue: l.status === 'Overdue' ? dayjs().diff(dayjs(l.dueDate), 'day') : 0,
      }))
    };
  }, [loans, payments, borrowers, startDate, endDate, includePaid, includeActive, includeOverdue, includeDefaulted, selectedBorrower, isCompareMode, getDisplayBorrowerInfo]);
};
