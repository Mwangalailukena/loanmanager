import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import useMonthlyProjection from '../../hooks/dashboard/useMonthlyProjection';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProjectionCard = () => {
  const theme = useTheme();
  const currentYear = dayjs().year();
  const currentMonth = dayjs().month() + 1; // dayjs month is 0-indexed

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { projection, loadingProjection } = useMonthlyProjection(selectedMonth, selectedYear);

  const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 2); // e.g., current year -2 to current year +2
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: dayjs().month(i).format('MMMM'),
  }));

  const chartData = [
    { name: 'Projected Revenue', value: projection.projectedRevenue },
    { name: 'Projected Payments', value: projection.projectedPayments },
    { name: 'Projected New Loans', value: projection.projectedNewLoans },
  ];

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          Monthly Projections
        </Typography>

        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {loadingProjection ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2}>
            <Typography variant="body1">
              <strong>Projected Revenue:</strong> ZMW {projection.projectedRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </Typography>
            <Typography variant="body1">
              <strong>Projected Payments:</strong> ZMW {projection.projectedPayments.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </Typography>
            <Typography variant="body1">
              <strong>Projected New Loans:</strong> ZMW {projection.projectedNewLoans.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </Typography>

            <Box sx={{ height: 200, width: '100%', mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `ZMW ${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectionCard;
