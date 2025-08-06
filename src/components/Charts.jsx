import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Slide,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import PropTypes from 'prop-types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

dayjs.extend(isBetween);

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const calcStatus = (loan) => {
  if (loan.repaidAmount >= loan.principal) {
    return 'Paid';
  }

  const today = dayjs();
  if (!loan.repaymentSchedule || loan.repaymentSchedule.length === 0) {
    return 'Active';
  }

  const sortedSchedule = [...loan.repaymentSchedule].sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());

  for (const item of sortedSchedule) {
    const paymentDate = dayjs(item.date);
    if (paymentDate.isBefore(today, 'day') && item.repaidAmount < item.amount) {
      return 'Overdue';
    }
  }

  return 'Active';
};

const getChartTheme = (theme, isMobile) => ({
  axis: {
    ticks: { text: { fill: theme.palette.text.secondary, fontSize: isMobile ? 8 : 10, fontFamily: theme.typography.fontFamily } },
    legend: { text: { fill: theme.palette.text.primary, fontSize: isMobile ? 10 : 14, fontWeight: 500, fontFamily: theme.typography.fontFamily } },
  },
  grid: { line: { stroke: theme.palette.divider, strokeDasharray: '2 2' } },
  tooltip: {
    container: {
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
      fontSize: 12,
      borderRadius: 8,
      boxShadow: theme.shadows[3],
      padding: '8px 12px',
    },
  },
  legends: { text: { fill: theme.palette.text.primary, fontSize: isMobile ? 10 : 12, fontFamily: theme.typography.fontFamily } },
});

