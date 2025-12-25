import React from 'react';
import {
  Typography,
  Paper,
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
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer } from 'recharts';

export default function CashFlow({ cashFlowReport, exportCashFlow, exportCashFlowPdf }) {
  return (
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
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="outlined" color="secondary" onClick={exportCashFlow}>Export Cash Flow CSV</Button>
        <Button variant="contained" color="secondary" onClick={exportCashFlowPdf}>Export Cash Flow PDF</Button>
      </Stack>
    </Box>
  );
}
