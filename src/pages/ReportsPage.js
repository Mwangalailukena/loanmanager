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
  Autocomplete,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  Chip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useFirestore } from "../contexts/FirestoreProvider";
import { useSnackbar } from "../components/SnackbarProvider";
import { exportToCsv } from "../utils/exportCSV";
import { exportToPdf } from "../utils/exportPDF";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CostOfDefault from '../components/reports/CostOfDefault';

dayjs.extend(isBetween);

// --- Constants ---
const calcStatus = (loan) => {
  if (loan.status === "Defaulted") return "Defaulted";
  const now = dayjs();
  const due = dayjs(loan.dueDate);
  if (loan.isPaid || (loan.repaidAmount >= loan.totalRepayable && loan.totalRepayable > 0 && !loan.status)) return "Paid";
  if (loan.status === "Paid") return "Paid";
  if (due.isBefore(now, "day")) return "Overdue";
  return "Active";
};

const PIE_CHART_COLORS = ['#FFC107', '#FF8F00', '#E65100', '#D84315'];

export default function ReportsPage() {
  const { loans, loadingLoans, payments, loadingPayments, getAllPayments, borrowers } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const showSnackbar = useSnackbar();

  // --- Filters State ---
  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState(dayjs().subtract(6, 'months').startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [includePaid, setIncludePaid] = useState(true);
  const [includeActive, setIncludeActive] = useState(true);
  const [includeOverdue, setIncludeOverdue] = useState(true);
  const [includeDefaulted, setIncludeDefaulted] = useState(true);
  const [screenshotMode, setScreenshotMode] = useState(false);
  
  // --- New State for Improvements ---
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportSelection, setExportSelection] = useState({
    summary: true,
    cashFlow: true,
    arrears: true,
    detailed: false
  });

  const handleClearFilters = () => {
    setStartDate(dayjs().subtract(6, 'months').startOf('month'));
    setEndDate(dayjs().endOf('month'));
    setSelectedBorrower(null);
    setIncludePaid(true);
    setIncludeActive(true);
    setIncludeOverdue(true);
    setIncludeDefaulted(true);
    setIsCompareMode(false);
  };

  const drillDown = (status) => {
    setIncludeActive(status === 'Active' || status === 'All');
    setIncludePaid(status === 'Paid' || status === 'All');
    setIncludeOverdue(status === 'Overdue' || status === 'All');
    setIncludeDefaulted(status === 'Defaulted' || status === 'All');
    setActiveTab(3); // Switch to Detailed Loan List
    showSnackbar(`Filtering for ${status} loans`, 'info');
  };

  const getDisplayBorrowerInfo = useCallback((loan) => {
    if (loan.borrowerId) {
      const borrower = borrowers.find(b => b.id === loan.borrowerId);
      return { name: borrower?.name, phone: borrower?.phone };
    } else {
      // Old loan format
      return { name: loan.borrower, phone: loan.phone };
    }
  }, [borrowers]);

  useEffect(() => {
    if (!payments && !loadingPayments) {
      getAllPayments();
    }
  }, [payments, loadingPayments, getAllPayments]);

  // --- Memoized Filtered Data ---
  const filteredLoansForReports = useMemo(() => {
    if (loadingLoans || !loans) return [];

    return loans
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
  }, [loans, startDate, endDate, includePaid, includeActive, includeOverdue, includeDefaulted, selectedBorrower, loadingLoans, getDisplayBorrowerInfo]);


  // --- REPORT 1: Loan Portfolio Summary ---
  const portfolioSummary = useMemo(() => {
    if (loadingLoans || !loans) return {
      totalLoans: 0,
      activeLoans: 0,
      paidLoans: 0,
      overdueLoans: 0,
      defaultedLoans: 0,
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
    let defaultedLoans = 0;
    let totalPrincipalDisbursed = 0;
    let totalInterestAccrued = 0;
    let totalOutstanding = 0;
    let totalRepaid = 0;

    filteredLoansForReports.forEach(loan => {
      const status = calcStatus(loan);
      if (status === "Active") activeLoans++;
      else if (status === "Paid") paidLoans++;
      else if (status === "Overdue") overdueLoans++;
      else if (status === "Defaulted") defaultedLoans++;

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
      defaultedLoans,
      totalPrincipalDisbursed,
      totalInterestAccrued,
      totalOutstanding,
      totalRepaid,
      portfolioYield,
      repaymentRate,
      defaultRate,
    };
  }, [filteredLoansForReports, loans, loadingLoans]);

  // --- REPORT 1.1: Previous Period Comparison ---
  const prevPeriodSummary = useMemo(() => {
    if (!isCompareMode || loadingLoans || !loans) return null;

    const diff = endDate.diff(startDate, 'day');
    const prevStart = startDate.subtract(diff + 1, 'day');
    const prevEnd = startDate.subtract(1, 'day');

    const prevLoans = loans.filter(l => {
        const d = dayjs(l.startDate);
        return d.isBetween(prevStart, prevEnd, 'day', '[]');
    });

    let totalPrincipalDisbursed = 0;
    let totalRepaid = 0;
    let totalInterestAccrued = 0;

    prevLoans.forEach(loan => {
      totalPrincipalDisbursed += Number(loan.principal || 0);
      totalRepaid += Number(loan.repaidAmount || 0);
      totalInterestAccrued += Number(loan.interest || 0);
    });

    return {
      disbursed: totalPrincipalDisbursed,
      repaid: totalRepaid,
      interest: totalInterestAccrued,
      count: prevLoans.length
    };
  }, [isCompareMode, loans, loadingLoans, startDate, endDate]);

  const handleShareSummary = () => {
    const message = `Loan Summary (${startDate.format('MMM D')} - ${endDate.format('MMM D')}):
- Total Repaid: ZMW ${portfolioSummary.totalRepaid.toFixed(2)}
- Total Disbursed: ZMW ${portfolioSummary.totalPrincipalDisbursed.toFixed(2)}
- Outstanding: ZMW ${portfolioSummary.totalOutstanding.toFixed(2)}
- Active Loans: ${portfolioSummary.activeLoans}
- Overdue: ${portfolioSummary.overdueLoans}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // --- REPORT 2: Arrears Aging Analysis ---
  const arrearsAgingReport = useMemo(() => {
    if (loadingLoans || !loans) return { buckets: {}, list: [], chartData: [] };

    // Calculate overdue frequency for Risk Hotspots
    const overdueCounts = loans.reduce((acc, l) => {
        if (calcStatus(l) === 'Overdue') {
            const borrowerName = getDisplayBorrowerInfo(l).name;
            acc[borrowerName] = (acc[borrowerName] || 0) + 1;
        }
        return acc;
    }, {});

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
      if (status === "Overdue" || status === "Defaulted") {
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
          overdueFrequency: overdueCounts[loan.borrower] || 0
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
  }, [filteredLoansForReports, loans, loadingLoans, getDisplayBorrowerInfo]);


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

    const inflows = payments
      .filter(p => {
        const paymentDate = dayjs(p.date);
        return paymentDate.isBetween(startDate, endDate, 'day', '[]');
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

  // --- REPORT 5: Cost of Default ---
  const costOfDefaultReport = useMemo(() => {
    const defaultedLoans = filteredLoansForReports.filter(loan => loan.status === 'Defaulted');
    const totalCostOfDefault = defaultedLoans.reduce((acc, loan) => {
      return acc + (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0));
    }, 0);

    const costByBorrower = defaultedLoans.reduce((acc, loan) => {
      const outstanding = Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0);
      if (acc[loan.borrower]) {
        acc[loan.borrower] += outstanding;
      } else {
        acc[loan.borrower] = outstanding;
      }
      return acc;
    }, {});

    return {
      totalCostOfDefault,
      costByBorrower,
      defaultedLoans,
    };
  }, [filteredLoansForReports]);

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

  const exportCostOfDefault = useCallback(() => {
    const data = costOfDefaultReport.defaultedLoans.map(loan => ({
      'Borrower': loan.borrower,
      'Phone': loan.phone,
      'Outstanding Balance (ZMW)': (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0)).toFixed(2),
    }));
    exportToCsv(`Cost_Of_Default_Report_${dayjs().format('YYYYMMDD')}.csv`, data);
  }, [costOfDefaultReport]);

  const exportPortfolioSummaryPdf = useCallback(() => {
    const head = [['Metric', 'Value']];
    const body = [
        ['Total Loans (Selected Period)', portfolioSummary.totalLoans],
        ['Active Loans (Selected Period)', portfolioSummary.activeLoans],
        ['Paid Loans (Selected Period)', portfolioSummary.paidLoans],
        ['Overdue Loans (Selected Period)', portfolioSummary.overdueLoans],
        ['Total Principal Disbursed', portfolioSummary.totalPrincipalDisbursed.toFixed(2)],
        ['Total Interest Accrued', portfolioSummary.totalInterestAccrued.toFixed(2)],
        ['Total Outstanding Balance', portfolioSummary.totalOutstanding.toFixed(2)],
        ['Total Amount Repaid', portfolioSummary.totalRepaid.toFixed(2)],
    ];
    exportToPdf('Loan Portfolio Summary', head, body, `Portfolio_Summary_${dayjs().format('YYYYMMDD')}.pdf`);
  }, [portfolioSummary]);

  const exportArrearsAgingPdf = useCallback(() => {
    const head = [['Borrower', 'Phone', 'Outstanding', 'Due Date', 'Days Overdue']];
    const body = arrearsAgingReport.list.map(loan => [
        loan.borrower,
        loan.phone,
        loan.outstanding.toFixed(2),
        loan.dueDate,
        loan.daysOverdue,
    ]);
    exportToPdf('Arrears Aging Report', head, body, `Arrears_Aging_${dayjs().format('YYYYMMDD')}.pdf`);
  }, [arrearsAgingReport]);

  const exportDetailedLoanListPdf = useCallback(() => {
    const head = Object.keys(detailedLoanListReport[0] || {});
    const body = detailedLoanListReport.map(row => Object.values(row));
    exportToPdf('Detailed Loan List', [head], body, `Detailed_Loan_List_${dayjs().format('YYYYMMDD')}.pdf`);
  }, [detailedLoanListReport]);

  const exportCashFlowPdf = useCallback(() => {
    const head = [['Date', 'Type', 'Description', 'Amount (ZMW)']];
    const body = cashFlowReport.data.map(item => [
        item.date,
        item.type,
        item.description,
        item.amount.toFixed(2)
    ]);
    exportToPdf('Cash Flow Report', head, body, `Cash_Flow_${dayjs().format('YYYYMMDD')}.pdf`);
  }, [cashFlowReport]);
  
  const exportCostOfDefaultPdf = useCallback(() => {
    const head = [['Borrower', 'Phone', 'Outstanding Balance (ZMW)']];
    const body = costOfDefaultReport.defaultedLoans.map(loan => [
        loan.borrower,
        loan.phone,
        (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0)).toFixed(2),
    ]);
    exportToPdf('Cost of Default Report', head, body, `Cost_Of_Default_Report_${dayjs().format('YYYYMMDD')}.pdf`);
  }, [costOfDefaultReport]);

  const setDateRange = (unit, count) => {
    setStartDate(dayjs().subtract(count, unit).startOf(unit));
    setEndDate(dayjs().endOf(unit));
  };

  const setThisMonth = () => {
      setStartDate(dayjs().startOf('month'));
      setEndDate(dayjs().endOf('month'));
  }

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

  const ComparisonMetric = ({ current, previous, label, isCurrency = true }) => {
    if (!isCompareMode || previous === undefined || previous === null) return null;
    const diff = current - previous;
    const percent = previous > 0 ? (diff / previous) * 100 : 0;
    const isPositive = diff >= 0;
    
    return (
        <Typography variant="caption" sx={{ display: 'block', color: isPositive ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
            {isPositive ? '+' : ''}{isCurrency ? `ZMW ${diff.toFixed(2)}` : diff} ({percent.toFixed(1)}%)
        </Typography>
    );
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

    const loanStatusData = [
      { name: 'Active', value: portfolioSummary.activeLoans },
      { name: 'Paid', value: portfolioSummary.paidLoans },
      { name: 'Overdue', value: portfolioSummary.overdueLoans },
      { name: 'Defaulted', value: portfolioSummary.defaultedLoans },
    ];

    const LOAN_STATUS_COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#F44336'];

    return (
        <Box>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="reports tabs" sx={{ mb: 2 }}>
                <Tab label="Portfolio Summary" />
                <Tab label="Arrears Aging" />
                <Tab label="Cash Flow" />
                <Tab label="Detailed Loan List" />
                <Tab label="Cost of Default" />
            </Tabs>

            {activeTab === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Card elevation={2} sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                                <Stack spacing={1}>
                                    <Box>
                                        <Typography>Total Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{portfolioSummary.totalLoans}</Typography></Typography>
                                        <ComparisonMetric current={portfolioSummary.totalLoans} previous={prevPeriodSummary?.count} isCurrency={false} />
                                    </Box>
                                    <Box>
                                        <Typography>Active Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{portfolioSummary.activeLoans}</Typography></Typography>
                                    </Box>
                                    <Box>
                                        <Typography>Paid Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{portfolioSummary.paidLoans}</Typography></Typography>
                                    </Box>
                                    <Box>
                                        <Typography>Overdue Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{portfolioSummary.overdueLoans}</Typography></Typography>
                                    </Box>
                                    <Box>
                                        <Typography>Defaulted Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{portfolioSummary.defaultedLoans}</Typography></Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Box>
                                        <Typography>Total Principal Disbursed: <Typography component="span" fontWeight="bold" color="secondary.main">ZMW {portfolioSummary.totalPrincipalDisbursed.toFixed(2)}</Typography></Typography>
                                        <ComparisonMetric current={portfolioSummary.totalPrincipalDisbursed} previous={prevPeriodSummary?.disbursed} />
                                    </Box>
                                    <Box>
                                        <Typography>Total Interest Accrued: <Typography component="span" fontWeight="bold" color="secondary.main">ZMW {portfolioSummary.totalInterestAccrued.toFixed(2)}</Typography></Typography>
                                        <ComparisonMetric current={portfolioSummary.totalInterestAccrued} previous={prevPeriodSummary?.interest} />
                                    </Box>
                                    <Box>
                                        <Typography>Total Outstanding Balance: <Typography component="span" fontWeight="bold" color="secondary.main">ZMW {portfolioSummary.totalOutstanding.toFixed(2)}</Typography></Typography>
                                    </Box>
                                    <Box>
                                        <Typography>Total Amount Repaid: <Typography component="span" fontWeight="bold" color="secondary.main">ZMW {portfolioSummary.totalRepaid.toFixed(2)}</Typography></Typography>
                                        <ComparisonMetric current={portfolioSummary.totalRepaid} previous={prevPeriodSummary?.repaid} />
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6">Loan Status Distribution</Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie 
                                            data={loanStatusData} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            cx="50%" 
                                            cy="50%" 
                                            outerRadius={100} 
                                            label
                                            onClick={(data) => drillDown(data.name)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {loanStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={LOAN_STATUS_COLORS[index % LOAN_STATUS_COLORS.length]} />)}
                                        </Pie>
                                        <RechartsTooltip />
                                        <RechartsLegend />
                                    </PieChart>
                                </ResponsiveContainer>
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
                                    <BarChart 
                                        data={summaryChartData} 
                                        margin={{ top: 20, right: 20, bottom: 5, left: 20 }}
                                        onClick={(data) => data && data.activeLabel && drillDown('All')}
                                        style={{ cursor: 'pointer' }}
                                    >
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
                        <Stack direction="row" spacing={2}>
                            <Button variant="outlined" color="secondary" onClick={exportPortfolioSummary}>Export Summary CSV</Button>
                            <Button variant="contained" color="secondary" onClick={exportPortfolioSummaryPdf}>Export Summary PDF</Button>
                        </Stack>
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
                                <Typography variant="h6">Arrears Distribution by Amount</Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={arrearsAgingReport.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
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
                                        <TableCell align="right">Overdue Count</TableCell>
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
                                            <TableCell align="right">
                                                <Chip 
                                                    label={loan.overdueFrequency} 
                                                    size="small" 
                                                    color={loan.overdueFrequency > 1 ? "error" : "default"}
                                                    variant={loan.overdueFrequency > 1 ? "filled" : "outlined"}
                                                />
                                            </TableCell>
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
                        <Stack direction="row" spacing={2}>
                            <Button variant="outlined" color="secondary" onClick={exportArrearsAging}>Export Arrears CSV</Button>
                            <Button variant="contained" color="secondary" onClick={exportArrearsAgingPdf}>Export Arrears PDF</Button>
                        </Stack>
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
                                <Bar dataKey="amount">
                                    {cashFlowReport.data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? theme.palette.success.main : theme.palette.error.main} />
                                    ))}
                                </Bar>
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
                    <Stack direction="row" spacing={2} mt={2}>
                        <Button variant="outlined" color="secondary" onClick={exportCashFlow}>Export Cash Flow CSV</Button>
                        <Button variant="contained" color="secondary" onClick={exportCashFlowPdf}>Export Cash Flow PDF</Button>
                    </Stack>
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
                    <Stack direction="row" spacing={2} mt={2}>
                        <Button variant="outlined" color="secondary" onClick={exportDetailedLoanList}>Export Detailed List CSV</Button>
                        <Button variant="contained" color="secondary" onClick={exportDetailedLoanListPdf}>Export Detailed List PDF</Button>
                    </Stack>
                </Box>
            )}

            {activeTab === 4 && (
                <Box>
                    <CostOfDefault loans={filteredLoansForReports} />
                    <Stack direction="row" spacing={2} mt={2}>
                        <Button variant="outlined" color="secondary" onClick={exportCostOfDefault}>Export Cost of Default CSV</Button>
                        <Button variant="contained" color="secondary" onClick={exportCostOfDefaultPdf}>Export Cost of Default PDF</Button>
                    </Stack>
                </Box>
            )}
        </Box>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: isMobile ? 1 : 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reports & Analytics
        </Typography>

        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6} lg={4}>
              <Autocomplete
                options={borrowers || []}
                getOptionLabel={(option) => option.name}
                value={selectedBorrower}
                onChange={(event, newValue) => {
                  setSelectedBorrower(newValue);
                }}
                renderInput={(params) => <TextField {...params} label="Filter by Borrower" size="small" sx={filterInputStyles} />}
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <Stack direction="row" spacing={1}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} size="small" fullWidth sx={filterInputStyles} />}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  renderInput={(params) => <TextField {...params} size="small" fullWidth sx={filterInputStyles} />}
                />
              </Stack>
            </Grid>
            <Grid item xs={12} lg={4}>
                <Stack direction="row" spacing={1} justifyContent="flex-start" flexWrap="wrap">
                    <Button size="small" onClick={setThisMonth}>This Month</Button>
                    <Button size="small" onClick={() => setDateRange('month', 1)}>Last Month</Button>
                    <Button size="small" onClick={() => setDateRange('day', 90)}>Last 90 Days</Button>
                    <Button size="small" onClick={() => setDateRange('year', 0)}>This Year</Button>
                </Stack>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" flexWrap="wrap">
                <Stack direction="row" spacing={0} flexWrap="wrap">
                  <FormControlLabel control={<Checkbox checked={includeActive} onChange={(e) => setIncludeActive(e.target.checked)} size="small" sx={{ '&.Mui-checked': { color: theme.palette.secondary.main } }} />} label="Active" />
                  <FormControlLabel control={<Checkbox checked={includePaid} onChange={(e) => setIncludePaid(e.target.checked)} size="small" sx={{ '&.Mui-checked': { color: theme.palette.secondary.main } }} />} label="Paid" />
                  <FormControlLabel control={<Checkbox checked={includeOverdue} onChange={(e) => setIncludeOverdue(e.target.checked)} size="small" sx={{ '&.Mui-checked': { color: theme.palette.secondary.main } }} />} label="Overdue" />
                  <FormControlLabel control={<Checkbox checked={includeDefaulted} onChange={(e) => setIncludeDefaulted(e.target.checked)} size="small" sx={{ '&.Mui-checked': { color: theme.palette.secondary.main } }} />} label="Defaulted" />
                  <Button onClick={handleClearFilters}>Clear Filters</Button>
                </Stack>
                <FormControlLabel
                    control={<Switch checked={isCompareMode} onChange={(e) => setIsCompareMode(e.target.checked)} color="secondary" />}
                    label="Comparison Mode"
                />
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end" flexWrap="wrap">
                <Button
                  startIcon={<WhatsAppIcon />}
                  onClick={handleShareSummary}
                  variant="outlined"
                  color="success"
                >
                  Share Summary
                </Button>
                <Button
                  startIcon={<PictureAsPdfIcon />}
                  onClick={() => setExportDialogOpen(true)}
                  variant="contained"
                  color="secondary"
                >
                  Generate Full Report
                </Button>
                <Button
                  startIcon={<CameraAltIcon />}
                  onClick={() => setScreenshotMode(!screenshotMode)}
                  variant={screenshotMode ? "contained" : "outlined"}
                  color="secondary"
                >
                  {screenshotMode ? "Exit Screenshot Mode" : "Screenshot Mode"}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <div className={screenshotMode ? "screenshot-container" : ""}>
          {renderReportContent()}
        </div>

        {/* Master Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
            <DialogTitle>Generate Combined Report</DialogTitle>
            <DialogContent>
                <Typography variant="body2" sx={{ mb: 2 }}>Select sections to include in your combined PDF report.</Typography>
                <FormGroup>
                    <FormControlLabel control={<Checkbox checked={exportSelection.summary} onChange={(e) => setExportSelection({...exportSelection, summary: e.target.checked})} />} label="Portfolio Summary" />
                    <FormControlLabel control={<Checkbox checked={exportSelection.cashFlow} onChange={(e) => setExportSelection({...exportSelection, cashFlow: e.target.checked})} />} label="Cash Flow Analysis" />
                    <FormControlLabel control={<Checkbox checked={exportSelection.arrears} onChange={(e) => setExportSelection({...exportSelection, arrears: e.target.checked})} />} label="Arrears Aging" />
                    <FormControlLabel control={<Checkbox checked={exportSelection.detailed} onChange={(e) => setExportSelection({...exportSelection, detailed: e.target.checked})} />} label="Detailed Loan List" />
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
                <Button 
                    onClick={() => {
                        if (exportSelection.summary) exportPortfolioSummaryPdf();
                        if (exportSelection.cashFlow) exportCashFlowPdf();
                        if (exportSelection.arrears) exportArrearsAgingPdf();
                        if (exportSelection.detailed) exportDetailedLoanListPdf();
                        setExportDialogOpen(false);
                        showSnackbar("Report generation started", "success");
                    }} 
                    variant="contained" 
                    color="primary"
                >
                    Generate PDF
                </Button>
            </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
