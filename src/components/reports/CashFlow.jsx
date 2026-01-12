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
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowReport.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: theme.shadows[3] }}
                  cursor={{fill: alpha(theme.palette.divider, 0.1)}}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {cashFlowReport.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? theme.palette.success.main : theme.palette.error.main} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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

