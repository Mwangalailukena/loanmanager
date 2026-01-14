import React, { useMemo } from 'react';
import { Box, useTheme, Typography } from "@mui/material";
import { COLORS } from './chartUtils';

const GrowthChart = ({ data }) => {
  const theme = useTheme();

  const chartParams = useMemo(() => {
    if (!data || data.length === 0) return null;

    const margin = { top: 20, right: 10, bottom: 40, left: 10 };
    const width = 1000;
    const height = 350;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.costs)), 1) * 1.1;
    const stepX = innerWidth / (data.length - 1);

    const generatePath = (key) => {
      const points = data.map((d, i) => {
        const x = margin.left + i * stepX;
        const y = innerHeight - (d[key] / maxVal) * innerHeight + margin.top;
        return `${x},${y}`;
      });

      // Area path (closes at the bottom)
      const areaPath = `M${margin.left},${innerHeight + margin.top} ` + 
                       points.map(p => `L${p}`).join(' ') + 
                       ` L${width - margin.right},${innerHeight + margin.top} Z`;
      
      // Line path
      const linePath = `M` + points.join(' L');

      return { areaPath, linePath };
    };

    return { margin, width, height, innerHeight, maxVal, stepX, incomePaths: generatePath('income'), costsPaths: generatePath('costs') };
  }, [data]);

  if (!chartParams) return null;

  const { margin, width, height, innerHeight, incomePaths, costsPaths, stepX } = chartParams;

  return (
    <Box sx={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="areaIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.revenue} stopOpacity={0.4} />
            <stop offset="100%" stopColor={COLORS.revenue} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="areaCosts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.costs} stopOpacity={0.4} />
            <stop offset="100%" stopColor={COLORS.costs} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
          <line 
            key={i}
            x1={margin.left} 
            y1={innerHeight * (1 - tick) + margin.top} 
            x2={width - margin.right} 
            y2={innerHeight * (1 - tick) + margin.top}
            stroke={theme.palette.divider}
            strokeDasharray="4 4"
          />
        ))}

        {/* Income Area */}
        <path d={incomePaths.areaPath} fill="url(#areaIncome)" />
        <path d={incomePaths.linePath} fill="none" stroke={COLORS.revenue} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Costs Area */}
        <path d={costsPaths.areaPath} fill="url(#areaCosts)" />
        <path d={costsPaths.linePath} fill="none" stroke={COLORS.costs} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* X-Axis Labels */}
        {data.map((d, i) => (
          <text 
            key={i}
            x={margin.left + i * stepX} 
            y={innerHeight + margin.top + 25} 
            textAnchor="middle" 
            fill={theme.palette.text.secondary}
            fontSize="12"
          >
            {d.month}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: COLORS.revenue, borderRadius: '2px' }} />
          <Typography variant="caption" fontWeight="500">Income</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: COLORS.costs, borderRadius: '2px' }} />
          <Typography variant="caption" fontWeight="500">Costs</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default GrowthChart;
