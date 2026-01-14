import React from 'react';
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { formatCurrency } from './chartUtils';

const TopBorrowersChart = ({ data }) => {
  const theme = useTheme();
  
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <Box sx={{ height: 350, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
      {data.map((entry, index) => (
        <Box key={index} sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" fontWeight="600" noWrap sx={{ maxWidth: '70%' }}>
              {entry.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(entry.value)}
            </Typography>
          </Box>
          <Box sx={{ 
            height: 12, 
            width: '100%', 
            bgcolor: alpha(theme.palette.divider, 0.5), 
            borderRadius: 6,
            overflow: 'hidden'
          }}>
            <Box 
              sx={{ 
                height: '100%', 
                width: `${(entry.value / maxValue) * 100}%`, 
                bgcolor: theme.palette.primary.main,
                borderRadius: 6,
                transition: 'width 1s ease-in-out'
              }} 
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default TopBorrowersChart;
