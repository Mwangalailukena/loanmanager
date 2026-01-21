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

const CustomBarChart = ({ data }) => {
  const theme = useTheme();
  
  const maxVal = Math.max(...data.map(d => d.value), 1) * 1.1;
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const stepX = innerWidth / data.length;
  const barWidth = stepX * 0.6;

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Y-Axis Labels & Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
          const val = (maxVal * tick).toFixed(0);
          const y = innerHeight * (1 - tick) + margin.top;
          return (
            <g key={i}>
              <text x={margin.left - 10} y={y + 5} textAnchor="end" fontSize="12" fill={theme.palette.text.secondary}>
                {val > 1000 ? `K${(val/1000).toFixed(0)}k` : val}
              </text>
              <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke={theme.palette.divider} strokeDasharray="4 4" />
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = margin.left + i * stepX + (stepX - barWidth) / 2;
          const barHeight = (d.value / maxVal) * innerHeight;
          return (
            <g key={i}>
              <rect 
                x={x} 
                y={innerHeight - barHeight + margin.top} 
                width={barWidth} 
                height={barHeight} 
                fill={d.color}
                rx={8}
              />
              <text 
                x={x + barWidth / 2} 
                y={innerHeight + margin.top + 25} 
                textAnchor="middle" 
                fontSize="12" 
                fill={theme.palette.text.primary}
                fontWeight="600"
              >
                {d.name}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
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
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard 
          title="Total Disbursed" 
          value={portfolioSummary.totalPrincipalDisbursed} 
          previousValue={prevPeriodSummary?.disbursed}
          icon={<AccountBalanceWallet />} 
          color={theme.palette.primary.main}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard 
          title="Total Repaid" 
          value={portfolioSummary.totalRepaid} 
          previousValue={prevPeriodSummary?.repaid}
          icon={<AssignmentTurnedIn />} 
          color={theme.palette.success.main}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard 
          title="Interest Accrued" 
          value={portfolioSummary.totalInterestAccrued} 
          previousValue={prevPeriodSummary?.interest}
          icon={<TrendingUp />} 
          color={theme.palette.secondary.main}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard 
          title="Outstanding" 
          value={portfolioSummary.totalOutstanding} 
          icon={<Receipt />} 
          color={theme.palette.warning.main}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Financial Overview</Typography>
            <Box sx={{ height: 350, mt: 2 }}>
              <CustomBarChart data={summaryChartData} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
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

      <Grid size={{ xs: 12 }}>
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" color="secondary" onClick={exportPortfolioSummary} startIcon={<Assessment />}>Export CSV</Button>
          <Button variant="contained" color="secondary" onClick={exportPortfolioSummaryPdf} startIcon={<Assessment />}>Export PDF</Button>
        </Stack>
      </Grid>
    </Grid>
  );
}
