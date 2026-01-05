import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer } from 'recharts';

const PIE_CHART_COLORS = ['#FFC107', '#FF8F00', '#E65100', '#D84315'];

export default function ArrearsAging({ arrearsAgingReport, exportArrearsAging, exportArrearsAgingPdf }) {
  return (
    <Grid container spacing={3}>
      <Grid xs={12} md={7}>
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
      <Grid xs={12} md={5}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6">Overdue Distribution by Amount</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={arrearsAgingReport.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {arrearsAgingReport.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => `ZMW ${value.toFixed(2)}`} />
                <RechartsLegend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
      <Grid xs={12}>
        <Typography variant="h6" gutterBottom>Overdue Loans</Typography>
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Borrower</TableCell>
                <TableCell>Phone</TableCell>
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
      <Grid xs={12}>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" color="secondary" onClick={exportArrearsAging}>Export Arrears CSV</Button>
          <Button variant="contained" color="secondary" onClick={exportArrearsAgingPdf}>Export Arrears PDF</Button>
        </Stack>
      </Grid>
    </Grid>
  );
}
