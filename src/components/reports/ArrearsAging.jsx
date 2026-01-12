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
  Chip,
  Box,
  useTheme,
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  Legend as RechartsLegend, 
  ResponsiveContainer 
} from 'recharts';
import { alpha } from '@mui/material/styles';
import { Assessment, ListAlt } from '@mui/icons-material';

const PIE_CHART_COLORS = ['#FFC107', '#FF8F00', '#E65100', '#D84315'];

const getBucketColor = (bucket) => {
  if (bucket.includes('1-7')) return '#FFC107';
  if (bucket.includes('8-14')) return '#FF9800';
  if (bucket.includes('15-30')) return '#F44336';
  return '#D32F2F';
};

export default function ArrearsAging({ arrearsAgingReport, exportArrearsAging, exportArrearsAgingPdf }) {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Arrears Aging Details</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Bucket</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}># of Loans</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Outstanding (ZMW)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(arrearsAgingReport.buckets).map(([bucket, data]) => (
                    <TableRow key={bucket} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Chip 
                          label={bucket} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(getBucketColor(bucket), 0.1), 
                            color: getBucketColor(bucket),
                            fontWeight: 700,
                            borderRadius: 1.5
                          }} 
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{data.loans.length}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {data.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={5}>
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3, height: '100%' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Volume Distribution</Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={arrearsAgingReport.chartData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60}
                    outerRadius={80} 
                    paddingAngle={5}
                    label
                  >
                    {arrearsAgingReport.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: theme.shadows[3] }}
                    formatter={(value) => [`ZMW ${value.toLocaleString()}`, 'Outstanding']}
                  />
                  <RechartsLegend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Overdue Loans List</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Borrower</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Principal</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Outstanding</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Days Overdue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {arrearsAgingReport.list.map((loan) => (
                    <TableRow key={loan.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{loan.borrower}</Typography>
                        <Typography variant="caption" color="text.secondary">{loan.phone}</Typography>
                      </TableCell>
                      <TableCell align="right">ZMW {loan.principal.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                        ZMW {loan.outstanding.toLocaleString()}
                      </TableCell>
                      <TableCell>{loan.dueDate}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`${loan.daysOverdue} days`} 
                          size="small" 
                          color="error"
                          variant="outlined"
                          sx={{ fontWeight: 700, borderRadius: 1.5 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" color="secondary" onClick={exportArrearsAging} startIcon={<ListAlt />}>Export CSV</Button>
          <Button variant="contained" color="secondary" onClick={exportArrearsAgingPdf} startIcon={<Assessment />}>Export PDF</Button>
        </Stack>
      </Grid>
    </Grid>
  );
}

