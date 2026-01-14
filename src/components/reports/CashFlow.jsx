import React from 'react';
import {
  Typography,
  Grid,
  Stack,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Box,
  useTheme,
  Avatar,
  Card,
  CardContent,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { 
  ArrowDownward, 
  ArrowUpward, 
  AccountBalance, 
  ListAlt, 
  Assessment 
} from '@mui/icons-material';

const CashFlowMetric = ({ title, amount, icon, color }) => (
  <Card elevation={0} sx={{ border: `1px solid ${alpha(color, 0.2)}`, bgcolor: alpha(color, 0.02), borderRadius: 3, flex: 1 }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ bgcolor: alpha(color, 0.1), color: color, width: 40, height: 40 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            {title}
          </Typography>
          <Typography variant="h6" fontWeight={800} color={color}>
            ZMW {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const CustomCashFlowChart = ({ data }) => {
  const theme = useTheme();
  
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => Math.abs(d.amount)), 1) * 1.1;
  const width = 800;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const stepX = innerWidth / data.length;
  const barWidth = stepX * 0.7;

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
          <line 
            key={i}
            x1={margin.left} 
            y1={innerHeight * (1 - tick) + margin.top} 
            x2={width - margin.right} 
            y2={innerHeight * (1 - tick) + margin.top}
            stroke={theme.palette.divider}
            strokeDasharray="4 4"
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const x = margin.left + i * stepX + (stepX - barWidth) / 2;
          const barHeight = (Math.abs(d.amount) / maxVal) * innerHeight;
          const color = d.amount >= 0 ? theme.palette.success.main : theme.palette.error.main;
          
          return (
            <g key={i}>
              <rect 
                x={x} 
                y={innerHeight - barHeight + margin.top} 
                width={barWidth} 
                height={barHeight} 
                fill={color}
                rx={4}
              />
              {data.length < 15 && (
                <text 
                  x={x + barWidth / 2} 
                  y={innerHeight + margin.top + 20} 
                  textAnchor="middle" 
                  fontSize="10" 
                  fill={theme.palette.text.secondary}
                >
                  {d.date.split('-').slice(1).join('/')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

export default function CashFlow({ cashFlowReport, exportCashFlow, exportCashFlowPdf }) {
  const theme = useTheme();

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <CashFlowMetric 
            title="Total Inflow" 
            amount={cashFlowReport.totals.totalInflow} 
            icon={<ArrowUpward />} 
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CashFlowMetric 
            title="Total Outflow" 
            amount={cashFlowReport.totals.totalOutflow} 
            icon={<ArrowDownward />} 
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <CashFlowMetric 
            title="Net Cash Flow" 
            amount={cashFlowReport.totals.netCashFlow} 
            icon={<AccountBalance />} 
            color={cashFlowReport.totals.netCashFlow >= 0 ? theme.palette.success.main : theme.palette.error.main}
          />
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>Transaction Timeline</Typography>
          <Box sx={{ height: 350, mt: 2 }}>
            <CustomCashFlowChart data={cashFlowReport.data} />
          </Box>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>Transaction History</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cashFlowReport.data.map((item, index) => (
                  <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {item.type.includes('Inflow') ? <ArrowUpward sx={{ fontSize: 14, color: 'success.main' }} /> : <ArrowDownward sx={{ fontSize: 14, color: 'error.main' }} />}
                        <Typography variant="body2" sx={{ fontWeight: 600, color: item.type.includes('Inflow') ? 'success.main' : 'error.main' }}>
                          {item.type.replace(/\(.*\)/, '')}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: item.amount >= 0 ? 'success.main' : 'error.main' }}>
                      ZMW {Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="secondary" onClick={exportCashFlow} startIcon={<ListAlt />}>Export CSV</Button>
        <Button variant="contained" color="secondary" onClick={exportCashFlowPdf} startIcon={<Assessment />}>Export PDF</Button>
      </Stack>
    </Box>
  );
}

