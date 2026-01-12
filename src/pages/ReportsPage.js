import React, { useState } from "react";
import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
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
  ToggleButtonGroup,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  TextField,
} from "@mui/material";
import {
  FilterList,
  ExpandMore as ExpandMoreIcon,
  PictureAsPdf as PdfIcon,
  CameraAlt as CameraIcon,
  WhatsApp as WhatsAppIcon,
  GetApp as DownloadIcon,
  ClearAll,
  Refresh,
} from '@mui/icons-material';
import { useFirestore } from "../contexts/FirestoreProvider";
import { useSnackbar } from "../components/SnackbarProvider";
import { useReportCalculations } from "../hooks/useReportCalculations";
import { exportToPdf } from "../utils/exportPDF";
import { exportToCsv } from "../utils/exportCSV";
import dayjs from "dayjs";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { alpha } from '@mui/material/styles';

// Modular Components
import PortfolioSummary from '../components/reports/PortfolioSummary';
import ArrearsAging from '../components/reports/ArrearsAging';
import CashFlow from '../components/reports/CashFlow';
import DetailedLoanList from '../components/reports/DetailedLoanList';
import CostOfDefault from '../components/reports/CostOfDefault';

export default function ReportsPage() {
  const { loans, loadingLoans, payments, loadingPayments, borrowers } = useFirestore();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const showSnackbar = useSnackbar();

  // --- UI States ---
  const [activeTab, setActiveTab] = useState(0);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(!isMobile);
  const [period, setPeriod] = useState('6months');

  // --- Filter States ---
  const [startDate, setStartDate] = useState(dayjs().subtract(6, 'months').startOf('month'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month'));
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [includePaid, setIncludePaid] = useState(true);
  const [includeActive, setIncludeActive] = useState(true);
  const [includeOverdue, setIncludeOverdue] = useState(true);
  const [includeDefaulted, setIncludeDefaulted] = useState(true);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const [exportSelection, setExportSelection] = useState({
    summary: true,
    cashFlow: true,
    arrears: true,
    detailed: false
  });

  // --- Calculations Hook ---
  const reportData = useReportCalculations(loans, payments, borrowers, {
    startDate, endDate, selectedBorrower, includePaid, includeActive, includeOverdue, includeDefaulted, isCompareMode
  });

  const { portfolioSummary, arrearsAging, cashFlow, detailedLoanList, prevPeriodSummary } = reportData;

  const handlePeriodChange = (event, newPeriod) => {
    if (!newPeriod) return;
    setPeriod(newPeriod);
    const end = dayjs().endOf('month');
    let start;
    switch (newPeriod) {
      case 'month': start = dayjs().startOf('month'); break;
      case 'lastMonth': start = dayjs().subtract(1, 'month').startOf('month'); break;
      case '90days': start = dayjs().subtract(90, 'day'); break;
      case 'year': start = dayjs().startOf('year'); break;
      case '6months': start = dayjs().subtract(6, 'months').startOf('month'); break;
      default: return;
    }
    setStartDate(start);
    setEndDate(end);
  };

  const handleClearFilters = () => {
    handlePeriodChange(null, '6months');
    setSelectedBorrower(null);
    setIncludePaid(true);
    setIncludeActive(true);
    setIncludeOverdue(true);
    setIncludeDefaulted(true);
    setIsCompareMode(false);
  };

  // --- Export Logic ---
  const triggerPdfExport = (title, head, body, filename) => {
    exportToPdf(title, head, body, filename);
    showSnackbar(`${title} PDF generated`, 'success');
  };

  const exportSummaryPdf = () => {
    const head = [['Metric', 'Value']];
    const body = [
      ['Total Loans', portfolioSummary.totalLoans],
      ['Total Disbursed', `ZMW ${portfolioSummary.totalPrincipalDisbursed.toFixed(2)}`],
      ['Total Repaid', `ZMW ${portfolioSummary.totalRepaid.toFixed(2)}`],
      ['Outstanding', `ZMW ${portfolioSummary.totalOutstanding.toFixed(2)}`],
    ];
    triggerPdfExport('Portfolio Summary', head, body, `Summary_${dayjs().format('YYYYMMDD')}.pdf`);
  };

  const handleShareWhatsApp = () => {
    const message = `*Loan Portfolio Report (${startDate.format('DD MMM')} - ${endDate.format('DD MMM')})*\n\n` +
      `• Total Disbursed: ZMW ${portfolioSummary.totalPrincipalDisbursed.toLocaleString()}\n` +
      `• Total Repaid: ZMW ${portfolioSummary.totalRepaid.toLocaleString()}\n` +
      `• Outstanding: ZMW ${portfolioSummary.totalOutstanding.toLocaleString()}\n` +
      `• Active Loans: ${portfolioSummary.activeLoans}\n` +
      `• Overdue: ${portfolioSummary.overdueLoans}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const isLoading = loadingLoans || loadingPayments;

  const exportActions = [
    { icon: <WhatsAppIcon />, name: 'Share WhatsApp', onClick: handleShareWhatsApp },
    { icon: <PdfIcon />, name: 'Generate Reports', onClick: () => setExportDialogOpen(true) },
    { icon: <CameraIcon />, name: screenshotMode ? 'Exit Screenshot' : 'Screenshot Mode', onClick: () => setScreenshotMode(!screenshotMode) },
  ];

  const filterChipSx = (active) => ({
    fontWeight: 700,
    borderRadius: 2,
    transition: 'all 0.2s',
    ...(active ? {
      bgcolor: alpha(theme.palette.secondary.main, 0.1),
      color: theme.palette.secondary.main,
      borderColor: theme.palette.secondary.main,
    } : {
      opacity: 0.6
    })
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ pb: 8 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
            Analytics
          </Typography>
          {!isMobile && (
            <Stack direction="row" spacing={1}>
               <Button startIcon={<Refresh />} onClick={() => window.location.reload()}>Refresh</Button>
            </Stack>
          )}
        </Stack>

        <Accordion 
          expanded={filterExpanded} 
          onChange={() => setFilterExpanded(!filterExpanded)}
          elevation={0}
          sx={{ 
            mb: 4, 
            borderRadius: '16px !important', 
            border: `1px solid ${theme.palette.divider}`,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterList color="action" />
              <Typography fontWeight={700}>Report Filters</Typography>
              {!filterExpanded && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  {startDate.format('MMM DD')} - {endDate.format('MMM DD')}
                </Typography>
              )}
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 3, pb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" gutterBottom display="block" sx={{ textTransform: 'uppercase' }}>
                  Date Range
                </Typography>
                <ToggleButtonGroup
                  value={period}
                  exclusive
                  onChange={handlePeriodChange}
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  <ToggleButton value="month">Month</ToggleButton>
                  <ToggleButton value="90days">90 Days</ToggleButton>
                  <ToggleButton value="6months">6 Months</ToggleButton>
                  <ToggleButton value="year">Year</ToggleButton>
                </ToggleButtonGroup>
                <Stack direction="row" spacing={1}>
                  <DatePicker
                    label="From"
                    value={startDate}
                    onChange={setStartDate}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                  />
                  <DatePicker
                    label="To"
                    value={endDate}
                    onChange={setEndDate}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                  />
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" gutterBottom display="block" sx={{ textTransform: 'uppercase' }}>
                  Borrower & Comparison
                </Typography>
                <Autocomplete
                  options={borrowers || []}
                  getOptionLabel={(option) => option.name}
                  value={selectedBorrower}
                  onChange={(_, val) => setSelectedBorrower(val)}
                  renderInput={(params) => <TextField {...params} label="Specific Borrower" size="small" />}
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={<Switch checked={isCompareMode} onChange={(e) => setIsCompareMode(e.target.checked)} color="secondary" />}
                  label={<Typography variant="body2" fontWeight={600}>Compare with Previous Period</Typography>}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" gutterBottom display="block" sx={{ textTransform: 'uppercase' }}>
                  Loan Status
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[ 
                    { label: 'Active', val: includeActive, set: setIncludeActive },
                    { label: 'Paid', val: includePaid, set: setIncludePaid },
                    { label: 'Overdue', val: includeOverdue, set: setIncludeOverdue },
                    { label: 'Defaulted', val: includeDefaulted, set: setIncludeDefaulted },
                  ].map(chip => (
                    <Chip
                      key={chip.label}
                      label={chip.label}
                      onClick={() => chip.set(!chip.val)}
                      variant={chip.val ? "filled" : "outlined"}
                      sx={filterChipSx(chip.val)}
                    />
                  ))}
                </Box>
                <Button 
                  startIcon={<ClearAll />}
                  onClick={handleClearFilters}
                  sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
                  color="inherit"
                >
                  Reset All Filters
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {isLoading ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}><Skeleton variant="rounded" height={200} sx={{ borderRadius: 4 }} /></Grid>
            <Grid item xs={12} md={4}><Skeleton variant="rounded" height={200} sx={{ borderRadius: 4 }} /></Grid>
            <Grid item xs={12}><Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} /></Grid>
          </Grid>
        ) : (
          <Box className={screenshotMode ? "screenshot-container" : ""}>
            <Tabs 
              value={activeTab} 
              onChange={(_, v) => setActiveTab(v)} 
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                mb: 4,
                '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
                '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }
              }}
            >
              <Tab label="Portfolio Summary" />
              <Tab label="Arrears Aging" />
              <Tab label="Cash Flow" />
              <Tab label="Detailed List" />
              <Tab label="Cost of Default" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {activeTab === 0 && (
                <PortfolioSummary 
                  portfolioSummary={portfolioSummary} 
                  arrearsAgingReport={arrearsAging}
                  prevPeriodSummary={prevPeriodSummary}
                  exportPortfolioSummary={() => exportToCsv('Summary.csv', [portfolioSummary])}
                  exportPortfolioSummaryPdf={exportSummaryPdf}
                />
              )}
              {activeTab === 1 && (
                <ArrearsAging 
                  arrearsAgingReport={arrearsAging}
                  exportArrearsAging={() => exportToCsv('Arrears.csv', arrearsAging.list)}
                  exportArrearsAgingPdf={() => triggerPdfExport('Arrears', [['Name', 'Amount']], arrearsAging.list.map(l => [l.borrower, l.outstanding]), 'Arrears.pdf')}
                />
              )}
              {activeTab === 2 && (
                <CashFlow 
                  cashFlowReport={cashFlow}
                  exportCashFlow={() => exportToCsv('Cashflow.csv', cashFlow.data)}
                  exportCashFlowPdf={() => triggerPdfExport('Cash Flow', [['Date', 'Amount']], cashFlow.data.map(d => [d.date, d.amount]), 'Cashflow.pdf')}
                />
              )}
              {activeTab === 3 && (
                <DetailedLoanList 
                  detailedLoanListReport={detailedLoanList}
                  exportDetailedLoanList={() => exportToCsv('Loans.csv', detailedLoanList)}
                  exportDetailedLoanListPdf={() => triggerPdfExport('Detailed Loans', [['ID', 'Name']], detailedLoanList.map(l => [l.id, l.borrowerName]), 'Loans.pdf')}
                />
              )}
              {activeTab === 4 && <CostOfDefault loans={loans.filter(l => l.status === 'Defaulted')} />}
            </Box>
          </Box>
        )}

        <SpeedDial
          ariaLabel="Report Actions"
          sx={{ position: 'fixed', bottom: isMobile ? 86 : 32, right: 32 }}
          icon={<SpeedDialIcon icon={<DownloadIcon />} openIcon={<Refresh />} />}
        >
          {exportActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
            />
          ))}
        </SpeedDial>

        {/* Master Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 800 }}>Export Configuration</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select the modules you wish to include in your generated PDF report.
            </Typography>
            <FormGroup>
              {Object.keys(exportSelection).map(key => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox 
                      checked={exportSelection[key]} 
                      onChange={(e) => setExportSelection({...exportSelection, [key]: e.target.checked})} 
                    />
                  }
                  label={<Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</Typography>}
                />
              ))}
            </FormGroup>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setExportDialogOpen(false)} color="inherit">Cancel</Button>
            <Button variant="contained" onClick={() => {
              if (exportSelection.summary) exportSummaryPdf();
              setExportDialogOpen(false);
            }} color="primary" startIcon={<PdfIcon />}>
              Generate PDF
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}