const getNivoChartProps = (chartType, isMobile, isDialog, theme, loanStatusColors, nivoColors) => {
  const commonTheme = getChartTheme(theme, isMobile);

  const getMargin = (isMobile, isDialog) => {
    if (isDialog) return { top: 40, right: 120, bottom: 80, left: 80 };
    return isMobile ? { top: 20, right: 10, bottom: 50, left: 35 } : { top: 20, right: 60, bottom: 60, left: 60 };
  };

  const margin = getMargin(isMobile, isDialog);

  switch (chartType) {
    case 'line':
      return {
        margin,
        theme: commonTheme,
        colors: nivoColors,
        xScale: { type: 'time', format: '%Y-%m-%d', useUTC: false, precision: 'month' },
        xFormat: "time:%Y-%m-%d",
        yScale: { type: 'linear', min: 0, max: 'auto', stacked: false, reverse: false },
        yFormat: " >-,.0f",
        axisBottom: {
          format: '%b %y',
          tickValues: 'every 3 months',
          legend: 'Date',
          legendOffset: isDialog ? 50 : (isMobile ? 40 : 35),
          legendPosition: 'middle',
          tickRotation: isMobile && !isDialog ? 45 : 0,
        },
        axisLeft: {
          legend: 'ZMW',
          legendOffset: isDialog ? -70 : (isMobile ? -35 : -50),
          legendPosition: 'middle',
        },
        pointSize: isDialog ? 8 : 4,
        pointBorderWidth: isDialog ? 2 : 1,
        pointBorderColor: { from: 'serieColor' },
        legends: [
          {
            anchor: isDialog ? 'bottom-right' : 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: isDialog ? 100 : 80,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: 'left-to-right',
            itemWidth: isDialog ? 100 : 70,
            itemHeight: isDialog ? 20 : 16,
            symbolSize: isDialog ? 12 : 8,
            symbolShape: 'circle',
            effects: [{ on: 'hover', style: { itemBackground: 'rgba(0, 0, 0, .03)', itemOpacity: 1 } }],
          },
        ],
      };
    case 'pie':
      return {
        margin,
        theme: commonTheme,
        innerRadius: 0.5,
        padAngle: 0.7,
        cornerRadius: 3,
        activeOuterRadiusOffset: 8,
        borderWidth: 1,
        borderColor: { from: 'color', modifiers: [['darker', 0.2]] },
        arcLinkLabelsSkipAngle: 10,
        arcLinkLabelsTextColor: theme.palette.text.primary,
        arcLinkLabelsThickness: 2,
        arcLinkLabelsColor: { from: 'color' },
        arcLabelsSkipAngle: 10,
        arcLabelsTextColor: { from: 'color', modifiers: [['darker', 2]] },
        legends: isMobile ? [] : [
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: isDialog ? 60 : 30,
            itemsSpacing: isMobile ? 5 : 10,
            itemWidth: isDialog ? 100 : 70,
            itemHeight: isDialog ? 20 : 14,
            itemTextColor: theme.palette.text.primary,
            symbolSize: isDialog ? 20 : 12,
            symbolShape: 'circle',
          },
        ],
      };
    case 'bar':
      return {
        margin,
        theme: commonTheme,
        padding: 0.3,
        valueScale: { type: 'linear' },
        indexScale: { type: 'band', round: true },
        colors: nivoColors[0],
        borderColor: { from: 'color', modifiers: [['darker', 1.6]] },
        axisTop: null,
        axisRight: null,
        axisBottom: {
          tickSize: 5,
          tickPadding: 5,
          tickRotation: isMobile && !isDialog ? 45 : 0,
          legend: 'Amount Range',
          legendPosition: 'middle',
          legendOffset: isDialog ? 50 : (isMobile ? 45 : 35),
        },
        axisLeft: {
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Loans',
          legendPosition: 'middle',
          legendOffset: isDialog ? -70 : (isMobile ? -35 : -50),
        },
        labelSkipWidth: 12,
        labelSkipHeight: 12,
        labelTextColor: { from: 'color', modifiers: [['darker', 1.6]] },
        legends: [],
      };
    case 'stackedBar':
      return {
        margin,
        theme: commonTheme,
        padding: 0.3,
        groupMode: "stacked",
        valueScale: { type: 'linear' },
        indexScale: { type: 'band', round: true },
        borderColor: { from: 'color', modifiers: [['darker', 1.6]] },
        axisTop: null,
        axisRight: null,
        axisBottom: {
          tickSize: 5,
          tickPadding: 5,
          tickRotation: isMobile && !isDialog ? 45 : 0,
          legend: 'Month',
          legendPosition: 'middle',
          legendOffset: isDialog ? 50 : (isMobile ? 45 : 35),
          format: value => dayjs(value).format('MMM YY'),
        },
        axisLeft: {
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Loans',
          legendPosition: 'middle',
          legendOffset: isDialog ? -70 : (isMobile ? -35 : -50),
        },
        labelSkipWidth: 12,
        labelSkipHeight: 12,
        labelTextColor: { from: 'color', modifiers: [['darker', 1.6]] },
        legends: [
          {
            dataFrom: 'keys',
            anchor: isDialog ? 'bottom-right' : 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: isDialog ? 100 : 80,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: isDialog ? 90 : 80,
            itemHeight: isDialog ? 20 : 18,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: isDialog ? 20 : 16,
            data: ['Active', 'Paid', 'Overdue'].map(id => ({
              id: id,
              label: id,
              color: loanStatusColors[id]
            })),
            effects: [{ on: 'hover', style: { itemOpacity: 1 } }]
          }
        ]
      };
    default:
      return {};
  }
};

