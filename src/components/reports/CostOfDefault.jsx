import React from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

const CostOfDefault = ({ loans }) => {
  const defaultedLoans = loans.filter(loan => loan.status === 'Defaulted');

  const totalCostOfDefault = defaultedLoans.reduce((acc, loan) => {
    return acc + (Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0));
  }, 0);

  const costByBorrower = defaultedLoans.reduce((acc, loan) => {
    const outstanding = Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0);
    if (acc[loan.borrower]) {
      acc[loan.borrower] += outstanding;
    } else {
      acc[loan.borrower] = outstanding;
    }
    return acc;
  }, {});

  const chartData = Object.keys(costByBorrower).map(borrower => ({
    name: borrower,
    cost: costByBorrower[borrower],
  }));

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total Cost of Default</Typography>
            <Typography variant="h4" color="error.main">
              ZMW {totalCostOfDefault.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Paper>
          <Typography variant="h6" sx={{ p: 2 }}>
            Cost of Default by Borrower
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `ZMW ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="cost" fill="#ef5350">
                <LabelList dataKey="cost" position="top" formatter={(value) => `ZMW ${value.toFixed(2)}`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Defaulted Loans
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Borrower</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Outstanding Balance (ZMW)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {defaultedLoans.map(loan => (
                <TableRow key={loan.id}>
                  <TableCell>{loan.borrower}</TableCell>
                  <TableCell>{loan.phone}</TableCell>
                  <TableCell align="right">
                    {(Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0)).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default CostOfDefault;
