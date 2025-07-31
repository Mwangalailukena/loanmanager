import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Stack,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField, // Keep TextField for date inputs
  useMediaQuery,
  useTheme,
  Divider,
  FormControlLabel, // Added for Checkbox
  Checkbox, // Added for Checkbox
} from "@mui/material";

// REMOVE THESE IMPORTS:
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

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

export default function ReportsPage() {
  const { loans, loadingLoans, payments, loadingPayments, getAllPayments } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // --- Filters State ---
  const [reportType, setReportType] = useState("portfolioSummary");
  // Change state to store string dates for TextField type="date"
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

    // Parse string dates back to dayjs objects for comparison
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

    return {
      totalLoans: filteredLoansForReports.length,
      activeLoans,
      paidLoans,
      overdueLoans,
      totalPrincipalDisbursed,
      totalInterestAccrued,
      totalOutstanding,
      totalRepaid,
    };
  }, [filteredLoansForReports, loans, loadingLoans]);


  // --- REPORT 2: Arrears Aging Analysis ---
  const arrearsAgingReport = useMemo(() => {
    if (loadingLoans || !loans) return { buckets: {}, list: [] };

    const now = dayjs();
    const buckets = {
      '1-7 Days Overdue': [],
      '8-14 Days Overdue': [],
      '15-30 Days Overdue': [],
      '30+ Days Overdue': [],
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
          buckets['1-7 Days Overdue'].push(loanData);
        } else if (daysOverdue >= 8 && daysOverdue <= 14) {
          buckets['8-14 Days Overdue'].push(loanData);
        } else if (daysOverdue >= 15 && daysOverdue <= 30) {
          buckets['15-30 Days Overdue'].push(loanData);
        } else if (daysOverdue > 30) {
          buckets['30+ Days Overdue'].push(loanData);
        }
        overdueLoansList.push(loanData);
      }
    });

    overdueLoansList.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return { buckets, list: overdueLoansList };
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


  const renderReportContent = () => {
    if (loadingLoans) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
          <Typography ml={2} color="text.secondary">Loading loan data for reports...</Typography>
        </Box>
      );
    }
    if (filteredLoansForReports.length === 0 && reportType !== 'portfolioSummary') {
      return (
        <Typography variant="h6" align="center" mt={4} color="text.secondary">
          No loan data found for the selected filters.
        </Typography>
      );
    }

    switch (reportType) {
      case "portfolioSummary":
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Loan Portfolio Summary</Typography>
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Stack direction="column" spacing={1}>
                <Typography variant="subtitle1" fontWeight="bold">Summary for Loans from {dayjs(startDate).format('DD MMM YYYY')} to {dayjs(endDate).format('DD MMM YYYY')}</Typography>
                <Divider />
                <Typography>Total Loans: <Typography component="span" fontWeight="bold">{portfolioSummary.totalLoans}</Typography></Typography>
                <Typography>Active Loans: <Typography component="span" fontWeight="bold">{portfolioSummary.activeLoans}</Typography></Typography>
                <Typography>Paid Loans: <Typography component="span" fontWeight="bold">{portfolioSummary.paidLoans}</Typography></Typography>
                <Typography>Overdue Loans: <Typography component="span" fontWeight="bold">{portfolioSummary.overdueLoans}</Typography></Typography>
                <Divider />
                <Typography>Total Principal Disbursed: <Typography component="span" fontWeight="bold">ZMW {portfolioSummary.totalPrincipalDisbursed.toFixed(2)}</Typography></Typography>
                <Typography>Total Interest Accrued: <Typography component="span" fontWeight="bold">ZMW {portfolioSummary.totalInterestAccrued.toFixed(2)}</Typography></Typography>
                <Typography>Total Outstanding Balance: <Typography component="span" fontWeight="bold">ZMW {portfolioSummary.totalOutstanding.toFixed(2)}</Typography></Typography>
                <Typography>Total Amount Repaid: <Typography component="span" fontWeight="bold">ZMW {portfolioSummary.totalRepaid.toFixed(2)}</Typography></Typography>
              </Stack>
            </Paper>
            <Button variant="outlined" onClick={exportPortfolioSummary}>Export Summary CSV</Button>
          </Box>
        );

      case "arrearsAging":
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Arrears Aging Report</Typography>
            <TableContainer component={Paper} elevation={1} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Bucket</TableCell>
                    <TableCell align="right">Number of Loans</TableCell>
                    <TableCell align="right">Total Outstanding (ZMW)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(arrearsAgingReport.buckets).map(([bucket, loansInBucket]) => (
                    <TableRow key={bucket}>
                      <TableCell>{bucket}</TableCell>
                      <TableCell align="right">{loansInBucket.length}</TableCell>
                      <TableCell align="right">
                        {loansInBucket.reduce((sum, loan) => sum + loan.outstanding, 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom>Detailed Overdue Loans List</Typography>
            {arrearsAgingReport.list.length === 0 ? (
              <Typography color="text.secondary">No overdue loans found based on current filters.</Typography>
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
                      <TableCell align="right">Repaid Amount</TableCell>
                      <TableCell align="right">Outstanding</TableCell>
                      <TableCell>Start Date</TableCell>
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
                        <TableCell align="right">{loan.interest.toFixed(2)}</TableCell>
                        <TableCell align="right">{loan.totalRepayable.toFixed(2)}</TableCell>
                        <TableCell align="right">{loan.repaidAmount.toFixed(2)}</TableCell>
                        <TableCell align="right">{loan.outstanding.toFixed(2)}</TableCell>
                        <TableCell>{loan.startDate}</TableCell>
                        <TableCell>{loan.dueDate}</TableCell>
                        <TableCell align="right">{loan.daysOverdue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Button variant="outlined" sx={{ mt: 2 }} onClick={exportArrearsAging}>Export Arrears CSV</Button>
          </Box>
        );

      case "detailedLoanList":
        return (
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
            <Button variant="outlined" sx={{ mt: 2 }} onClick={exportDetailedLoanList}>Export Detailed List CSV</Button>
          </Box>
        );

      default:
        return <Typography>Select a report type from the dropdown to view data.</Typography>;
    }
  };

  return (
    // REMOVE LocalizationProvider wrapper, as it's for @mui/x-date-pickers
    // <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: isMobile ? 1 : 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reports & Analytics
        </Typography>

        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Stack direction={isMobile ? "column" : "row"} spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="portfolioSummary">Loan Portfolio Summary</MenuItem>
                <MenuItem value="arrearsAging">Arrears Aging Report</MenuItem>
                <MenuItem value="detailedLoanList">Detailed Loan List</MenuItem>
              </Select>
            </FormControl>

            {/* Replace DatePicker with TextField type="date" */}
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth={isMobile}
              value={startDate} // Value is a string 'YYYY-MM-DD'
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }} // Makes label float correctly for date input
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              fullWidth={isMobile}
              value={endDate} // Value is a string 'YYYY-MM-DD'
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            {reportType === "detailedLoanList" && (
                <Stack direction="row" spacing={1} sx={{ml: isMobile ? 0 : 2}}>
                    <FormControlLabel
                        control={<Checkbox checked={includeActive} onChange={(e) => setIncludeActive(e.target.checked)} size="small" />}
                        label="Active"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={includePaid} onChange={(e) => setIncludePaid(e.target.checked)} size="small" />}
                        label="Paid"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={includeOverdue} onChange={(e) => setIncludeOverdue(e.target.checked)} size="small" />}
                        label="Overdue"
                    />
                </Stack>
            )}

          </Stack>
        </Paper>

        {renderReportContent()}
      </Box>
    // </LocalizationProvider>
  );
}
