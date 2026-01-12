import React from 'react';
import {
  Typography,
  Paper,
  Stack,
  Button,
  Box,
  Chip,
  useTheme,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { alpha } from '@mui/material/styles';
import { ListAlt, Assessment } from '@mui/icons-material';

export default function DetailedLoanList({ detailedLoanListReport, exportDetailedLoanList, exportDetailedLoanListPdf }) {
  const theme = useTheme();

  const columns = [
    { 
      field: 'borrowerName', 
      headerName: 'Borrower', 
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">{params.row.phone}</Typography>
        </Box>
      )
    },
    { 
      field: 'principal', 
      headerName: 'Principal', 
      type: 'number', 
      width: 120,
      valueFormatter: (params) => `ZMW ${params.toLocaleString()}`
    },
    { 
      field: 'interest', 
      headerName: 'Interest', 
      type: 'number', 
      width: 110,
      valueFormatter: (params) => `ZMW ${params.toLocaleString()}`
    },
    { 
      field: 'totalRepayable', 
      headerName: 'Total Due', 
      type: 'number', 
      width: 130,
      valueFormatter: (params) => `ZMW ${params.toLocaleString()}`
    },
    { 
      field: 'amountRepaid', 
      headerName: 'Repaid', 
      type: 'number', 
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="success.main" fontWeight={600}>
          ZMW {params.value.toLocaleString()}
        </Typography>
      )
    },
    { 
      field: 'outstanding', 
      headerName: 'Outstanding', 
      type: 'number', 
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value > 0 ? 'error.main' : 'text.secondary'} fontWeight={700}>
          ZMW {params.value.toLocaleString()}
        </Typography>
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => {
        const colors = {
          'Active': 'primary',
          'Paid': 'success',
          'Overdue': 'warning',
          'Defaulted': 'error'
        };
        return (
          <Chip 
            label={params.value} 
            size="small" 
            color={colors[params.value] || 'default'} 
            sx={{ fontWeight: 700, borderRadius: 1.5 }}
          />
        );
      }
    },
    { field: 'dueDate', headerName: 'Due Date', width: 120 },
    { 
      field: 'daysOverdue', 
      headerName: 'Days Late', 
      type: 'number', 
      width: 100,
      renderCell: (params) => params.value > 0 ? (
        <Chip label={params.value} size="small" color="error" variant="outlined" sx={{ fontWeight: 700 }} />
      ) : '-'
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
        Detailed Loan Analytics
      </Typography>
      
      <Paper elevation={0} sx={{ height: 'calc(100% - 100px)', border: `1px solid ${theme.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
        <DataGrid
          rows={detailedLoanListReport}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection={false}
          disableSelectionOnClick
          components={{ Toolbar: GridToolbar }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              color: theme.palette.text.primary,
              fontWeight: 700,
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>

      <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="secondary" onClick={exportDetailedLoanList} startIcon={<ListAlt />}>Export CSV</Button>
        <Button variant="contained" color="secondary" onClick={exportDetailedLoanListPdf} startIcon={<Assessment />}>Export PDF</Button>
      </Stack>
    </Box>
  );
}

