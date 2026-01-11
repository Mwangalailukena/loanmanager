import React, { useState, useMemo, useEffect } from "react";
import {
  Box, Typography, useTheme, CircularProgress, Paper, 
  Tabs, Tab, alpha
} from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import WarningAmberIcon from '@mui/icons-material/GppMaybeRounded';
import PeopleIcon from '@mui/icons-material/GroupsRounded';
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from '@nivo/line';
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

// Extend dayjs
dayjs.extend(isBetween);

// --- Constants & Themes ---
const COLORS = {
  revenue: "#4caf50",
  costs: "#f44336",
  performing: "#2196f3",
  overdue: "#ff9800",
  neutral: "#9e9e9e"
};

const getChartTheme = (theme) => ({
  axis: {
    ticks: { text: { fill: theme.palette.text.secondary, fontSize: 10 } },
    legend: { text: { fill: theme.palette.text.primary, fontSize: 12, fontWeight: 600 } },
  },
  grid: { line: { stroke: theme.palette.divider, strokeDasharray: '4 4' } },
  tooltip: {
    container: { 
      background: theme.palette.background.paper, 
      color: theme.palette.text.primary, 
      fontSize: 12, 
      borderRadius: 8, 
      boxShadow: theme.shadows[4], 
      padding: '8px 12px',
      border: `1px solid ${theme.palette.divider}`
    },
  },
});

const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'ZMW', minimumFractionDigits: 0, maximumFractionDigits: 0,
}).format(value);

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

// --- Sub-Components ---
const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

// --- Main Chart Component ---
const Charts = ({ loans, borrowers, payments, expenses, selectedMonth }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [chartStartDate, setChartStartDate] = useState(dayjs().subtract(1, 'year').format('YYYY-MM-DD'));
  const [chartEndDate, setChartEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    if (selectedMonth) {
      // If a specific month is selected, show a 6-month trend ending in that month
      setChartStartDate(dayjs(selectedMonth).subtract(5, 'month').startOf('month').format('YYYY-MM-DD'));
      setChartEndDate(dayjs(selectedMonth).endOf('month').format('YYYY-MM-DD'));
    } else {
      // If "All Time" is selected, show the last 12 months
      setChartStartDate(dayjs().subtract(11, 'month').startOf('month').format('YYYY-MM-DD'));
      setChartEndDate(dayjs().endOf('month').format('YYYY-MM-DD'));
    }
  }, [selectedMonth]);

  const isLoading = !loans || !borrowers || !payments || !expenses;

  // Data Processing
  const { growthData, riskData, topBorrowers } = useMemo(() => {
    if (isLoading) return { growthData: [], riskData: [], topBorrowers: [] };

    // 1. Growth Data (Income vs Costs)
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

    // 2. Risk Data (Performing vs Overdue)
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
  }, [loans, borrowers, payments, expenses, chartStartDate, chartEndDate, isLoading]);

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

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
            {/* --- GROWTH TAB --- */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ height: 350 }}>
                <ResponsiveLine
                  data={[
                    { id: 'Income', color: COLORS.revenue, data: growthData.map(d => ({ x: d.month, y: d.income })) },
                    { id: 'Costs', color: COLORS.costs, data: growthData.map(d => ({ x: d.month, y: d.costs })) }
                  ]}
                  margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                  xScale={{ type: 'point' }}
                  yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
                  curve="monotoneX"
                  axisTop={null}
                  axisRight={null}
                  enableArea={true}
                  areaOpacity={0.1}
                  colors={d => d.color}
                  enableGridX={false}
                  pointSize={8}
                  pointColor={{ from: 'color' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  useMesh={true}
                  theme={getChartTheme(theme)}
                  tooltip={({ point }) => (
                    <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
                      <Typography variant="caption" fontWeight="bold">{point.serieId}</Typography>
                      <Typography variant="body2">{formatCurrency(point.data.y)}</Typography>
                    </Box>
                  )}
                />
              </Box>
            </TabPanel>

            {/* --- RISK TAB --- */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ height: 350 }}>
                <ResponsiveBar
                  data={riskData}
                  keys={['Performing', 'Overdue']}
                  indexBy="month"
                  margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
                  padding={0.4}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={({ id }) => id === 'Performing' ? COLORS.performing : COLORS.overdue}
                  borderRadius={4}
                  theme={getChartTheme(theme)}
                  enableLabel={false}
                  axisTop={null}
                  axisRight={null}
                  enableGridY={true}
                  tooltip={({ id, value, indexValue }) => (
                    <Box sx={{ p: 1 }}>
                      <Typography variant="caption">{indexValue}</Typography>
                      <Typography variant="body2" fontWeight="bold" color={id === 'Performing' ? 'primary' : 'warning.main'}>
                        {id}: {formatCurrency(value)}
                      </Typography>
                    </Box>
                  )}
                />
              </Box>
            </TabPanel>

            {/* --- BORROWERS TAB --- */}
            <TabPanel value={activeTab} index={2}>
              <Box sx={{ height: 350 }}>
                <ResponsiveBar
                  data={topBorrowers}
                  keys={['value']}
                  indexBy="name"
                  layout="horizontal"
                  margin={{ top: 20, right: 30, bottom: 50, left: 100 }}
                  padding={0.3}
                  colors={alpha(theme.palette.primary.main, 0.7)}
                  borderRadius={4}
                  theme={getChartTheme(theme)}
                  enableLabel={true}
                  labelFormat={v => formatCurrency(v)}
                  labelSkipWidth={12}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{ format: v => `K${v/1000}k` }}
                />
              </Box>
            </TabPanel>
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
