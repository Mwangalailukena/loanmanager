import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Button,
  Box,
  useTheme,
  Avatar,
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  AccountBalanceWallet, 
  AssignmentTurnedIn, 
  Receipt,
  Assessment
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { alpha } from '@mui/material/styles';

const MetricCard = ({ title, value, previousValue, icon, color, isCurrency = true }) => {
  const theme = useTheme();
  
  const diff = previousValue ? (value - previousValue) : 0;
  const percent = previousValue > 0 ? (diff / previousValue) * 100 : 0;
  const isPositive = diff >= 0;

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: alpha(color, 0.1), color: color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {isCurrency ? `ZMW ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
            </Typography>
            {previousValue !== undefined && previousValue !== null && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                {isPositive ? <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} /> : <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />}
                <Typography variant="caption" sx={{ color: isPositive ? 'success.main' : 'error.main', fontWeight: 700 }}>
                  {Math.abs(percent).toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs last period
                </Typography>
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default function PortfolioSummary({ 
  portfolioSummary, 
  arrearsAgingReport, 
  prevPeriodSummary,
  exportPortfolioSummary, 
  exportPortfolioSummaryPdf 
}) {
  const theme = useTheme();
  
  const summaryChartData = [
    { name: 'Disbursed', value: portfolioSummary.totalPrincipalDisbursed, color: theme.palette.primary.main },
    { name: 'Accrued', value: portfolioSummary.totalInterestAccrued, color: theme.palette.secondary.main },
    { name: 'Repaid', value: portfolioSummary.totalRepaid, color: theme.palette.success.main },
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard 
          title="Total Disbursed" 
          value={portfolioSummary.totalPrincipalDisbursed} 
          previousValue={prevPeriodSummary?.disbursed}
          icon={<AccountBalanceWallet />} 
          color={theme.palette.primary.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard 
          title="Total Repaid" 
          value={portfolioSummary.totalRepaid} 
          previousValue={prevPeriodSummary?.repaid}
          icon={<AssignmentTurnedIn />} 
          color={theme.palette.success.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard 
          title="Interest Accrued" 
          value={portfolioSummary.totalInterestAccrued} 
          previousValue={prevPeriodSummary?.interest}
          icon={<TrendingUp />} 
          color={theme.palette.secondary.main}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard 
          title="Outstanding" 
          value={portfolioSummary.totalOutstanding} 
          icon={<Receipt />} 
          color={theme.palette.warning.main}
        />
      </Grid>

      <Grid item xs={12} md={8}>
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Financial Overview</Typography>
            <Box sx={{ height: 350, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `K${value/1000}k`} />
                  <RechartsTooltip 
                    cursor={{fill: alpha(theme.palette.divider, 0.1)}}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: theme.shadows[3] }}
                    formatter={(value) => [`ZMW ${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                    {summaryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Stack spacing={3} sx={{ height: '100%' }}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Portfolio Health</Typography>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Portfolio Yield</Typography>
                  <Typography variant="h6" fontWeight={800}>{(portfolioSummary.portfolioYield * 100).toFixed(2)}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Repayment Rate</Typography>
                  <Typography variant="h6" fontWeight={800}>{(portfolioSummary.repaymentRate * 100).toFixed(2)}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Default Rate</Typography>
                  <Typography variant="h6" fontWeight={800} color="error.main">{(portfolioSummary.defaultRate * 100).toFixed(2)}%</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, flexGrow: 1 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Loan Status</Typography>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                {[
                  { label: 'Active', count: portfolioSummary.activeLoans, color: 'primary.main' },
                  { label: 'Paid', count: portfolioSummary.paidLoans, color: 'success.main' },
                  { label: 'Overdue', count: portfolioSummary.overdueLoans, color: 'warning.main' },
                  { label: 'Defaulted', count: portfolioSummary.defaultedLoans, color: 'error.main' },
                ].map((status) => (
                  <Box key={status.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: status.color }} />
                      <Typography variant="body2" fontWeight={500}>{status.label}</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight={700}>{status.count}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" color="secondary" onClick={exportPortfolioSummary} startIcon={<Assessment />}>Export CSV</Button>
          <Button variant="contained" color="secondary" onClick={exportPortfolioSummaryPdf} startIcon={<Assessment />}>Export PDF</Button>
        </Stack>
      </Grid>
    </Grid>
  );
}