const Charts = ({ loans, selectedMonth }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(selectedMonth);

  // Adjusted height for desktop
  const chartPaperHeight = isMobile ? 250 : 300;
  const chartInnerHeight = `calc(${chartPaperHeight}px - ${isMobile ? 55 : 60}px)`;

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogChartConfig, setDialogChartConfig] = useState(null);

  const loanStatusColors = useMemo(() => ({
    'Paid': theme.palette.success.main,
    'Active': theme.palette.primary.main,
    'Overdue': theme.palette.error.main,
  }), [theme]);

  const nivoColors = useMemo(() => [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ], [theme]);

  const handlePreviousMonth = () => {
    const prevMonth = dayjs(currentDisplayMonth).subtract(1, 'month').format('YYYY-MM');
    setCurrentDisplayMonth(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = dayjs(currentDisplayMonth).add(1, 'month').format('YYYY-MM');
    setCurrentDisplayMonth(nextMonth);
  };

  const handleOpenDialog = (type, data, title, keys = [], indexBy = null) => {
    setDialogChartConfig({ type, data, title, keys, indexBy });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogChartConfig(null);
  };

  const calculatedLoans = useMemo(() => {
    if (!loans) return [];
    return loans.map(loan => ({
      ...loan,
      calculatedStatus: calcStatus(loan)
    }));
  }, [loans]);

  const latestDataMonth = useMemo(() => {
    if (!calculatedLoans || calculatedLoans.length === 0) return null;
    const sortedLoanDates = calculatedLoans
      .map(loan => dayjs(loan.startDate).startOf('month'))
      .sort((a, b) => b.diff(a));
    return sortedLoanDates.length > 0 ? sortedLoanDates[0].format('YYYY-MM') : null;
  }, [calculatedLoans]);

  useEffect(() => {
    const initialMonthFormatted = dayjs(selectedMonth).format('YYYY-MM');
    const hasDataForInitialMonth = calculatedLoans.some(loan =>
      dayjs(loan.startDate).format('YYYY-MM') === initialMonthFormatted
    );

    if (hasDataForInitialMonth) {
      setCurrentDisplayMonth(initialMonthFormatted);
    } else if (latestDataMonth) {
      setCurrentDisplayMonth(latestDataMonth);
    } else {
      setCurrentDisplayMonth(initialMonthFormatted);
    }
  }, [selectedMonth, calculatedLoans, latestDataMonth]);

  const filteredLoansThisMonth = useMemo(() => {
    if (!calculatedLoans || calculatedLoans.length === 0) return [];
    return calculatedLoans.filter(loan =>
      dayjs(loan.startDate).format('YYYY-MM') === currentDisplayMonth
    );
  }, [calculatedLoans, currentDisplayMonth]);

  const monthlySummaryData = useMemo(() => {
    if (!calculatedLoans || calculatedLoans.length === 0) return [];
    const monthlyMap = new Map();
    calculatedLoans.forEach(loan => {
      const monthYear = dayjs(loan.startDate).format('YYYY-MM-DD');
      if (!monthlyMap.has(monthYear)) {
        monthlyMap.set(monthYear, { disbursed: 0, collected: 0 });
      }
      const data = monthlyMap.get(monthYear);
      data.disbursed += Number(loan.principal || 0);
      data.collected += Number(loan.repaidAmount || 0);
    });
    const sortedData = Array.from(monthlyMap.entries())
      .map(([date, values]) => ({ x: date, ...values }))
      .sort((a, b) => dayjs(a.x).diff(dayjs(b.x)));
    return [
      { id: 'Disbursed', data: sortedData.map(d => ({ x: d.x, y: d.disbursed })) },
      { id: 'Collected', data: sortedData.map(d => ({ x: d.x, y: d.collected })) },
    ];
  }, [calculatedLoans]);
  const hasMonthlySummaryData = useMemo(() => monthlySummaryData.some(series => series.data.length > 0), [monthlySummaryData]);

  const loanStatusData = useMemo(() => {
    const statusCounts = { 'Active': 0, 'Paid': 0, 'Overdue': 0 };

    if (filteredLoansThisMonth && filteredLoansThisMonth.length > 0) {
      filteredLoansThisMonth.forEach(loan => {
        const statusName = loan.calculatedStatus;
        if (Object.keys(statusCounts).includes(statusName)) {
          statusCounts[statusName] += 1;
        }
      });
    }

    return Object.keys(statusCounts).map(status => ({
      id: status,
      label: status,
      value: statusCounts[status],
    }));
  }, [filteredLoansThisMonth]);

  const loanAmountDistributionData = useMemo(() => {
    if (!filteredLoansThisMonth || filteredLoansThisMonth.length === 0) return [];
    const bins = { '0-500': 0, '501-1000': 0, '1001-2000': 0, '2001-5000': 0, '5000+': 0 };
    filteredLoansThisMonth.forEach(loan => {
      const principal = Number(loan.principal || 0);
      if (principal <= 500) bins['0-500']++;
      else if (principal <= 1000) bins['501-1000']++;
      else if (principal <= 2000) bins['1001-2000']++;
      else if (principal <= 5000) bins['2001-5000']++;
      else bins['5000+']++;
    });
    return Object.keys(bins).map(range => ({ range, count: bins[range] }));
  }, [filteredLoansThisMonth]);

  const loanStatusCountOverTimeData = useMemo(() => {
    if (!calculatedLoans || calculatedLoans.length === 0) return [];
    const monthlyStatusMap = new Map();
    calculatedLoans.forEach(loan => {
      const monthKey = dayjs(loan.startDate).format('YYYY-MM');
      if (!monthlyStatusMap.has(monthKey)) {
        monthlyStatusMap.set(monthKey, { month: monthKey, Active: 0, Paid: 0, Overdue: 0 });
      }
      const data = monthlyStatusMap.get(monthKey);
      const status = loan.calculatedStatus;
      if (['Active', 'Paid', 'Overdue'].includes(status)) {
        data[status]++;
      }
    });
    return Array.from(monthlyStatusMap.values()).sort((a, b) => dayjs(a.month).diff(dayjs(b.month)));
  }, [calculatedLoans]);

  if (loans === undefined || loans === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: chartPaperHeight, p: 2 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading loan data...</Typography>
      </Box>
    );
  }

  if (loans.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: theme.palette.text.secondary }}>
        <Typography variant="body1">No loan data available.</Typography>
      </Box>
    );
  }

  const NoDataMessage = ({ height, message }) => (
    <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.text.secondary, p: 2 }}>
      <Typography variant="body2" align="center">{message}</Typography>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3, pt: 1 }}>
        <IconButton onClick={handlePreviousMonth} aria-label="Previous month">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          {dayjs(currentDisplayMonth).format('MMMM YYYY')} Data
        </Typography>
        <IconButton onClick={handleNextMonth} aria-label="Next month">
          <ArrowForwardIcon />
        </IconButton>
      </Box>

      <Grid container spacing={isMobile ? 1.5 : 2}>
        {/* Chart 1: Monthly Disbursements & Collections (Line Chart) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: isMobile ? 1.5 : 2, borderRadius: 2, height: chartPaperHeight, cursor: 'pointer', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}
            onClick={() => handleOpenDialog('line', monthlySummaryData, 'Monthly Disbursements & Collections')}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: isMobile ? '1rem' : '1.15rem' }}>
                Monthly Disbursements & Collections
              </Typography>
              <Tooltip title="Shows the total amount of loans disbursed versus the total amount collected each month across all available data.">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {hasMonthlySummaryData ? (
              <Box sx={{ height: chartInnerHeight }}>
                <ResponsiveLine
                  data={monthlySummaryData}
                  ariaLabel="Monthly Disbursements and Collections Line Chart"
                  {...getNivoChartProps('line', isMobile, false, theme, null, nivoColors)}
                />
              </Box>
            ) : (
              <NoDataMessage height={chartInnerHeight} message="No data available for this period." />
            )}
          </Paper>
        </Grid>

        {/* Chart 2: Loan Status Distribution (Pie Chart) for selected month */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: isMobile ? 1.5 : 2, borderRadius: 2, height: chartPaperHeight, cursor: 'pointer', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}
            onClick={() => handleOpenDialog('pie', loanStatusData, 'Loan Status Distribution')}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: isMobile ? '1rem' : '1.15rem' }}>
                Loan Status Distribution
              </Typography>
              <Tooltip title={`Shows the distribution of loan statuses for ${dayjs(currentDisplayMonth).format('MMMM YYYY')}.`}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {loanStatusData.length > 0 && loanStatusData.some(d => d.value > 0) ? (
              <Box sx={{ height: chartInnerHeight }}>
                <ResponsivePie
                  data={loanStatusData}
                  colors={({ id }) => loanStatusColors[id]}
                  ariaLabel="Loan Status Distribution Pie Chart"
                  {...getNivoChartProps('pie', isMobile, false, theme, null, null)}
                />
              </Box>
            ) : (
              <NoDataMessage height={chartInnerHeight} message="No loan status data for this period." />
            )}
          </Paper>
        </Grid>

        {/* Chart 3: Loan Amount Distribution (Bar Chart) for selected month */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: isMobile ? 1.5 : 2, borderRadius: 2, height: chartPaperHeight, cursor: 'pointer', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}
            onClick={() => handleOpenDialog('bar', loanAmountDistributionData, 'Loan Amount Distribution', ['count'], 'range')}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: isMobile ? '1rem' : '1.15rem' }}>
                Loan Amount Distribution
              </Typography>
              <Tooltip title={`Displays the number of loans within different principal amount ranges for ${dayjs(currentDisplayMonth).format('MMMM YYYY')}.`}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {loanAmountDistributionData.length > 0 && loanAmountDistributionData.some(d => d.count > 0) ? (
              <Box sx={{ height: chartInnerHeight }}>
                <ResponsiveBar
                  data={loanAmountDistributionData}
                  keys={['count']}
                  indexBy="range"
                  ariaLabel="Loan Amount Distribution Bar Chart"
                  {...getNivoChartProps('bar', isMobile, false, theme, null, nivoColors)}
                />
              </Box>
            ) : (
              <NoDataMessage height={chartInnerHeight} message="No loan amount data for this period." />
            )}
          </Paper>
        </Grid>

        {/* Chart 4: Loan Status Count Over Time (Stacked Bar Chart) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: isMobile ? 1.5 : 2, borderRadius: 2, height: chartPaperHeight, cursor: 'pointer', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: theme.shadows[4] } }}
            onClick={() => handleOpenDialog('stackedBar', loanStatusCountOverTimeData, 'Loan Status Count Over Time', ['Active', 'Paid', 'Overdue'], 'month')}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: isMobile ? '1rem' : '1.15rem' }}>
                Loan Status Count Over Time
              </Typography>
              <Tooltip title="Tracks the number of loans in different statuses (Active, Paid, Overdue) for each month across all available data.">
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {loanStatusCountOverTimeData.length > 0 && loanStatusCountOverTimeData.some(d => d.Active > 0 || d.Paid > 0 || d.Overdue > 0) ? (
              <Box sx={{ height: chartInnerHeight }}>
                <ResponsiveBar
                  data={loanStatusCountOverTimeData}
                  keys={['Active', 'Paid', 'Overdue']}
                  indexBy="month"
                  colors={({ id }) => loanStatusColors[id]}
                  ariaLabel="Loan Status Count Over Time Stacked Bar Chart"
                  {...getNivoChartProps('stackedBar', isMobile, false, theme, loanStatusColors, null)}
                />
              </Box>
            ) : (
              <NoDataMessage height={chartInnerHeight} message="No historical loan status data available." />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        TransitionComponent={Transition}
        sx={{ '& .MuiDialog-paper': { height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column', p: isMobile ? 1 : 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pr: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {dialogChartConfig?.title}
          </Typography>
          <IconButton aria-label="close" onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ flexGrow: 1, p: 0 }}>
          {dialogChartConfig && dialogChartConfig.type === 'line' && hasMonthlySummaryData && (
            <Box sx={{ height: '100%' }}>
              <ResponsiveLine
                data={dialogChartConfig.data}
                ariaLabel="Monthly Disbursements and Collections Line Chart"
                {...getNivoChartProps('line', isMobile, true, theme, null, nivoColors)}
              />
            </Box>
          )}
          {dialogChartConfig && dialogChartConfig.type === 'pie' && loanStatusData.length > 0 && loanStatusData.some(d => d.value > 0) && (
            <Box sx={{ height: '100%' }}>
              <ResponsivePie
                data={dialogChartConfig.data}
                colors={({ id }) => loanStatusColors[id]}
                ariaLabel="Loan Status Distribution Pie Chart"
                {...getNivoChartProps('pie', isMobile, true, theme, null, null)}
              />
            </Box>
          )}
          {dialogChartConfig && dialogChartConfig.type === 'bar' && loanAmountDistributionData.length > 0 && loanAmountDistributionData.some(d => d.count > 0) && (
            <Box sx={{ height: '100%' }}>
              <ResponsiveBar
                data={dialogChartConfig.data}
                keys={dialogChartConfig.keys}
                indexBy={dialogChartConfig.indexBy}
                ariaLabel="Loan Amount Distribution Bar Chart"
                {...getNivoChartProps('bar', isMobile, true, theme, null, nivoColors)}
              />
            </Box>
          )}
          {dialogChartConfig && dialogChartConfig.type === 'stackedBar' && loanStatusCountOverTimeData.length > 0 && loanStatusCountOverTimeData.some(d => d.Active > 0 || d.Paid > 0 || d.Overdue > 0) && (
            <Box sx={{ height: '100%' }}>
              <ResponsiveBar
                data={dialogChartConfig.data}
                keys={dialogChartConfig.keys}
                indexBy={dialogChartConfig.indexBy}
                colors={({ id }) => loanStatusColors[id]}
                ariaLabel="Loan Status Count Over Time Stacked Bar Chart"
                {...getNivoChartProps('stackedBar', isMobile, true, theme, loanStatusColors, null)}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

Charts.propTypes = {
  loans: PropTypes.arrayOf(PropTypes.shape({
    startDate: PropTypes.string.isRequired,
    principal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    repaidAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    repaymentSchedule: PropTypes.arrayOf(PropTypes.shape({
      amount: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
      repaidAmount: PropTypes.number.isRequired,
    })),
  })),
  selectedMonth: PropTypes.string.isRequired,
};

export default Charts;
