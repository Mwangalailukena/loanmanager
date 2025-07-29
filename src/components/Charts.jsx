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
import PropTypes from 'prop-types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// Corrected import path for ArrowForwardIcon
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Define a transition for the Dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Charts = ({ loans, selectedMonth }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(selectedMonth);

  // Define a consistent height for all chart containers
  const chartPaperHeight = 250;
  // Calculate inner box height based on paper height and title/tooltip area
  const chartInnerHeight = `calc(${chartPaperHeight}px - ${isMobile ? 55 : 60}px)`;

  // State for the chart dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogChartConfig, setDialogChartConfig] = useState(null); // { type, data, title, keys, indexBy }

  // Define a consistent color palette for loan statuses - MEMOIZED
  const loanStatusColors = useMemo(() => ({
    'Paid': theme.palette.success.main,    // Green for Paid
    'Active': theme.palette.primary.main,  // Primary/Blue for Active
    'Overdue': theme.palette.error.main,   // Red for Overdue
  }), [theme]);

  // General Nivo colors for charts that don't use specific loan statuses - MEMOIZED
  const nivoColors = useMemo(() => [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.secondary.main,
    theme.palette.text.secondary,
  ], [theme]);

  const handlePreviousMonth = () => {
    const prevMonth = dayjs(currentDisplayMonth).subtract(1, 'month').format('YYYY-MM');
    setCurrentDisplayMonth(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = dayjs(currentDisplayMonth).add(1, 'month').format('YYYY-MM');
    setCurrentDisplayMonth(nextMonth);
  };

  // Function to open the dialog with specific chart data
  const handleOpenDialog = (type, data, title, keys = [], indexBy = null) => {
    setDialogChartConfig({ type, data, title, keys, indexBy });
    setOpenDialog(true);
  };

  // Function to close the dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogChartConfig(null);
  };

  // --- Data Transformation for Charts ---

  // New useMemo to find the latest month with loan data
  const latestDataMonth = useMemo(() => {
    if (!loans || loans.length === 0) return null;
    const sortedLoanDates = loans
      .map(loan => dayjs(loan.startDate).startOf('month'))
      .sort((a, b) => b.diff(a)); // Sort descending to get latest first
    return sortedLoanDates.length > 0 ? sortedLoanDates[0].format('YYYY-MM') : null;
  }, [loans]);

  // Effect to set currentDisplayMonth, preferring selectedMonth if data exists, otherwise latestDataMonth
  useEffect(() => {
    const initialMonthFormatted = dayjs(selectedMonth).format('YYYY-MM');

    // Check if the initial selectedMonth has any loan data
    const hasDataForInitialMonth = loans.some(loan =>
      dayjs(loan.startDate).format('YYYY-MM') === initialMonthFormatted
    );

    if (hasDataForInitialMonth) {
      setCurrentDisplayMonth(initialMonthFormatted);
    } else if (latestDataMonth) {
      setCurrentDisplayMonth(latestDataMonth); // Fallback to the latest month with data
    } else {
      setCurrentDisplayMonth(initialMonthFormatted); // No data, stick to initial month or default
    }
  }, [selectedMonth, loans, latestDataMonth]);

  // MEMOIZED: Filter loans for the current display month once
  const filteredLoansThisMonth = useMemo(() => {
    if (!loans || loans.length === 0) return [];
    return loans.filter(loan =>
      dayjs(loan.startDate).format('YYYY-MM') === currentDisplayMonth
    );
  }, [loans, currentDisplayMonth]);

  // 1. Data for Monthly Disbursed vs. Collected (Line Chart)
  const monthlySummaryData = useMemo(() => {
    if (!loans || loans.length === 0) return []; // Use full 'loans' for historical data

    const monthlyMap = new Map();

    loans.forEach(loan => {
      const monthYear = dayjs(loan.startDate).format('YYYY-MM-DD');
      if (!monthlyMap.has(monthYear)) {
        monthlyMap.set(monthYear, {
          disbursed: 0,
          collected: 0,
        });
      }
      const data = monthlyMap.get(monthYear);
      data.disbursed += Number(loan.principal || 0);
      data.collected += Number(loan.repaidAmount || 0);
    });

    const sortedData = Array.from(monthlyMap.entries())
      .map(([date, values]) => ({ x: date, ...values }))
      .sort((a, b) => dayjs(a.x).diff(dayjs(b.x)));

    return [
      {
        id: 'Disbursed',
        data: sortedData.map(d => ({ x: d.x, y: d.disbursed })),
      },
      {
        id: 'Collected',
        data: sortedData.map(d => ({ x: d.x, y: d.collected })),
      },
    ];
  }, [loans]);

  // Check if monthlySummaryData has any actual points
  const hasMonthlySummaryData = useMemo(() => {
    return monthlySummaryData.some(series => series.data.length > 0);
  }, [monthlySummaryData]);

  // 2. Data for Loan Status Distribution (Pie Chart) for the selected month
  const loanStatusData = useMemo(() => {
    if (!filteredLoansThisMonth || filteredLoansThisMonth.length === 0) return [];

    const statusCounts = filteredLoansThisMonth.reduce((acc, loan) => {
      // Ensure only these specific statuses are counted for the pie chart
      const statusName = loan.status;
      if (['Active', 'Repaid', 'Overdue'].includes(statusName)) {
        acc[statusName] = (acc[statusName] || 0) + 1;
      }
      return acc;
    }, {});

    // Map the status counts to the Nivo Pie chart data format,
    // explicitly using 'Paid' for 'Repaid' for consistent labeling.
    return Object.keys(statusCounts).map(status => ({
      id: status === 'Repaid' ? 'Paid' : status, // Use 'Paid' for 'Repaid'
      label: status === 'Repaid' ? 'Paid' : status,
      value: statusCounts[status],
    }));
  }, [filteredLoansThisMonth]); // Depends on filteredLoansThisMonth

  // 3. Data for Loan Amount Distribution (Bar Chart - simple buckets)
  const loanAmountDistributionData = useMemo(() => {
    if (!filteredLoansThisMonth || filteredLoansThisMonth.length === 0) return [];

    const bins = {
      '0-500': 0,
      '501-1000': 0,
      '1001-2000': 0,
      '2001-5000': 0,
      '5000+': 0,
    };

    filteredLoansThisMonth.forEach(loan => {
      const principal = Number(loan.principal || 0);
      if (principal <= 500) bins['0-500']++;
      else if (principal <= 1000) bins['501-1000']++;
      else if (principal <= 2000) bins['1001-2000']++;
      else if (principal <= 5000) bins['2001-5000']++;
      else bins['5000+']++;
    });

    return Object.keys(bins).map(range => ({
      range,
      count: bins[range],
    }));
  }, [filteredLoansThisMonth]); // Depends on filteredLoansThisMonth

  // 4. Data: Loan Status Count Over Time (for Stacked Bar Chart)
  const loanStatusCountOverTimeData = useMemo(() => {
    if (!loans || loans.length === 0) return []; // Use full 'loans' for historical data

    const monthlyStatusMap = new Map();

    loans.forEach(loan => {
      const monthKey = dayjs(loan.startDate).format('YYYY-MM');
      if (!monthlyStatusMap.has(monthKey)) {
        monthlyStatusMap.set(monthKey, {
          month: monthKey,
          Active: 0,
          Repaid: 0, // Using Repaid internally, will map to Paid for display
          Overdue: 0,
        });
      }
      const data = monthlyStatusMap.get(monthKey);
      const status = loan.status;
      if (['Active', 'Repaid', 'Overdue'].includes(status)) {
        data[status]++;
      }
    });

    return Array.from(monthlyStatusMap.values()).sort((a, b) => dayjs(a.month).diff(dayjs(b.month)));
  }, [loans]);

  // Define common theme for Nivo charts (for small view) - MEMOIZED
  const commonNivoTheme = useMemo(() => ({
    axis: {
      ticks: {
        text: { fill: theme.palette.text.secondary, fontSize: isMobile ? 8 : 9 },
      },
      legend: {
        text: { fill: theme.palette.text.primary, fontSize: isMobile ? 10 : 12, fontWeight: 500 },
      },
    },
    grid: {
      line: { stroke: theme.palette.divider },
    },
    tooltip: {
      container: { background: theme.palette.background.paper, color: theme.palette.text.primary, fontSize: 10 },
    },
    legends: {
      text: { fill: theme.palette.text.primary, fontSize: isMobile ? 9 : 10 },
    },
  }), [theme, isMobile]);

  // Define theme for Nivo charts in the dialog (larger view) - MEMOIZED
  const dialogNivoTheme = useMemo(() => ({
    axis: {
      ticks: { text: { fill: theme.palette.text.secondary, fontSize: 12 } },
      legend: { text: { fill: theme.palette.text.primary, fontSize: 16, fontWeight: 500 } },
    },
    grid: { line: { stroke: theme.palette.divider } },
    tooltip: { container: { background: theme.palette.background.paper, color: theme.palette.text.primary, fontSize: 14 } },
    legends: { text: { fill: theme.palette.text.primary, fontSize: 12 } },
  }), [theme]);

  // --- Memoized Props for SMALL Charts ---

  // Line Chart Props (Small)
  const smallLineChartMargin = useMemo(() => ({ top: 10, right: 60, bottom: 40, left: 50 }), []);
  const smallLineChartAxisBottom = useMemo(() => ({
    format: '%b %Y',
    tickValues: 'every 1 month',
    legend: 'Month',
    legendOffset: 30,
    legendPosition: 'middle',
  }), []);
  const smallLineChartAxisLeft = useMemo(() => ({
    legend: 'Amount (ZMW)',
    legendOffset: -40,
    legendPosition: 'middle',
  }), []);
  const smallLineChartLegends = useMemo(() => ([
    {
      anchor: 'bottom-right',
      direction: 'column',
      justify: false,
      translateX: 60,
      translateY: 0,
      itemsSpacing: 0,
      itemDirection: 'left-to-right',
      itemWidth: 60,
      itemHeight: 16,
      itemOpacity: 0.75,
      symbolSize: 8,
      symbolShape: 'circle',
      symbolBorderColor: 'rgba(0, 0, 0, .5)',
      effects: [
        {
          on: 'hover',
          style: {
            itemBackground: 'rgba(0, 0, 0, .03)',
            itemOpacity: 1
          }
        }
      ]
    }
  ]), []);

  // Pie Chart Props (Small)
  const smallPieChartMargin = useMemo(() => ({ top: 10, right: 40, bottom: 40, left: 40 }), []);
  const smallPieChartBorderColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 0.2]] }), []);
  const smallPieChartArcLinkLabelsColor = useMemo(() => ({ from: 'color' }), []);
  const smallPieChartArcLabelsTextColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 2]] }), []);
  const smallPieChartLegends = useMemo(() => ([
    {
      anchor: 'bottom',
      direction: 'row',
      justify: false,
      translateX: 0,
      translateY: 30,
      itemsSpacing: 0,
      itemWidth: 70,
      itemHeight: 14,
      itemTextColor: theme.palette.text.primary,
      itemDirection: 'left-to-right',
      itemOpacity: 1,
      symbolSize: 12,
      symbolShape: 'circle',
      effects: [
        {
          on: 'hover',
          style: {
            itemTextColor: theme.palette.primary.main
          }
        }
      ]
    }
  ]), [theme]);

  // Bar Chart Props (Small)
  const smallBarChartMargin = useMemo(() => ({ top: 10, right: 40, bottom: 60, left: 50 }), []);
  const smallBarChartBorderColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 1.6]] }), []);
  const smallBarChartAxisBottom = useMemo(() => ({
    tickSize: 5,
    tickPadding: 5,
    tickRotation: isMobile ? 45 : 0,
    legend: 'Loan Amount Range',
    legendPosition: 'middle',
    legendOffset: isMobile ? 45 : 35,
  }), [isMobile]);
  const smallBarChartAxisLeft = useMemo(() => ({
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: 'Number of Loans',
    legendPosition: 'middle',
    legendOffset: -40,
  }), []);
  const smallBarChartLabelTextColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 1.6]] }), []);
  const smallBarChartLegends = useMemo(() => ([
    {
      dataFrom: 'keys',
      anchor: 'bottom-right',
      direction: 'column',
      justify: false,
      translateX: 80,
      translateY: 0,
      itemsSpacing: 2,
      itemWidth: 80,
      itemHeight: 18,
      itemDirection: 'left-to-right',
      itemOpacity: 0.85,
      symbolSize: 16,
      effects: [
        {
          on: 'hover',
          style: {
            itemOpacity: 1
          }
        }
      ]
    }
  ]), []);

  // Stacked Bar Chart Props (Small)
  const smallStackedBarChartMargin = useMemo(() => ({ top: 10, right: 60, bottom: 60, left: 50 }), []);
  const smallStackedBarChartBorderColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 1.6]] }), []);
  const smallStackedBarChartAxisBottom = useMemo(() => ({
    tickSize: 5,
    tickPadding: 5,
    tickRotation: isMobile ? 45 : 0,
    legend: 'Month',
    legendPosition: 'middle',
    legendOffset: isMobile ? 50 : 35,
    format: value => dayjs(value).format('MMM YY'),
  }), [isMobile]);
  const smallStackedBarChartAxisLeft = useMemo(() => ({
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: 'Number of Loans',
    legendPosition: 'middle',
    legendOffset: -40,
  }), []);
  const smallStackedBarChartLabelTextColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 1.6]] }), []);
  const smallStackedBarChartLegends = useMemo(() => ([
    {
      dataFrom: 'keys',
      anchor: 'bottom-right',
      direction: 'column',
      justify: false,
      translateX: 80,
      translateY: 0,
      itemsSpacing: 2,
      itemWidth: 80,
      itemHeight: 18,
      itemDirection: 'left-to-right',
      itemOpacity: 0.85,
      symbolSize: 16,
      // Custom legend data to show 'Paid' instead of 'Repaid'
      data: ['Active', 'Paid', 'Overdue'].map(id => ({
        id: id,
        label: id,
        color: loanStatusColors[id]
      })),
      effects: [{ on: 'hover', style: { itemOpacity: 1 } }]
    }
  ]), [loanStatusColors]);


  // --- Memoized Props for DIALOG Charts ---

  // Line Chart Props
  const dialogLineChartMargin = useMemo(() => ({ top: 40, right: 120, bottom: 80, left: 80 }), []);
  const dialogLineChartAxisBottom = useMemo(() => ({
    format: '%b %Y',
    tickValues: 'every 1 month',
    legend: 'Month',
    legendOffset: 50,
    legendPosition: 'middle',
  }), []);
  const dialogLineChartAxisLeft = useMemo(() => ({
    legend: 'Amount (ZMW)',
    legendOffset: -70,
    legendPosition: 'middle',
  }), []);
  const dialogLineChartLegends = useMemo(() => ([
    {
      anchor: 'bottom-right',
      direction: 'column',
      justify: false,
      translateX: 100,
      translateY: 0,
      itemsSpacing: 0,
      itemDirection: 'left-to-right',
      itemWidth: 80,
      itemHeight: 20,
      itemOpacity: 0.75,
      symbolSize: 12,
      symbolShape: 'circle',
      symbolBorderColor: 'rgba(0, 0, 0, .5)',
      effects: [{ on: 'hover', style: { itemBackground: 'rgba(0, 0, 0, .03)', itemOpacity: 1 } }]
    }
  ]), []);

  // Pie Chart Props
  const dialogPieChartMargin = useMemo(() => ({ top: 40, right: 100, bottom: 100, left: 100 }), []);
  const dialogPieChartBorderColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 0.2]] }), []);
  const dialogPieChartArcLinkLabelsColor = useMemo(() => ({ from: 'color' }), []);
  const dialogPieChartArcLabelsTextColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 2]] }), []);
  const dialogPieChartLegends = useMemo(() => ([
    {
      anchor: 'bottom',
      direction: 'row',
      justify: false,
      translateX: 0,
      translateY: 60,
      itemsSpacing: 0,
      itemWidth: 100,
      itemHeight: 20,
      itemTextColor: theme.palette.text.primary,
      itemDirection: 'left-to-right',
      itemOpacity: 1,
      symbolSize: 20,
      symbolShape: 'circle',
      effects: [{ on: 'hover', style: { itemTextColor: theme.palette.primary.main } }]
    }
  ]), [theme]);

  // Bar Chart Props
  const dialogBarChartMargin = useMemo(() => ({ top: 40, right: 80, bottom: 90, left: 80 }), []);
  const dialogBarChartBorderColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 1.6]] }), []);
  const dialogBarChartAxisBottom = useMemo(() => ({
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: 'Loan Amount Range',
    legendPosition: 'middle',
    legendOffset: 50,
  }), []);
  const dialogBarChartAxisLeft = useMemo(() => ({
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: 'Number of Loans',
    legendPosition: 'middle',
    legendOffset: -70,
  }), []);
  const dialogBarChartLabelTextColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 1.6]] }), []);
  const dialogBarChartLegends = useMemo(() => ([
    {
      dataFrom: 'keys',
      anchor: 'bottom-right',
      direction: 'column',
      justify: false,
      translateX: 100,
      translateY: 0,
      itemsSpacing: 2,
      itemWidth: 90,
      itemHeight: 20,
      itemDirection: 'left-to-right',
      itemOpacity: 0.85,
      symbolSize: 20,
      effects: [{ on: 'hover', style: { itemOpacity: 1 } }]
    }
  ]), []);

  // Stacked Bar Chart Props
  const dialogStackedBarChartMargin = useMemo(() => ({ top: 40, right: 80, bottom: 80, left: 80 }), []);
  const dialogStackedBarChartBorderColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 1.6]] }), []);
  const dialogStackedBarChartAxisBottom = useMemo(() => ({
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: 'Month',
    legendPosition: 'middle',
    legendOffset: 50,
    format: value => dayjs(value).format('MMM YY'),
  }), []);
  const dialogStackedBarChartAxisLeft = useMemo(() => ({
    tickSize: 5,
    tickPadding: 5,
    tickRotation: 0,
    legend: 'Number of Loans',
    legendPosition: 'middle',
    legendOffset: -70,
  }), []);
  const dialogStackedBarChartLabelTextColor = useMemo(() => ({ from: 'color', modifiers: [['darker', 1.6]] }), []);
  const dialogStackedBarChartLegends = useMemo(() => ([
    {
      dataFrom: 'keys',
      anchor: 'bottom-right',
      direction: 'column',
      justify: false,
      translateX: 100,
      translateY: 0,
      itemsSpacing: 2,
      itemWidth: 90,
      itemHeight: 20,
      itemDirection: 'left-to-right',
      itemOpacity: 0.85,
      symbolSize: 20,
      // Custom legend data to show 'Paid' instead of 'Repaid'
      data: ['Active', 'Paid', 'Overdue'].map(id => ({
        id: id,
        label: id,
        color: loanStatusColors[id]
      })),
      effects: [{ on: 'hover', style: { itemOpacity: 1 } }]
    }
  ]), [loanStatusColors]);


  // Handle loading state
  if (loans === undefined || loans === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: chartPaperHeight, p: 2 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading loan data...</Typography>
      </Box>
    );
  }

  // Handle no data available after loading
  if (loans.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: theme.palette.text.secondary }}>
        <Typography variant="body1">No loan data available to display charts.</Typography>
      </Box>
    );
  }

  return (
    <Box> {/* Outer Box for month selector and charts grid */}
      {/* Monthly Navigation Controls - Moved out of the Grid container */}
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
          <Paper elevation={1} sx={{ p: isMobile ? 1.5 : 2, borderRadius: 2, height: chartPaperHeight, cursor: 'pointer' }}
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
                  margin={smallLineChartMargin}
                  xScale={{ type: 'time', format: '%Y-%m-%d', useUTC: false, precision: 'month' }}
                  xFormat="time:%Y-%m-%d"
                  yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                  yFormat=" >-.2f"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={smallLineChartAxisBottom}
                  axisLeft={smallLineChartAxisLeft}
                  pointSize={4}
                  pointBorderWidth={0.5}
                  pointBorderColor={{ from: 'serieColor' }}
                  useMesh={true}
                  legends={smallLineChartLegends}
                  theme={commonNivoTheme}
                  colors={nivoColors}
                  ariaLabel="Monthly Disbursements and Collections Line Chart"
                />
              </Box>
            ) : (
              <Box sx={{ height: chartInnerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.text.secondary }}>
                <Typography variant="body2">No monthly disbursement or collection data available.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Chart 2: Loan Status Distribution (Pie Chart) for selected month */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: isMobile ? 1.5 : 2, borderRadius: 2, height: chartPaperHeight, cursor: 'pointer' }}
            onClick={() => handleOpenDialog('pie', loanStatusData, 'Loan Status Distribution')}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: isMobile ? '1rem' : '1.15rem' }}>
                Loan Status Distribution
              </Typography>
              <Tooltip title={`Shows the distribution of loan statuses (e.g., Active, Paid, Overdue) for ${dayjs(currentDisplayMonth).format('MMMM YYYY')}.`}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {loanStatusData.length > 0 && loanStatusData.some(d => d.value > 0) ? (
              <Box sx={{ height: chartInnerHeight }}>
                <ResponsivePie
                  data={loanStatusData}
                  margin={smallPieChartMargin}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  borderWidth={1}
                  borderColor={smallPieChartBorderColor}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor={theme.palette.text.primary}
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={smallPieChartArcLinkLabelsColor}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={smallPieChartArcLabelsTextColor}
                  legends={smallPieChartLegends}
                  theme={commonNivoTheme}
                  colors={({ id }) => loanStatusColors[id]} // Use specific loan status colors
                  ariaLabel="Loan Status Distribution Pie Chart"
                />
              </Box>
            ) : (
              <Box sx={{ height: chartInnerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.text.secondary }}>
                <Typography variant="body2">No loan status data for {dayjs(currentDisplayMonth).format('MMMM YYYY')}.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Chart 3: Loan Amount Distribution (Bar Chart) for selected month */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: isMobile ? 1.5 : 2, borderRadius: 2, height: chartPaperHeight, cursor: 'pointer' }}
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
                  margin={smallBarChartMargin}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={nivoColors[0]} // Use a general color for this chart
                  borderColor={smallBarChartBorderColor}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={smallBarChartAxisBottom}
                  axisLeft={smallBarChartAxisLeft}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={smallBarChartLabelTextColor}
                  legends={smallBarChartLegends}
                  role="application"
                  ariaLabel="Loan Amount Distribution Bar Chart"
                  theme={commonNivoTheme}
                />
              </Box>
            ) : (
              <Box sx={{ height: chartInnerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.text.secondary }}>
                <Typography variant="body2">No loan amount distribution data for {dayjs(currentDisplayMonth).format('MMMM YYYY')}.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Chart 4: Loan Status Count Over Time (Stacked Bar Chart) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: isMobile ? 1.5 : 2, borderRadius: 2, height: chartPaperHeight, cursor: 'pointer' }}
            onClick={() => handleOpenDialog('stackedBar', loanStatusCountOverTimeData, 'Loan Status Count Over Time', ['Active', 'Repaid', 'Overdue'], 'month')}>
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
            {loanStatusCountOverTimeData.length > 0 && loanStatusCountOverTimeData.some(d => d.Active > 0 || d.Repaid > 0 || d.Overdue > 0) ? (
              <Box sx={{ height: chartInnerHeight }}>
                <ResponsiveBar
                  data={loanStatusCountOverTimeData}
                  keys={['Active', 'Repaid', 'Overdue']} // Use Repaid internally
                  indexBy="month"
                  margin={smallStackedBarChartMargin}
                  padding={0.3}
                  groupMode="stacked"
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={({ id }) => loanStatusColors[id === 'Repaid' ? 'Paid' : id]} // Map 'Repaid' to 'Paid' color
                  borderColor={smallStackedBarChartBorderColor}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={smallStackedBarChartAxisBottom}
                  axisLeft={smallStackedBarChartAxisLeft}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={smallStackedBarChartLabelTextColor}
                  legends={smallStackedBarChartLegends}
                  role="application"
                  ariaLabel="Loan Status Count Over Time Stacked Bar Chart"
                  theme={commonNivoTheme}
                />
              </Box>
            ) : (
              <Box sx={{ height: chartInnerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.text.secondary }}>
                <Typography variant="body2">No historical loan status data available.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Chart Dialog for Zoom-Out View */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        TransitionComponent={Transition}
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            p: isMobile ? 1 : 3,
          },
        }}
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
          {dialogChartConfig && dialogChartConfig.type === 'line' && hasMonthlySummaryData ? (
            <Box sx={{ height: '100%' }}>
              <ResponsiveLine
                data={dialogChartConfig.data}
                margin={dialogLineChartMargin}
                xScale={{ type: 'time', format: '%Y-%m-%d', useUTC: false, precision: 'month' }}
                xFormat="time:%Y-%m-%d"
                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                yFormat=" >-.2f"
                axisTop={null}
                axisRight={null}
                axisBottom={dialogLineChartAxisBottom}
                axisLeft={dialogLineChartAxisLeft}
                pointSize={6}
                pointBorderWidth={1}
                pointBorderColor={{ from: 'serieColor' }}
                useMesh={true}
                legends={dialogLineChartLegends}
                theme={dialogNivoTheme}
                colors={nivoColors}
                ariaLabel="Monthly Disbursements and Collections Line Chart (Dialog)"
              />
            </Box>
          ) : dialogChartConfig && dialogChartConfig.type === 'pie' && loanStatusData.length > 0 && loanStatusData.some(d => d.value > 0) ? (
            <Box sx={{ height: '100%' }}>
              <ResponsivePie
                data={dialogChartConfig.data}
                margin={dialogPieChartMargin}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={dialogPieChartBorderColor}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={theme.palette.text.primary}
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={dialogPieChartArcLinkLabelsColor}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={dialogPieChartArcLabelsTextColor}
                legends={dialogPieChartLegends}
                theme={dialogNivoTheme}
                colors={({ id }) => loanStatusColors[id]}
                ariaLabel="Loan Status Distribution Pie Chart (Dialog)"
              />
            </Box>
          ) : dialogChartConfig && dialogChartConfig.type === 'bar' && loanAmountDistributionData.length > 0 && loanAmountDistributionData.some(d => d.count > 0) ? (
            <Box sx={{ height: '100%' }}>
              <ResponsiveBar
                data={dialogChartConfig.data}
                keys={dialogChartConfig.keys}
                indexBy={dialogChartConfig.indexBy}
                margin={dialogBarChartMargin}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={nivoColors[0]}
                borderColor={dialogBarChartBorderColor}
                axisTop={null}
                axisRight={null}
                axisBottom={dialogBarChartAxisBottom}
                axisLeft={dialogBarChartAxisLeft}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={dialogBarChartLabelTextColor}
                legends={dialogBarChartLegends}
                role="application"
                ariaLabel="Loan Amount Distribution Bar Chart (Dialog)"
                theme={dialogNivoTheme}
              />
            </Box>
          ) : dialogChartConfig && dialogChartConfig.type === 'stackedBar' && loanStatusCountOverTimeData.length > 0 && loanStatusCountOverTimeData.some(d => d.Active > 0 || d.Repaid > 0 || d.Overdue > 0) ? (
            <Box sx={{ height: '100%' }}>
              <ResponsiveBar
                data={dialogChartConfig.data}
                keys={dialogChartConfig.keys}
                indexBy={dialogChartConfig.indexBy}
                margin={dialogStackedBarChartMargin}
                padding={0.3}
                groupMode="stacked"
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={({ id }) => loanStatusColors[id === 'Repaid' ? 'Paid' : id]}
                borderColor={dialogStackedBarChartBorderColor}
                axisTop={null}
                axisRight={null}
                axisBottom={dialogStackedBarChartAxisBottom} // This was the line with the syntax error
                axisLeft={dialogStackedBarChartAxisLeft}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={dialogStackedBarChartLabelTextColor}
                legends={dialogStackedBarChartLegends}
                role="application"
                ariaLabel="Loan Status Count Over Time Stacked Bar Chart (Dialog)"
                theme={dialogNivoTheme}
              />
            </Box>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.palette.text.secondary }}>
              <Typography variant="body1">No data to display in this chart.</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

Charts.propTypes = {
  loans: PropTypes.array,
  selectedMonth: PropTypes.string.isRequired,
};

// >>> Apply React.memo for overall component memoization <<<
export default React.memo(Charts);
