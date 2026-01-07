import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
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
      Skeleton,
  } from "@mui/material";import {
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
  const { loans, loadingLoans, payments, loadingPayments, borrowers } = useFirestore();
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
  
  // --- Precomputed Report Data State ---
  const [isCalculating, setIsCalculating] = useState(true);
  const [reportData, setReportData] = useState({
    filteredLoans: [],
    portfolioSummary: {
      totalLoans: 0, activeLoans: 0, paidLoans: 0, overdueLoans: 0, defaultedLoans: 0,
      totalPrincipalDisbursed: 0, totalInterestAccrued: 0, totalOutstanding: 0, totalRepaid: 0,
      portfolioYield: 0, repaymentRate: 0, defaultRate: 0,
    },
    prevPeriodSummary: null,
    arrearsAging: { buckets: {}, list: [], chartData: [] },
    detailedLoanList: [],
    cashFlow: { data: [], totals: { totalInflow: 0, totalOutflow: 0, netCashFlow: 0 } },
    costOfDefault: { totalCostOfDefault: 0, costByBorrower: {}, defaultedLoans: [] }
  });

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
    const calculateReports = () => {
      if (!loans || !payments || !borrowers) return;
      setIsCalculating(true);

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

      // 3. Previous Period comparison
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
      const overdueCounts = loans.reduce((acc, l) => {
          if (calcStatus(l) === 'Overdue') {
              const bName = getDisplayBorrowerInfo(l).name;
              acc[bName] = (acc[bName] || 0) + 1;
          }
          return acc;
      }, {});

      const now = dayjs();
      const buckets = { '1-7 Days': { loans: [], total: 0 }, '8-14 Days': { loans: [], total: 0 }, '15-30 Days': { loans: [], total: 0 }, '30+ Days': { loans: [], total: 0 } };
      const overdueList = [];

      filteredLoans.forEach(loan => {
        if (loan.status === "Overdue" || loan.status === "Defaulted") {
          const outstanding = (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0));
          if (outstanding <= 0) return;
          const daysOverdue = now.diff(dayjs(loan.dueDate), 'day');
          const loanData = { ...loan, outstanding, daysOverdue, overdueFrequency: overdueCounts[loan.borrower] || 0 };
          
          if (daysOverdue >= 1 && daysOverdue <= 7) { buckets['1-7 Days'].loans.push(loanData); buckets['1-7 Days'].total += outstanding; }
          else if (daysOverdue >= 8 && daysOverdue <= 14) { buckets['8-14 Days'].loans.push(loanData); buckets['8-14 Days'].total += outstanding; }
          else if (daysOverdue >= 15 && daysOverdue <= 30) { buckets['15-30 Days'].loans.push(loanData); buckets['15-30 Days'].total += outstanding; }
          else if (daysOverdue > 30) { buckets['30+ Days'].loans.push(loanData); buckets['30+ Days'].total += outstanding; }
          overdueList.push(loanData);
        }
      });
      overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);

      // 5. Cash Flow
      const inflows = payments
        .filter(p => dayjs(p.date).isBetween(startDate, endDate, 'day', '[]'))
        .map(p => ({ date: dayjs(p.date).format('YYYY-MM-DD'), type: 'Inflow (Payment)', amount: Number(p.amount || 0), description: `Payment for Loan ID: ${p.loanId}` }));
      const outflows = filteredLoans.map(l => ({ date: l.startDate, type: 'Outflow (Disbursement)', amount: -Number(l.principal || 0), description: `Loan to ${l.borrower}` }));
      const combinedCashFlow = [...inflows, ...outflows].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
      const tInflow = inflows.reduce((sum, item) => sum + item.amount, 0);
      const tOutflow = outflows.reduce((sum, item) => sum + item.amount, 0);

      // 6. Cost of Default
      const defaulted = filteredLoans.filter(l => l.status === 'Defaulted');
      const totalCoD = defaulted.reduce((acc, l) => acc + (Number(l.totalRepayable || 0) - Number(l.repaidAmount || 0)), 0);
      const costByB = defaulted.reduce((acc, l) => {
        const outstanding = Number(l.totalRepayable || 0) - Number(l.repaidAmount || 0);
        acc[l.borrower] = (acc[l.borrower] || 0) + outstanding;
        return acc;
      }, {});

      setReportData({
        filteredLoans,
        portfolioSummary,
        prevPeriodSummary,
        arrearsAging: { buckets, list: overdueList, chartData: Object.entries(buckets).map(([name, data]) => ({ name, value: data.total })) },
        detailedLoanList: filteredLoans.map(l => ({
          'Loan ID': l.id, 'Borrower Name': l.borrower, 'Phone Number': l.phone,
          'Principal Amount (ZMW)': Number(l.principal || 0).toFixed(2),
          'Interest Amount (ZMW)': Number(l.interest || 0).toFixed(2),
          'Total Repayable (ZMW)': Number(l.totalRepayable || 0).toFixed(2),
          'Amount Repaid (ZMW)': Number(l.repaidAmount || 0).toFixed(2),
          'Outstanding Balance (ZMW)': (Number(l.totalRepayable || 0) - Number(l.repaidAmount || 0)).toFixed(2),
          'Start Date': l.startDate, 'Due Date': l.dueDate, 'Status': l.status,
          'Days Overdue': l.status === 'Overdue' ? dayjs().diff(dayjs(l.dueDate), 'day') : 0,
        })),
        cashFlow: { data: combinedCashFlow, totals: { totalInflow: tInflow, totalOutflow: Math.abs(tOutflow), netCashFlow: tInflow + tOutflow } },
        costOfDefault: { totalCostOfDefault: totalCoD, costByBorrower: costByB, defaultedLoans: defaulted }
      });
      setIsCalculating(false);
    };

    calculateReports();
  }, [loans, payments, borrowers, startDate, endDate, includePaid, includeActive, includeOverdue, includeDefaulted, selectedBorrower, isCompareMode, getDisplayBorrowerInfo]);

  const handleShareSummary = () => {
    const { portfolioSummary } = reportData;
    const message = `Loan Summary (${startDate.format('MMM D')} - ${endDate.format('MMM D')}):
- Total Repaid: ZMW ${portfolioSummary.totalRepaid.toFixed(2)}
- Total Disbursed: ZMW ${portfolioSummary.totalPrincipalDisbursed.toFixed(2)}
- Outstanding: ZMW ${portfolioSummary.totalOutstanding.toFixed(2)}
- Active Loans: ${portfolioSummary.activeLoans}
- Overdue: ${portfolioSummary.overdueLoans}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // --- Export Functions ---
  const exportPortfolioSummary = useCallback(() => {
    const { portfolioSummary } = reportData;
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
  }, [reportData]);

  const exportArrearsAging = useCallback(() => {
    const { arrearsAging } = reportData;
    const data = arrearsAging.list.map(loan => ({
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
  }, [reportData]);

  const exportDetailedLoanList = useCallback(() => {
    exportToCsv(`Detailed_Loan_List_${dayjs().format('YYYYMMDD')}.csv`, reportData.detailedLoanList);
  }, [reportData]);

  const exportCashFlow = useCallback(() => {
    const { cashFlow } = reportData;
    const dataForExport = cashFlow.data.map(item => ({
        'Date': item.date,
        'Type': item.type,
        'Description': item.description,
        'Amount (ZMW)': item.amount.toFixed(2)
    }));
    exportToCsv(`Cash_Flow_Report_${dayjs().format('YYYYMMDD')}.csv`, dataForExport);
  }, [reportData]);

  const exportCostOfDefault = useCallback(() => {
    const { costOfDefault } = reportData;
    const data = costOfDefault.defaultedLoans.map(loan => ({
      'Borrower': loan.borrower,
      'Phone': loan.phone,
      'Outstanding Balance (ZMW)': (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0)).toFixed(2),
    }));
    exportToCsv(`Cost_Of_Default_Report_${dayjs().format('YYYYMMDD')}.csv`, data);
  }, [reportData]);

  const exportPortfolioSummaryPdf = useCallback(() => {
    const { portfolioSummary } = reportData;
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
  }, [reportData]);

  const exportArrearsAgingPdf = useCallback(() => {
    const { arrearsAging } = reportData;
    const head = [['Borrower', 'Phone', 'Outstanding', 'Due Date', 'Days Overdue']];
    const body = arrearsAging.list.map(loan => [
        loan.borrower,
        loan.phone,
        loan.outstanding.toFixed(2),
        loan.dueDate,
        loan.daysOverdue,
    ]);
    exportToPdf('Arrears Aging Report', head, body, `Arrears_Aging_${dayjs().format('YYYYMMDD')}.pdf`);
  }, [reportData]);

  const exportDetailedLoanListPdf = useCallback(() => {
    const { detailedLoanList } = reportData;
    const head = Object.keys(detailedLoanList[0] || {});
    const body = detailedLoanList.map(row => Object.values(row));
    exportToPdf('Detailed Loan List', [head], body, `Detailed_Loan_List_${dayjs().format('YYYYMMDD')}.pdf`);
  }, [reportData]);

  const exportCashFlowPdf = useCallback(() => {
    const { cashFlow } = reportData;
    const head = [['Date', 'Type', 'Description', 'Amount (ZMW)']];
    const body = cashFlow.data.map(item => [
        item.date,
        item.type,
        item.description,
        item.amount.toFixed(2)
    ]);
    exportToPdf('Cash Flow Report', head, body, `Cash_Flow_${dayjs().format('YYYYMMDD')}.pdf`);
  }, [reportData]);
  
  const exportCostOfDefaultPdf = useCallback(() => {
    const { costOfDefault } = reportData;
    const head = [['Borrower', 'Phone', 'Outstanding Balance (ZMW)']];
    const body = costOfDefault.defaultedLoans.map(loan => [
        loan.borrower,
        loan.phone,
        (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0)).toFixed(2),
    ]);
    exportToPdf('Cost of Default Report', head, body, `Cost_Of_Default_Report_${dayjs().format('YYYYMMDD')}.pdf`);
  }, [reportData]);

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
    const isLoading = loadingLoans || loadingPayments || isCalculating;
    const { 
        portfolioSummary, 
        prevPeriodSummary, 
        arrearsAging, 
        cashFlow, 
        detailedLoanList, 
        filteredLoans
    } = reportData;

    if (!isLoading && filteredLoans.length === 0 && activeTab !== 0) {
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
                                        <Typography>Total Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={40} display="inline-block" /> : portfolioSummary.totalLoans}</Typography></Typography>
                                        <ComparisonMetric current={portfolioSummary.totalLoans} previous={prevPeriodSummary?.count} isCurrency={false} />
                                    </Box>
                                    <Box>
                                        <Typography>Active Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={40} display="inline-block" /> : portfolioSummary.activeLoans}</Typography></Typography>
                                    </Box>
                                    <Box>
                                        <Typography>Paid Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={40} display="inline-block" /> : portfolioSummary.paidLoans}</Typography></Typography>
                                    </Box>
                                    <Box>
                                        <Typography>Overdue Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={40} display="inline-block" /> : portfolioSummary.overdueLoans}</Typography></Typography>
                                    </Box>
                                    <Box>
                                        <Typography>Defaulted Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={40} display="inline-block" /> : portfolioSummary.defaultedLoans}</Typography></Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Box>
                                        <Typography>Total Principal Disbursed: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={100} display="inline-block" /> : `ZMW ${portfolioSummary.totalPrincipalDisbursed.toFixed(2)}`}</Typography></Typography>
                                        <ComparisonMetric current={portfolioSummary.totalPrincipalDisbursed} previous={prevPeriodSummary?.disbursed} />
                                    </Box>
                                    <Box>
                                        <Typography>Total Interest Accrued: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={100} display="inline-block" /> : `ZMW ${portfolioSummary.totalInterestAccrued.toFixed(2)}`}</Typography></Typography>
                                        <ComparisonMetric current={portfolioSummary.totalInterestAccrued} previous={prevPeriodSummary?.interest} />
                                    </Box>
                                    <Box>
                                        <Typography>Total Outstanding Balance: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={100} display="inline-block" /> : `ZMW ${portfolioSummary.totalOutstanding.toFixed(2)}`}</Typography></Typography>
                                    </Box>
                                    <Box>
                                        <Typography>Total Amount Repaid: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={100} display="inline-block" /> : `ZMW ${portfolioSummary.totalRepaid.toFixed(2)}`}</Typography></Typography>
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
                                {isLoading ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', my: 2 }} /> : (
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
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6">Portfolio Health</Typography>
                                <Stack spacing={1}>
                                    <Typography>Portfolio Yield: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={60} display="inline-block" /> : `${(portfolioSummary.portfolioYield * 100).toFixed(2)}%`}</Typography></Typography>
                                    <Typography>Repayment Rate: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={60} display="inline-block" /> : `${(portfolioSummary.repaymentRate * 100).toFixed(2)}%`}</Typography></Typography>
                                    <Typography>Default Rate: <Typography component="span" fontWeight="bold" color="secondary.main">{isLoading ? <Skeleton width={60} display="inline-block" /> : `${(portfolioSummary.defaultRate * 100).toFixed(2)}%`}</Typography></Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={2} sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6">Financial Overview</Typography>
                                {isLoading ? <Skeleton variant="rectangular" height={200} /> : (
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
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12}>
                        <Stack direction="row" spacing={2}>
                            <Button variant="outlined" color="secondary" onClick={exportPortfolioSummary} disabled={isLoading}>Export Summary CSV</Button>
                            <Button variant="contained" color="secondary" onClick={exportPortfolioSummaryPdf} disabled={isLoading}>Export Summary PDF</Button>
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
                                    {isLoading ? [...Array(4)].map((_, i) => (
                                        <TableRow key={i}><TableCell><Skeleton /></TableCell><TableCell><Skeleton /></TableCell><TableCell><Skeleton /></TableCell></TableRow>
                                    )) : Object.entries(arrearsAging.buckets).map(([bucket, data]) => (
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
                                {isLoading ? <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} /> : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie data={arrearsAging.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                                                {arrearsAging.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />)}
                                            </Pie>
                                            <RechartsTooltip formatter={(value) => `ZMW ${value.toFixed(2)}`} />
                                            <RechartsLegend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
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
                                    {isLoading ? [...Array(5)].map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={7}><Skeleton /></TableCell></TableRow>
                                    )) : arrearsAging.list.map((loan) => (
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
                            <Button variant="outlined" color="secondary" onClick={exportArrearsAging} disabled={isLoading}>Export Arrears CSV</Button>
                            <Button variant="contained" color="secondary" onClick={exportArrearsAgingPdf} disabled={isLoading}>Export Arrears PDF</Button>
                        </Stack>
                    </Grid>
                </Grid>
            )}

            {activeTab === 2 && (
                <Box>
                    <Typography variant="h6" gutterBottom>Cash Flow Report</Typography>
                    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                        {isLoading ? <Skeleton variant="rectangular" height={200} /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={cashFlow.data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <RechartsTooltip />
                                    <RechartsLegend />
                                    <Bar dataKey="amount">
                                        {cashFlow.data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? theme.palette.success.main : theme.palette.error.main} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Paper>
                    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                        <Stack direction="row" spacing={4}>
                            <Box>
                                <Typography color="text.secondary">Total Inflow (Payments)</Typography>
                                <Typography variant="h6" color="success.main">{isLoading ? <Skeleton width={80} /> : `ZMW ${cashFlow.totals.totalInflow.toFixed(2)}`}</Typography>
                            </Box>
                            <Box>
                                <Typography color="text.secondary">Total Outflow (Disbursed)</Typography>
                                <Typography variant="h6" color="error.main">{isLoading ? <Skeleton width={80} /> : `ZMW ${cashFlow.totals.totalOutflow.toFixed(2)}`}</Typography>
                            </Box>
                            <Box>
                                <Typography color="text.secondary">Net Cash Flow</Typography>
                                <Typography variant="h6" color={cashFlow.totals.netCashFlow >= 0 ? 'success.main' : 'error.main'}>
                                    {isLoading ? <Skeleton width={80} /> : `ZMW ${cashFlow.totals.netCashFlow.toFixed(2)}`}
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
                                {isLoading ? [...Array(5)].map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={4}><Skeleton /></TableCell></TableRow>
                                )) : cashFlow.data.map((item, index) => (
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
                        <Button variant="outlined" color="secondary" onClick={exportCashFlow} disabled={isLoading}>Export Cash Flow CSV</Button>
                        <Button variant="contained" color="secondary" onClick={exportCashFlowPdf} disabled={isLoading}>Export Cash Flow PDF</Button>
                    </Stack>
                </Box>
            )}

            {activeTab === 3 && (
                <Box>
                    <Typography variant="h6" gutterBottom>Detailed Loan List</Typography>
                    {isLoading ? <Skeleton variant="rectangular" height={400} /> : (
                        detailedLoanList.length === 0 ? (
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
                                        {detailedLoanList.map((loan) => (
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
                        )
                    )}
                    <Stack direction="row" spacing={2} mt={2}>
                        <Button variant="outlined" color="secondary" onClick={exportDetailedLoanList} disabled={isLoading}>Export Detailed List CSV</Button>
                        <Button variant="contained" color="secondary" onClick={exportDetailedLoanListPdf} disabled={isLoading}>Export Detailed List PDF</Button>
                    </Stack>
                </Box>
            )}

            {activeTab === 4 && (
                <Box>
                    {isLoading ? <Skeleton variant="rectangular" height={300} /> : <CostOfDefault loans={filteredLoans} />}
                    <Stack direction="row" spacing={2} mt={2}>
                        <Button variant="outlined" color="secondary" onClick={exportCostOfDefault} disabled={isLoading}>Export Cost of Default CSV</Button>
                        <Button variant="contained" color="secondary" onClick={exportCostOfDefaultPdf} disabled={isLoading}>Export Cost of Default PDF</Button>
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
