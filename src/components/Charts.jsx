import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import {
  Box, Typography, useTheme, Paper, 
  Tabs, Tab, alpha
} from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import WarningAmberIcon from '@mui/icons-material/GppMaybeRounded';
import PeopleIcon from '@mui/icons-material/GroupsRounded';
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import ChartsSkeleton from './dashboard/ChartsSkeleton';

// Lazy Load Chart Components
const GrowthChart = lazy(() => import('./charts/GrowthChart'));
const RiskChart = lazy(() => import('./charts/RiskChart'));
const TopBorrowersChart = lazy(() => import('./charts/TopBorrowersChart'));

// Extend dayjs
dayjs.extend(isBetween);

// --- Sub-Components ---
const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const calcStatusAsOf = (loan, asOfDate) => {
  if ((loan.repaidAmount || 0) >= (loan.principal || 0)) return 'Paid';
  const checkDate = dayjs(asOfDate);
  if (!loan.repaymentSchedule || loan.repaymentSchedule.length === 0) return 'Active';
  const sortedSchedule = [...loan.repaymentSchedule].sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());
  for (const item of sortedSchedule) {
    if (dayjs(item.date).isBefore(checkDate, 'day') && (item.repaidAmount || 0) < item.amount) return 'Overdue';
  }
  return 'Active';
};

