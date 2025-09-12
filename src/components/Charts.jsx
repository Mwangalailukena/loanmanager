import React, { useState, useMemo } from "react";
import {
  Box, Typography, useTheme, useMediaQuery, CircularProgress, Paper, Grid,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, Slide, Card, CardContent
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from "@nivo/pie";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import PropTypes from 'prop-types';

// Extend dayjs
dayjs.extend(isBetween);

// --- Helper Functions ---
const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

// --- Nivo Theming ---
const getChartTheme = (theme, isMobile) => ({
  axis: {
    ticks: { text: { fill: theme.palette.text.secondary, fontSize: isMobile ? 9 : 11, fontFamily: theme.typography.fontFamily } },
    legend: { text: { fill: theme.palette.text.primary, fontSize: isMobile ? 11 : 14, fontWeight: 500, fontFamily: theme.typography.fontFamily } },
  },
  grid: { line: { stroke: theme.palette.divider, strokeDasharray: '2 2' } },
  tooltip: {
    container: { background: theme.palette.background.paper, color: theme.palette.text.primary, fontSize: 12, borderRadius: 8, boxShadow: theme.shadows[3], padding: '8px 12px' },
  },
  legends: { text: { fill: theme.palette.text.primary, fontSize: isMobile ? 10 : 12, fontFamily: theme.typography.fontFamily } },
});

// --- Reusable Components ---
const Transition = React.forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const KpiCard = ({ title, value, isLoading, tooltip }) => {
  const theme = useTheme();
  return (
    <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Tooltip title={tooltip}><HelpOutlineIcon sx={{ fontSize: 14, ml: 0.5, color: 'text.secondary' }} /></Tooltip>
        </Box>
        {isLoading ? <CircularProgress size={24} /> : (
          <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>{value}</Typography>
        )}
      </CardContent>
    </Card>
  );
};

const ChartPaper = ({ title, tooltip, children, onClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const chartPaperHeight = isMobile ? 300 : 350;
  return (
    <Paper
      elevation={2}
      sx={{
        p: isMobile ? 1.5 : 2.5, borderRadius: 3, height: chartPaperHeight,
        cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.3s',
        '&:hover': { boxShadow: onClick ? theme.shadows[6] : theme.shadows[2] }
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: isMobile ? '1rem' : '1.15rem' }}>{title}</Typography>
        <Tooltip title={tooltip}><IconButton size="small" sx={{ ml: 1 }}><HelpOutlineIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
      <Box sx={{ height: `calc(${chartPaperHeight}px - ${isMobile ? 60 : 70}px)` }}>{children}</Box>
    </Paper>
  );
};

const NoDataMessage = ({ message }) => (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', p: 2 }}>
      <Typography variant="body2" align="center">{message}</Typography>
    </Box>
);

// --- Main Chart Component ---
const Charts = ({ loans, borrowers, payments, expenses }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogChartConfig, setDialogChartConfig] = useState(null);

  const isLoading = !loans || !borrowers || !payments || !expenses;

  const loanStatusColors = useMemo(() => ({
    'Paid': theme.palette.success.main, 'Active': theme.palette.primary.main, 'Overdue': theme.palette.error.main,
    'Performing': theme.palette.success.main,
  }), [theme]);

  const kpiData = useMemo(() => {
     if (isLoading || !loans || loans.length === 0) return { outstandingPrincipal: 0, overduePrincipal: 0, totalProfit: 0, activeLoanCount: 0 };
     let outstandingPrincipal = 0, overduePrincipal = 0, totalDisbursed = 0, totalCollected = 0, activeLoanCount = 0;
     const today = dayjs();
     loans.forEach(loan => {
         totalDisbursed += Number(loan.principal || 0);
         totalCollected += Number(loan.repaidAmount || 0);
         const status = calcStatusAsOf(loan, today);
         if (status !== 'Paid') {
             activeLoanCount++;
             const outstanding = Number(loan.principal || 0) - Number(loan.repaidAmount || 0);
             outstandingPrincipal += outstanding;
             if (status === 'Overdue') overduePrincipal += outstanding;
         }
     });
     const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
     const totalProfit = totalCollected - totalDisbursed - totalExpenses;
     return { outstandingPrincipal, overduePrincipal, totalProfit, activeLoanCount };
  }, [loans, expenses, isLoading]);

  const profitabilityData = useMemo(() => {
    if (isLoading || !loans || loans.length === 0) return [];
    const dataByMonth = new Map();
    
    loans.forEach(loan => {
        const month = dayjs(loan.startDate).format('YYYY-MM');
        const monthData = dataByMonth.get(month) || { revenue: 0, costs: 0 };
        monthData.costs += Number(loan.principal || 0); dataByMonth.set(month, monthData);
    });

    payments.forEach(payment => {
        // CHANGED: Robustly handle both Firestore Timestamps and date strings
        const dateToParse = payment.date?.toDate ? payment.date.toDate() : payment.date;
        const month = dayjs(dateToParse).format('YYYY-MM');
        const monthData = dataByMonth.get(month) || { revenue: 0, costs: 0 };
        monthData.revenue += Number(payment.amount || 0); dataByMonth.set(month, monthData);
    });

    expenses.forEach(expense => {
        const month = dayjs(expense.date).format('YYYY-MM');
        const monthData = dataByMonth.get(month) || { revenue: 0, costs: 0 };
        monthData.costs += Number(expense.amount || 0); dataByMonth.set(month, monthData);
    });
    return Array.from(dataByMonth.entries()).map(([month, data]) => ({ month, ...data, net: data.revenue - data.costs })).sort((a, b) => dayjs(a.month).diff(dayjs(b.month)));
  }, [loans, payments, expenses, isLoading]);

  const portfolioHealthData = useMemo(() => {
    if (isLoading || !loans || loans.length === 0) return [];
    const firstLoanDate = dayjs(Math.min(...loans.map(l => dayjs(l.startDate).valueOf())));
    const data = []; let currentMonth = firstLoanDate.startOf('month');
    while (currentMonth.isBefore(dayjs().endOf('month'))) {
        let performingValue = 0, overdueValue = 0;
        // eslint-disable-next-line no-loop-func
        loans.forEach(loan => {
            if (dayjs(loan.startDate).isAfter(currentMonth.endOf('month'))) return;
            const status = calcStatusAsOf(loan, currentMonth.endOf('month'));
            const outstanding = Number(loan.principal || 0) - Number(loan.repaidAmount || 0);
            if (outstanding > 0.01) {
                if (status === 'Overdue') overdueValue += outstanding;
                else if (status === 'Active') performingValue += outstanding;
            }
        });
        data.push({ x: currentMonth.format('YYYY-MM-DD'), Performing: performingValue, Overdue: overdueValue });
        currentMonth = currentMonth.add(1, 'month');
    }
    return [{ id: 'Performing', data: data.map(d => ({ x: d.x, y: d.Performing })) }, { id: 'Overdue', data: data.map(d => ({ x: d.x, y: d.Overdue })) }];
  }, [loans, isLoading]);

  const { activeLoanStatusData, topBorrowersData } = useMemo(() => {
    if (isLoading || !loans || loans.length === 0) return { activeLoanStatusData: [], topBorrowersData: [] };
    const today = dayjs(); const activeLoans = loans.filter(loan => calcStatusAsOf(loan, today) !== 'Paid');
    const statusCounts = { 'Active': 0, 'Overdue': 0 };
    activeLoans.forEach(loan => { const status = calcStatusAsOf(loan, today); if (status in statusCounts) statusCounts[status]++; });
    const activeLoanStatusData = Object.entries(statusCounts).map(([id, value]) => ({ id, label: id, value }));
    const borrowerBalances = new Map();
    activeLoans.forEach(loan => {
        const outstanding = Number(loan.principal || 0) - Number(loan.repaidAmount || 0);
        borrowerBalances.set(loan.borrowerId, (borrowerBalances.get(loan.borrowerId) || 0) + outstanding);
    });
    const topBorrowersData = Array.from(borrowerBalances.entries()).map(([borrowerId, balance]) => ({ borrowerName: borrowers.find(b => b.id === borrowerId)?.name || 'Unknown', balance })).sort((a, b) => b.balance - a.balance).slice(0, 5).reverse();
    return { activeLoanStatusData, topBorrowersData };
  }, [loans, borrowers, isLoading]);

  const handleOpenDialog = (config) => { setDialogChartConfig(config); setOpenDialog(true); };
  const handleCloseDialog = () => { setOpenDialog(false); setDialogChartConfig(null); };

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><CircularProgress /></Box>;
  if (!loans || loans.length === 0) return <NoDataMessage message="No loan data available to generate charts." />;
  
  const nivoTheme = getChartTheme(theme, isMobile);
  const nivoThemeDialog = getChartTheme(theme, false);

  const renderDialogChart = () => {
    if (!dialogChartConfig) return null;
    const { type, data } = dialogChartConfig;
    switch (type) {
      case 'profitability':
        return <ResponsiveBar data={data} keys={['revenue', 'costs', 'net']} indexBy="month" margin={{ top: 40, right: 80, bottom: 60, left: 70 }} theme={nivoThemeDialog} colors={({ id }) => id === 'costs' ? theme.palette.error.light : (id === 'revenue' ? theme.palette.success.light : theme.palette.info.main)} axisBottom={{ format: value => dayjs(value).format('MMM YY'), legend: 'Month', legendPosition: 'middle', legendOffset: 50 }} axisLeft={{ legend: 'Amount (ZMW)', legendPosition: 'middle', legendOffset: -60 }} legends={[{ dataFrom: 'keys', anchor: 'bottom-right', direction: 'column', translateX: 70, itemWidth: 60, itemHeight: 20, symbolSize: 12 }]} />;
      case 'health':
        return <ResponsiveLine data={data} enableArea={true} areaOpacity={0.3} useMesh={true} margin={{ top: 40, right: 80, bottom: 60, left: 70 }} theme={nivoThemeDialog} colors={({ id }) => loanStatusColors[id]} xScale={{ type: 'time', format: '%Y-%m-%d', useUTC: false }} xFormat="time:%b %Y" axisBottom={{ format: '%b %y', tickValues: 'every 3 months', legend: 'Date', legendPosition: 'middle', legendOffset: 50 }} axisLeft={{ legend: 'Outstanding Principal', legendPosition: 'middle', legendOffset: -60 }} legends={[{ anchor: 'bottom-right', direction: 'column', translateX: 70, itemWidth: 60, itemHeight: 20, symbolSize: 12 }]} />;
      case 'status':
        return <ResponsivePie data={data} margin={{ top: 40, right: 80, bottom: 80, left: 80 }} innerRadius={0.5} padAngle={2} cornerRadius={3} activeOuterRadiusOffset={8} colors={({ id }) => loanStatusColors[id]} theme={nivoThemeDialog} arcLinkLabelsSkipAngle={10} arcLabelsSkipAngle={10} legends={[{ anchor: 'bottom', direction: 'row', justify: false, translateY: 60, itemsSpacing: 20, itemWidth: 80, itemHeight: 18, symbolSize: 14 }]} />;
      case 'topBorrowers':
         return <ResponsiveBar data={data} keys={['balance']} indexBy="borrowerName" layout="horizontal" margin={{ top: 40, right: 40, bottom: 60, left: 120 }} theme={nivoThemeDialog} colors={theme.palette.secondary.main} labelFormat={d => formatCurrency(d)} axisLeft={{ tickSize: 0, tickPadding: 10 }} axisBottom={{ legend: 'Outstanding Balance (ZMW)', legendPosition: 'middle', legendOffset: 50, format: d => formatCurrency(d) }} enableGridY={false} />;
      default: return null;
    }
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 700, mb: 3 }}>Portfolio Dashboard</Typography>
      
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: isMobile ? 3 : 4 }}>
        <Grid item xs={6} md={3}><KpiCard title="Total Outstanding" value={formatCurrency(kpiData.outstandingPrincipal)} isLoading={isLoading} tooltip="The total principal amount currently owed by all borrowers across all active loans." /></Grid>
        <Grid item xs={6} md={3}><KpiCard title="Principal Overdue" value={formatCurrency(kpiData.overduePrincipal)} isLoading={isLoading} tooltip="The portion of the total outstanding principal that belongs to loans currently marked as 'Overdue'."/></Grid>
        <Grid item xs={6} md={3}><KpiCard title="Active Loans" value={kpiData.activeLoanCount} isLoading={isLoading} tooltip="The total number of loans that are not fully paid off yet."/></Grid>
        <Grid item xs={6} md={3}><KpiCard title="All-Time Net Profit" value={formatCurrency(kpiData.totalProfit)} isLoading={isLoading} tooltip="Total Collected minus Total Disbursed and Total Expenses over the lifetime of the portfolio."/></Grid>
      </Grid>

      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={6}>
            <ChartPaper title="Profitability Analysis" tooltip="Shows monthly revenue (collections), costs (disbursements + expenses), and net profit." onClick={() => handleOpenDialog({ type: 'profitability', data: profitabilityData, title: 'Profitability Analysis' })}>
                {profitabilityData.length > 0 ? <ResponsiveBar data={profitabilityData} keys={['revenue', 'costs']} indexBy="month" margin={{ top: 10, right: 80, bottom: 50, left: 60 }} theme={nivoTheme} colors={({ id }) => id === 'costs' ? theme.palette.error.light : theme.palette.success.light} axisBottom={{ format: value => dayjs(value).format('MMM YY'), legend: 'Month', legendPosition: 'middle', legendOffset: 40 }} axisLeft={{ legend: 'Amount', legendPosition: 'middle', legendOffset: -50 }} legends={[{ dataFrom: 'keys', anchor: 'bottom-right', direction: 'column', translateX: 70, itemWidth: 60, itemHeight: 20, symbolSize: 12 }]} enableLabel={false} /> : <NoDataMessage message="Not enough data for profitability analysis." />}
            </ChartPaper>
        </Grid>
        <Grid item xs={12} md={6}>
            <ChartPaper title="Portfolio Health Over Time" tooltip="Shows the total monetary value of the portfolio, split into performing (active) and overdue principal each month." onClick={() => handleOpenDialog({ type: 'health', data: portfolioHealthData, title: 'Portfolio Health Over Time' })}>
                {portfolioHealthData[0]?.data.length > 0 ? <ResponsiveLine data={portfolioHealthData} enableArea={true} areaOpacity={0.3} useMesh={true} margin={{ top: 10, right: 80, bottom: 50, left: 60 }} theme={nivoTheme} colors={({ id }) => loanStatusColors[id]} xScale={{ type: 'time', format: '%Y-%m-%d', useUTC: false }} xFormat="time:%b %Y" axisBottom={{ format: '%b %y', tickValues: 'every 3 months', legend: 'Date', legendPosition: 'middle', legendOffset: 40 }} axisLeft={{ legend: 'Principal', legendPosition: 'middle', legendOffset: -50 }} legends={[{ anchor: 'bottom-right', direction: 'column', translateX: 70, itemWidth: 60, itemHeight: 20, symbolSize: 12 }]} /> : <NoDataMessage message="Not enough data to show portfolio health trend." />}
            </ChartPaper>
        </Grid>
        <Grid item xs={12} md={6}>
            <ChartPaper title="Active Loan Status" tooltip="The number of currently active loans, categorized by their status." onClick={() => handleOpenDialog({ type: 'status', data: activeLoanStatusData, title: 'Active Loan Status' })}>
                {activeLoanStatusData.some(d => d.value > 0) ? <ResponsivePie data={activeLoanStatusData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }} innerRadius={0.5} padAngle={2} cornerRadius={3} activeOuterRadiusOffset={8} colors={({ id }) => loanStatusColors[id]} theme={nivoTheme} arcLinkLabelsSkipAngle={10} arcLabelsSkipAngle={10} legends={[{ anchor: 'bottom', direction: 'row', justify: false, translateY: 45, itemsSpacing: 20, itemWidth: 80, itemHeight: 18, symbolSize: 14 }]} /> : <NoDataMessage message="No active loans to display." />}
            </ChartPaper>
        </Grid>
        <Grid item xs={12} md={6}>
            <ChartPaper title="Top 5 Borrowers by Balance" tooltip="The top 5 borrowers with the highest outstanding principal balance across all their active loans." onClick={() => handleOpenDialog({ type: 'topBorrowers', data: topBorrowersData, title: 'Top 5 Borrowers by Balance' })}>
                {topBorrowersData.length > 0 ? <ResponsiveBar data={topBorrowersData} keys={['balance']} indexBy="borrowerName" layout="horizontal" margin={{ top: 10, right: 20, bottom: 50, left: 100 }} theme={nivoTheme} colors={theme.palette.secondary.main} labelFormat={d => formatCurrency(d)} axisLeft={{ tickSize: 0, tickPadding: 10 }} axisBottom={{ legend: 'Balance', legendPosition: 'middle', legendOffset: 40, format: d => '' }} enableGridY={false} tooltipLabel={d=>d.indexValue} valueFormat={value => formatCurrency(value)} /> : <NoDataMessage message="No active borrowers with outstanding balances." />}
            </ChartPaper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth TransitionComponent={Transition} sx={{ '& .MuiDialog-paper': { height: '85vh', maxHeight: '85vh', p: isMobile ? 1 : 2 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pr: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{dialogChartConfig?.title}</Typography>
          <IconButton aria-label="close" onClick={handleCloseDialog}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ flexGrow: 1, p: 0, '& > div': { height: '100%', width: '100%' } }}>
          {renderDialogChart()}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

Charts.propTypes = {
  loans: PropTypes.array,
  borrowers: PropTypes.array,
  payments: PropTypes.array,
  expenses: PropTypes.array,
};

Charts.defaultProps = {
  loans: [],
  borrowers: [],
  payments: [],
  expenses: [],
};

export default Charts;
