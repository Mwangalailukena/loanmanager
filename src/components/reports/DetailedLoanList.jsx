import React from 'react';
import {
  Typography,
  Paper,
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

export default function DetailedLoanList({ detailedLoanListReport, exportDetailedLoanList, exportDetailedLoanListPdf }) {
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
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="outlined" color="secondary" onClick={exportDetailedLoanList}>Export Detailed List CSV</Button>
        <Button variant="contained" color="secondary" onClick={exportDetailedLoanListPdf}>Export Detailed List PDF</Button>
      </Stack>
    </Box>
  );
}
