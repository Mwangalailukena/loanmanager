import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField,
  useMediaQuery,
  useTheme,
  Divider,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Stack,
  Button,
} from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { useFirestore } from "../contexts/FirestoreProvider";
import { exportToCsv } from "../utils/exportCSV";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

// --- Constants ---
const calcStatus = (loan) => {
  const now = dayjs();
  const due = dayjs(loan.dueDate);
  if (loan.isPaid || (loan.repaidAmount >= loan.totalRepayable && loan.totalRepayable > 0 && !loan.status)) return "Paid";
  if (loan.status === "Paid") return "Paid";
  if (due.isBefore(now, "day")) return "Overdue";
  return "Active";
};

const PIE_CHART_COLORS = ['#FFC107', '#FF8F00', '#E65100', '#D84315'];

export default function ReportsPage() {
  const { loans, loadingLoans, payments, loadingPayments, getAllPayments } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // --- Filters State ---
  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState(dayjs().subtract(6, 'months').startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [includePaid, setIncludePaid] = useState(true);
  const [includeActive, setIncludeActive] = useState(true);
  const [includeOverdue, setIncludeOverdue] = useState(true);

  useEffect(() => {
    if (!payments && !loadingPayments) {
      getAllPayments();
    }
  }, [payments, loadingPayments, getAllPayments]);

  // --- Memoized Filtered Data ---
  const filteredLoansForReports = useMemo(() => {
    if (loadingLoans || !loans) return [];

    const filterStartDate = dayjs(startDate);
    const filterEndDate = dayjs(endDate);

    return loans.filter(loan => {
      const loanStartDate = dayjs(loan.startDate);
      const status = calcStatus(loan);

      const inDateRange = loanStartDate.isBetween(filterStartDate, filterEndDate, 'day', '[]');

      let statusMatches = false;
      if (status === "Paid" && includePaid) statusMatches = true;
      if (status === "Active" && includeActive) statusMatches = true;
      if (status === "Overdue" && includeOverdue) statusMatches = true;

      return inDateRange && statusMatches;
    });
  }, [loans, startDate, endDate, includePaid, includeActive, includeOverdue, loadingLoans]);


  // --- REPORT 1: Loan Portfolio Summary ---
  const portfolioSummary = useMemo(() => {
    if (loadingLoans || !loans) return {
      totalLoans: 0,
      activeLoans: 0,
      paidLoans: 0,
      overdueLoans: 0,
      totalPrincipalDisbursed: 0,
      totalInterestAccrued: 0,
      totalOutstanding: 0,
      totalRepaid: 0,
      portfolioYield: 0,
      repaymentRate: 0,
      defaultRate: 0,
    };

    let activeLoans = 0;
    let paidLoans = 0;
    let overdueLoans = 0;
    let totalPrincipalDisbursed = 0;
    let totalInterestAccrued = 0;
    let totalOutstanding = 0;
    let totalRepaid = 0;

    filteredLoansForReports.forEach(loan => {
      const status = calcStatus(loan);
      if (status === "Active") activeLoans++;
      else if (status === "Paid") paidLoans++;
      else if (status === "Overdue") overdueLoans++;

      totalPrincipalDisbursed += Number(loan.principal || 0);
      totalInterestAccrued += Number(loan.interest || 0);
      totalRepaid += Number(loan.repaidAmount || 0);
      totalOutstanding += (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0));
    });

    const portfolioYield = totalPrincipalDisbursed > 0 ? (totalRepaid / totalPrincipalDisbursed) - 1 : 0;
    const totalRepayable = totalPrincipalDisbursed + totalInterestAccrued;
    const repaymentRate = totalRepayable > 0 ? totalRepaid / totalRepayable : 0;
    const defaultRate = filteredLoansForReports.length > 0 ? overdueLoans / filteredLoansForReports.length : 0;

    return {
      totalLoans: filteredLoansForReports.length,
      activeLoans,
      paidLoans,
      overdueLoans,
      totalPrincipalDisbursed,
      totalInterestAccrued,
      totalOutstanding,
      totalRepaid,
      portfolioYield,
      repaymentRate,
      defaultRate,
    };
  }, [filteredLoansForReports, loans, loadingLoans]);


  // --- REPORT 2: Arrears Aging Analysis ---
  const arrearsAgingReport = useMemo(() => {
    if (loadingLoans || !loans) return { buckets: {}, list: [], chartData: [] };

    const now = dayjs();
    const buckets = {
      '1-7 Days': { loans: [], total: 0 },
      '8-14 Days': { loans: [], total: 0 },
      '15-30 Days': { loans: [], total: 0 },
      '30+ Days': { loans: [], total: 0 },
    };
    const overdueLoansList = [];

    filteredLoansForReports.forEach(loan => {
      const status = calcStatus(loan);
      if (status === "Overdue") {
        const dueDate = dayjs(loan.dueDate);
        const daysOverdue = now.diff(dueDate, 'day');
        const outstanding = (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0));

        if (outstanding <= 0) return;

        const loanData = {
          id: loan.id,
          borrower: loan.borrower,
          phone: loan.phone,
          principal: Number(loan.principal || 0),
          interest: Number(loan.interest || 0),
          totalRepayable: Number(loan.totalRepayable || 0),
          repaidAmount: Number(loan.repaidAmount || 0),
          outstanding: outstanding,
          startDate: loan.startDate,
          dueDate: loan.dueDate,
          daysOverdue: daysOverdue,
        };

        if (daysOverdue >= 1 && daysOverdue <= 7) {
          buckets['1-7 Days'].loans.push(loanData);
          buckets['1-7 Days'].total += outstanding;
        } else if (daysOverdue >= 8 && daysOverdue <= 14) {
          buckets['8-14 Days'].loans.push(loanData);
          buckets['8-14 Days'].total += outstanding;
        } else if (daysOverdue >= 15 && daysOverdue <= 30) {
          buckets['15-30 Days'].loans.push(loanData);
          buckets['15-30 Days'].total += outstanding;
        } else if (daysOverdue > 30) {
          buckets['30+ Days'].loans.push(loanData);
          buckets['30+ Days'].total += outstanding;
        }
        overdueLoansList.push(loanData);
      }
    });

    overdueLoansList.sort((a, b) => b.daysOverdue - a.daysOverdue);
    const chartData = Object.entries(buckets).map(([name, data]) => ({ name, value: data.total }));

    return { buckets, list: overdueLoansList, chartData };
  }, [filteredLoansForReports, loans, loadingLoans]);


  // --- REPORT 3: Detailed Loan List (Export Focused) ---
  const detailedLoanListReport = useMemo(() => {
    if (loadingLoans || !loans) return [];

    return filteredLoansForReports.map(loan => {
      const outstanding = (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0));
      return {
        'Loan ID': loan.id,
        'Borrower Name': loan.borrower,
        'Phone Number': loan.phone,
        'Principal Amount (ZMW)': Number(loan.principal || 0).toFixed(2),
        'Interest Amount (ZMW)': Number(loan.interest || 0).toFixed(2),
        'Total Repayable (ZMW)': Number(loan.totalRepayable || 0).toFixed(2),
        'Amount Repaid (ZMW)': Number(loan.repaidAmount || 0).toFixed(2),
        'Outstanding Balance (ZMW)': outstanding.toFixed(2),
        'Start Date': loan.startDate,
        'Due Date': loan.dueDate,
        'Status': calcStatus(loan),
        'Days Overdue': calcStatus(loan) === 'Overdue' ? dayjs().diff(dayjs(loan.dueDate), 'day') : 0,
      };
    });
  }, [filteredLoansForReports, loans, loadingLoans]);

  // --- REPORT 4: Cash Flow ---
  const cashFlowReport = useMemo(() => {
    if (loadingLoans || loadingPayments || !payments) return { data: [], totals: { totalInflow: 0, totalOutflow: 0, netCashFlow: 0 } };

    const filterStartDate = dayjs(startDate);
    const filterEndDate = dayjs(endDate);

    const inflows = payments
      .filter(p => {
        const paymentDate = dayjs(p.date);
        return paymentDate.isBetween(filterStartDate, filterEndDate, 'day', '[]');
      })
      .map(p => ({
        date: dayjs(p.date).format('YYYY-MM-DD'),
        type: 'Inflow (Payment)',
        amount: Number(p.amount || 0),
        description: `Payment for Loan ID: ${p.loanId}`
      }));

    const outflows = filteredLoansForReports.map(l => ({
      date: l.startDate,
      type: 'Outflow (Disbursement)',
      amount: -Number(l.principal || 0),
      description: `Loan to ${l.borrower}`
    }));

    const combined = [...inflows, ...outflows].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    const totalInflow = inflows.reduce((sum, item) => sum + item.amount, 0);
    const totalOutflow = outflows.reduce((sum, item) => sum + item.amount, 0);
    const netCashFlow = totalInflow + totalOutflow;

    return {
      data: combined,
      totals: {
        totalInflow,
        totalOutflow: Math.abs(totalOutflow),
        netCashFlow
      }
    };
  }, [filteredLoansForReports, payments, loadingLoans, loadingPayments, startDate, endDate]);

  // --- Export Functions ---
  const exportPortfolioSummary = useCallback(() => {
    const data = [
      { Metric: 'Total Loans (Selected Period)', Value: portfolioSummary.totalLoans },
      { Metric: 'Active Loans (Selected Period)', Value: portfolioSummary.activeLoans },
      { Metric: 'Paid Loans (Selected Period)', Value: portfolioSummary.paidLoans },
      { Metric: 'Overdue Loans (Selected Period)', Value: portfolioSummary.overdueLoans },
      { Metric: 'Total Principal Disbursed', Value: portfolioSummary.totalPrincipalDisbursed.toFixed(2) },
      { Metric: 'Total Interest Accrued', Value: portfolioSummary.totalInterestAccrued.toFixed(2) },
      { Metric: 'Total Outstanding Balance', Value: portfolioSummary.totalOutstanding.toFixed(2) },
      { Metric: 'Total Amount Repaid', Value: portfolioSummary.totalRepaid.toFixed(2) },
    ];
    exportToCsv(`Loan_Portfolio_Summary_${dayjs().format('YYYYMMDD')}.csv`, data);
  }, [portfolioSummary]);

  const exportArrearsAging = useCallback(() => {
    const data = arrearsAgingReport.list.map(loan => ({
      'Borrower': loan.borrower,
      'Phone': loan.phone,
      'Principal': loan.principal.toFixed(2),
      'Interest': loan.interest.toFixed(2),
      'Total Repayable': loan.totalRepayable.toFixed(2),
      'Repaid Amount': loan.repaidAmount.toFixed(2),
      'Outstanding': loan.outstanding.toFixed(2),
      'Start Date': loan.startDate,
      'Due Date': loan.dueDate,
      'Days Overdue': loan.daysOverdue,
    }));
    exportToCsv(`Arrears_Aging_Report_${dayjs().format('YYYYMMDD')}.csv`, data);
  }, [arrearsAgingReport]);

  const exportDetailedLoanList = useCallback(() => {
    exportToCsv(`Detailed_Loan_List_${dayjs().format('YYYYMMDD')}.csv`, detailedLoanListReport);
  }, [detailedLoanListReport]);

  const exportCashFlow = useCallback(() => {
    const dataForExport = cashFlowReport.data.map(item => ({
        'Date': item.date,
        'Type': item.type,
        'Description': item.description,
        'Amount (ZMW)': item.amount.toFixed(2)
    }));
    exportToCsv(`Cash_Flow_Report_${dayjs().format('YYYYMMDD')}.csv`, dataForExport);
  }, [cashFlowReport]);


  


  // Reusable styles for the focused state of form fields
  const filterInputStyles = {
    "& .MuiOutlinedInput-root": {
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.secondary.main,
      },
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.palette.secondary.main,
    },
    "& .MuiSvgIcon-root": {
      "&.Mui-focused": {
        color: theme.palette.secondary.main,
      },
    },
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderReportContent = () => {
    if (loadingLoans || loadingPayments) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
          <Typography ml={2} color="text.secondary">Loading report data...</Typography>
        </Box>
      );
    }
    if (filteredLoansForReports.length === 0 && activeTab !== 0) {
      return (
        <Typography variant="h6" align="center" mt={4} color="text.secondary">
          No loan data found for the selected filters.
        </Typography>
      );
    }

    const summaryChartData = [
        { name: 'Principal Disbursed', value: portfolioSummary.totalPrincipalDisbursed },
        { name: 'Interest Accrued', value: portfolioSummary.totalInterestAccrued },
        { name: 'Amount Repaid', value: portfolioSummary.totalRepaid },
    ];

    return (
        <Box>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="reports tabs" sx={{ mb: 2 }}>
                <Tab label="Portfolio Summary" />
                <Tab label="Arrears Aging" />
                <Tab label="Cash Flow" />
                <Tab label="Detailed Loan List" />
            </Tabs>

            {activeTab === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Card elevation={2} sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                                <Stack spacing={1}>
                                    <Typography>Total Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{portfolioSummary.totalLoans}</Typography></Typography>
                                    <Typography>Active Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{portfolioSummary.activeLoans}</Typography></Typography>
                                    <Typography>Paid Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{portfolioSummary.paidLoans}</Typography></Typography>
                                    <Typography>Overdue Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{portfolioSummary.overdueLoans}</Typography></Typography>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography>Total Principal Disbursed: <Typography component="span" fontWeight="bold" color="secondary.main">ZMW {portfolioSummary.totalPrincipalDisbursed.toFixed(2)}</Typography></Typography>
                                    <Typography>Total Interest Accrued: <Typography component="span" fontWeight="bold" color="secondary.main">ZMW {portfolioSummary.totalInterestAccrued.toFixed(2)}</Typography></Typography>
                                    <Typography>Total Outstanding Balance: <Typography component="span" fontWeight="bold" color="secondary.main">ZMW {portfolioSummary.totalOutstanding.toFixed(2)}</Typography></Typography>
                                    <Typography>Total Amount Repaid: <Typography component="span" fontWeight="bold" color="secondary.main">ZMW {portfolioSummary.totalRepaid.toFixed(2)}</Typography></Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6">Risks</Typography>
                                <Stack spacing={1}>
                                    <Typography>Number of Overdue Loans: <Typography component="span" fontWeight="bold" color="error.main">{portfolioSummary.overdueLoans}</Typography></Typography>
                                    <Typography>Value of Overdue Loans: <Typography component="span" fontWeight="bold" color="error.main">ZMW {arrearsAgingReport.buckets['1-7 Days'].total + arrearsAgingReport.buckets['8-14 Days'].total + arrearsAgingReport.buckets['15-30 Days'].total + arrearsAgingReport.buckets['30+ Days'].total}</Typography></Typography>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography>Overdue Breakdown:</Typography>
                                    <Typography>1-7 Days: {arrearsAgingReport.buckets['1-7 Days'].loans.length}</Typography>
                                    <Typography>8-14 Days: {arrearsAgingReport.buckets['8-14 Days'].loans.length}</Typography>
                                    <Typography>15-30 Days: {arrearsAgingReport.buckets['15-30 Days'].loans.length}</Typography>
                                    <Typography>30+ Days: {arrearsAgingReport.buckets['30+ Days'].loans.length}</Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6">Portfolio Health</Typography>
                                <Stack spacing={1}>
                                    <Typography>Portfolio Yield: <Typography component="span" fontWeight="bold" color="secondary.main">{(portfolioSummary.portfolioYield * 100).toFixed(2)}%</Typography></Typography>
                                    <Typography>Repayment Rate: <Typography component="span" fontWeight="bold" color="secondary.main">{(portfolioSummary.repaymentRate * 100).toFixed(2)}%</Typography></Typography>
                                    <Typography>Default Rate: <Typography component="span" fontWeight="bold" color="secondary.main">{(portfolioSummary.defaultRate * 100).toFixed(2)}%</Typography></Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6">Financial Overview</Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={summaryChartData} margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip formatter={(value) => `ZMW ${value.toFixed(2)}`} />
                                        <Bar dataKey="value" fill={theme.palette.secondary.main} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12}>
                        <Button variant="outlined" color="secondary" onClick={exportPortfolioSummary}>Export Summary CSV</Button>
                    </Grid>
                </Grid>
            )}

            {activeTab === 1 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                        <Typography variant="h6" gutterBottom>Arrears Aging Details</Typography>
                        <TableContainer component={Paper} elevation={1}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Bucket</TableCell>
                                        <TableCell align="right"># of Loans</TableCell>
                                        <TableCell align="right">Total Outstanding (ZMW)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(arrearsAgingReport.buckets).map(([bucket, data]) => (
                                        <TableRow key={bucket}>
                                            <TableCell>{bucket}</TableCell>
                                            <TableCell align="right">{data.loans.length}</TableCell>
                                            <TableCell align="right">{data.total.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="h6">Overdue Distribution by Amount</Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={arrearsAgingReport.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                            {arrearsAgingReport.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />)}
                                        </Pie>
                                        <RechartsTooltip formatter={(value) => `ZMW ${value.toFixed(2)}`} />
                                        <RechartsLegend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>Overdue Loans</Typography>
                        <TableContainer component={Paper} elevation={1}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Borrower</TableCell>
                                        <TableCell>Phone</TableCell>
                                        <TableCell align="right">Principal</TableCell>
                                        <TableCell align="right">Outstanding</TableCell>
                                        <TableCell>Due Date</TableCell>
                                        <TableCell align="right">Days Overdue</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {arrearsAgingReport.list.map((loan) => (
                                        <TableRow key={loan.id}>
                                            <TableCell>{loan.borrower}</TableCell>
                                            <TableCell>{loan.phone}</TableCell>
                                            <TableCell align="right">{loan.principal.toFixed(2)}</TableCell>
                                            <TableCell align="right">{loan.outstanding.toFixed(2)}</TableCell>
                                            <TableCell>{loan.dueDate}</TableCell>
                                            <TableCell align="right">{loan.daysOverdue}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>
                    <Grid item xs={12}>
                        <Button variant="outlined" color="secondary" onClick={exportArrearsAging}>Export Arrears CSV</Button>
                    </Grid>
                </Grid>
            )}

            {activeTab === 2 && (
                <Box>
                    <Typography variant="h6" gutterBottom>Cash Flow Report</Typography>
                    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={cashFlowReport.data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <RechartsTooltip />
                                <RechartsLegend />
                                <Bar dataKey="amount" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                        <Stack direction="row" spacing={4}>
                            <Box>
                                <Typography color="text.secondary">Total Inflow (Payments)</Typography>
                                <Typography variant="h6" color="success.main">ZMW {cashFlowReport.totals.totalInflow.toFixed(2)}</Typography>
                            </Box>
                            <Box>
                                <Typography color="text.secondary">Total Outflow (Disbursed)</Typography>
                                <Typography variant="h6" color="error.main">ZMW {cashFlowReport.totals.totalOutflow.toFixed(2)}</Typography>
                            </Box>
                            <Box>
                                <Typography color="text.secondary">Net Cash Flow</Typography>
                                <Typography variant="h6" color={cashFlowReport.totals.netCashFlow >= 0 ? 'success.main' : 'error.main'}>
                                    ZMW {cashFlowReport.totals.netCashFlow.toFixed(2)}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                    <TableContainer component={Paper} elevation={1}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell align="right">Amount (ZMW)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cashFlowReport.data.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.date}</TableCell>
                                        <TableCell>
                                            <Typography color={item.type.includes('Inflow') ? 'success.main' : 'error.main'}>
                                                {item.type}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell align="right">{item.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Button variant="outlined" color="secondary" sx={{ mt: 2 }} onClick={exportCashFlow}>Export Cash Flow CSV</Button>
                </Box>
            )}

            {activeTab === 3 && (
                <Box>
                    <Typography variant="h6" gutterBottom>Detailed Loan List</Typography>
                    {detailedLoanListReport.length === 0 ? (
                        <Typography color="text.secondary">No loans found for the selected filters.</Typography>
                    ) : (
                        <TableContainer component={Paper} elevation={1}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Borrower</TableCell>
                                        <TableCell>Phone</TableCell>
                                        <TableCell align="right">Principal</TableCell>
                                        <TableCell align="right">Interest</TableCell>
                                        <TableCell align="right">Total Repayable</TableCell>
                                        <TableCell align="right">Amount Repaid</TableCell>
                                        <TableCell align="right">Outstanding</TableCell>
                                        <TableCell>Start Date</TableCell>
                                        <TableCell>Due Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Days Overdue</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {detailedLoanListReport.map((loan) => (
                                        <TableRow key={loan['Loan ID']}>
                                            <TableCell>{loan['Borrower Name']}</TableCell>
                                            <TableCell>{loan['Phone Number']}</TableCell>
                                            <TableCell align="right">{loan['Principal Amount (ZMW)']}</TableCell>
                                            <TableCell align="right">{loan['Interest Amount (ZMW)']}</TableCell>
                                            <TableCell align="right">{loan['Total Repayable (ZMW)']}</TableCell>
                                            <TableCell align="right">{loan['Amount Repaid (ZMW)']}</TableCell>
                                            <TableCell align="right">{loan['Outstanding Balance (ZMW)']}</TableCell>
                                            <TableCell>{loan['Start Date']}</TableCell>
                                            <TableCell>{loan['Due Date']}</TableCell>
                                            <TableCell>{loan['Status']}</TableCell>
                                            <TableCell align="right">{loan['Days Overdue']}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    <Button variant="outlined" color="secondary" sx={{ mt: 2 }} onClick={exportDetailedLoanList}>Export Detailed List CSV</Button>
                </Box>
            )}
        </Box>
    );
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Reports & Analytics
      </Typography>

      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems="center">
          <TextField
            sx={filterInputStyles}
            label="Start Date"
            type="date"
            size="small"
            fullWidth={isMobile}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            sx={filterInputStyles}
            label="End Date"
            type="date"
            size="small"
            fullWidth={isMobile}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <FormControlLabel
              control={
                <Checkbox
                  checked={includeActive}
                  onChange={(e) => setIncludeActive(e.target.checked)}
                  size="small"
                  sx={{ '&.Mui-checked': { color: theme.palette.secondary.main } }}
                />
              }
              label="Active"
          />
          <FormControlLabel
              control={
                <Checkbox
                  checked={includePaid}
                  onChange={(e) => setIncludePaid(e.target.checked)}
                  size="small"
                  sx={{ '&.Mui-checked': { color: theme.palette.secondary.main } }}
                />
              }
              label="Paid"
          />
          <FormControlLabel
              control={
                <Checkbox
                  checked={includeOverdue}
                  onChange={(e) => setIncludeOverdue(e.target.checked)}
                  size="small"
                  sx={{ '&.Mui-checked': { color: theme.palette.secondary.main } }}
                />
              }
              label="Overdue"
          />
        </Stack>
      </Paper>

      {renderReportContent()}
    </Box>
  );
}