// --- Main Chart Component ---
const Charts = ({ loans, borrowers, payments, expenses, selectedMonth }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [chartStartDate, setChartStartDate] = useState(dayjs().subtract(1, 'year').format('YYYY-MM-DD'));
  const [chartEndDate, setChartEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [isReady, setIsReady] = useState(false);

  // --- Defer Rendering Logic ---
  useEffect(() => {
    let idleHandle;
    const enableRendering = () => setIsReady(true);

    // 1. Idle Callback with Fallback
    if ('requestIdleCallback' in window) {
      idleHandle = requestIdleCallback(enableRendering, { timeout: 3000 });
    } else {
      idleHandle = setTimeout(enableRendering, 2000);
    }

    // 2. User Interaction Trigger (optional, to speed up if user starts interacting)
    // We use 'once: true' so it only fires the first time
    const interactionEvents = ['touchstart', 'mousemove', 'scroll', 'keydown', 'click'];
    const onInteract = () => {
       enableRendering();
       interactionEvents.forEach(e => window.removeEventListener(e, onInteract));
    };
    interactionEvents.forEach(e => window.addEventListener(e, onInteract, { passive: true, once: true }));

    return () => {
      if ('cancelIdleCallback' in window) cancelIdleCallback(idleHandle);
      else clearTimeout(idleHandle);
      interactionEvents.forEach(e => window.removeEventListener(e, onInteract));
    };
  }, []);


  useEffect(() => {
    if (selectedMonth) {
      setChartStartDate(dayjs(selectedMonth).subtract(5, 'month').startOf('month').format('YYYY-MM-DD'));
      setChartEndDate(dayjs(selectedMonth).endOf('month').format('YYYY-MM-DD'));
    } else {
      setChartStartDate(dayjs().subtract(11, 'month').startOf('month').format('YYYY-MM-DD'));
      setChartEndDate(dayjs().endOf('month').format('YYYY-MM-DD'));
    }
  }, [selectedMonth]);

  const isLoading = !loans || !borrowers || !payments || !expenses;

  // Data Processing - Memoized and Deferred
  const { growthData, riskData, topBorrowers } = useMemo(() => {
    // Return empty if not ready or loading to save main thread
    if (!isReady || isLoading) return { growthData: [], riskData: [], topBorrowers: [] };

    // 1. Growth Data
    const monthMap = new Map();
    const rangeStart = dayjs(chartStartDate).startOf('month');
    const rangeEnd = dayjs(chartEndDate).endOf('month');
    
    let curr = rangeStart;
    while(curr.isBefore(rangeEnd)) {
      monthMap.set(curr.format('MMM YY'), { month: curr.format('MMM YY'), income: 0, costs: 0 });
      curr = curr.add(1, 'month');
    }

    payments.forEach(p => {
      const d = dayjs(p.date?.toDate ? p.date.toDate() : p.date);
      if (d.isBetween(rangeStart, rangeEnd, 'day', '[]')) {
        const key = d.format('MMM YY');
        if (monthMap.has(key)) monthMap.get(key).income += Number(p.amount || 0);
      }
    });

    expenses.forEach(e => {
      const d = dayjs(e.date);
      if (d.isBetween(rangeStart, rangeEnd, 'day', '[]')) {
        const key = d.format('MMM YY');
        if (monthMap.has(key)) monthMap.get(key).costs += Number(e.amount || 0);
      }
    });

    // 2. Risk Data
    const riskTrend = Array.from(monthMap.keys()).map(monthKey => {
      const asOf = dayjs(monthKey, 'MMM YY').endOf('month');
      let performing = 0, overdue = 0;
      loans.forEach(l => {
        if (dayjs(l.startDate).isAfter(asOf)) return;
        const status = calcStatusAsOf(l, asOf);
        const outstanding = Math.max(0, Number(l.totalRepayable || 0) - Number(l.repaidAmount || 0));
        if (outstanding > 0) {
          if (status === 'Overdue') overdue += outstanding;
          else performing += outstanding;
        }
      });
      return { month: monthKey, Performing: performing, Overdue: overdue };
    });

    // 3. Top Borrowers
    const borrowerMap = new Map();
    loans.forEach(l => {
      const outstanding = Math.max(0, Number(l.totalRepayable || 0) - Number(l.repaidAmount || 0));
      if (outstanding > 0) {
        borrowerMap.set(l.borrowerId, (borrowerMap.get(l.borrowerId) || 0) + outstanding);
      }
    });
    const sortedBorrowers = Array.from(borrowerMap.entries())
      .map(([id, val]) => ({ 
        name: borrowers.find(b => b.id === id)?.name || 'Unknown', 
        value: val 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { 
      growthData: Array.from(monthMap.values()), 
      riskData: riskTrend, 
      topBorrowers: sortedBorrowers 
    };
  }, [loans, borrowers, payments, expenses, chartStartDate, chartEndDate, isLoading, isReady]);

  // Show Skeleton until the browser is idle/ready
  if (isLoading || !isReady) return <ChartsSkeleton />;

  return (
    <Box>
      <Paper sx={{ borderRadius: 4, p: { xs: 2, md: 3 }, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="800" letterSpacing="-0.02em">Portfolio Performance</Typography>
            <Typography variant="caption" color="text.secondary">Visualizing your business health and trajectory</Typography>
          </Box>
          
          <Tabs 
            value={activeTab} 
            onChange={(e, v) => setActiveTab(v)}
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2,
              p: 0.5,
              '& .MuiTabs-indicator': { height: '100%', borderRadius: 1.5, zIndex: 0, bgcolor: 'background.paper', boxShadow: theme.shadows[1] },
              '& .MuiTab-root': { zIndex: 1, minHeight: 40, py: 1, px: 2, borderRadius: 1.5, transition: 'all 0.2s' }
            }}
          >
            <Tab icon={<TrendingUpIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Growth" />
            <Tab icon={<WarningAmberIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Risk" />
            <Tab icon={<PeopleIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Borrowers" />
          </Tabs>
        </Box>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<ChartsSkeleton />}>
              <TabPanel value={activeTab} index={0}>
                <GrowthChart data={growthData} />
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <RiskChart data={riskData} />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <TopBorrowersChart data={topBorrowers} />
              </TabPanel>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </Paper>
    </Box>
  );
};

Charts.propTypes = {
  loans: PropTypes.array,
  borrowers: PropTypes.array,
  payments: PropTypes.array,
  expenses: PropTypes.array,
  selectedMonth: PropTypes.string,
};

export default Charts;
