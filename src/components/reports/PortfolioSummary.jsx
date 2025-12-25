import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
  Button,
  Box,
  useTheme,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function PortfolioSummary({ portfolioSummary, arrearsAgingReport, exportPortfolioSummary, exportPortfolioSummaryPdf }) {
  const theme = useTheme();
  const summaryChartData = [
    { name: 'Principal Disbursed', value: portfolioSummary.totalPrincipalDisbursed },
    { name: 'Interest Accrued', value: portfolioSummary.totalInterestAccrued },
    { name: 'Amount Repaid', value: portfolioSummary.totalRepaid },
  ];

  return (
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
              <Typography>Defaulted Loans: <Typography component="span" fontWeight="bold" color="secondary.main">{portfolioSummary.defaultedLoans}</Typography></Typography>
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
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" color="secondary" onClick={exportPortfolioSummary}>Export Summary CSV</Button>
          <Button variant="contained" color="secondary" onClick={exportPortfolioSummaryPdf}>Export Summary PDF</Button>
        </Stack>
      </Grid>
    </Grid>
  );
}
