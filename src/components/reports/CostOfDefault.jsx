import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Box,
  Avatar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  useTheme,
  Chip,
} from '@mui/material';
import { TrendingDown, People, AssignmentLate } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

export default function CostOfDefault({ loans }) {
  const theme = useTheme();
  
  const defaultedLoans = loans.filter(l => l.status === 'Defaulted');
  
  const totalCostOfDefault = defaultedLoans.reduce((acc, l) => 
    acc + (Number(l.totalRepayable || 0) - Number(l.repaidAmount || 0)), 0
  );

  const costByBorrower = defaultedLoans.reduce((acc, l) => {
    const outstanding = Number(l.totalRepayable || 0) - Number(l.repaidAmount || 0);
    acc[l.borrower] = (acc[l.borrower] || 0) + outstanding;
    return acc;
  }, {});

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.error.main}`, bgcolor: alpha(theme.palette.error.main, 0.02), borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}>
                  <TrendingDown />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                    Total Loss (Defaulted)
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="error.main">
                    ZMW {totalCostOfDefault.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}>
                  <AssignmentLate />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                    Defaulted Accounts
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {defaultedLoans.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                    Impacted Borrowers
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {Object.keys(costByBorrower).length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>Borrower Impact Breakdown</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            A list of borrowers with defaulted loans and the total unrecovered amount for each.
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Borrower Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total Unrecovered</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(costByBorrower).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">No defaulted loans found in this period.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(costByBorrower).map(([borrower, cost]) => (
                    <TableRow key={borrower} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{borrower}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                        ZMW {cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        <Chip label="Defaulted" size="small" color="error" variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
