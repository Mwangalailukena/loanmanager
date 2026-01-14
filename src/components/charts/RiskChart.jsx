import React, { useMemo } from 'react';
import { Box, useTheme, Typography } from "@mui/material";
import { COLORS } from './chartUtils';

const RiskChart = ({ data }) => {
  const theme = useTheme();

  const chartParams = useMemo(() => {
    if (!data || data.length === 0) return null;

    const margin = { top: 20, right: 10, bottom: 40, left: 10 };
    const width = 1000; // Reference width for SVG viewBox
    const height = 350;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const maxVal = Math.max(...data.map(d => Math.max(d.Performing, d.Overdue)), 1) * 1.1;
    
    const stepX = innerWidth / data.length;
    const barWidth = (stepX * 0.8) / 2; // Two bars per group

    return { margin, width, height, innerWidth, innerHeight, maxVal, stepX, barWidth };
  }, [data]);

  if (!chartParams) return null;

  const { margin, width, height, innerHeight, maxVal, stepX, barWidth } = chartParams;

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
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

        {/* Bars */}
        {data.map((d, i) => {
          const x = margin.left + i * stepX + stepX * 0.1;
          const hPerf = (d.Performing / maxVal) * innerHeight;
          const hOver = (d.Overdue / maxVal) * innerHeight;

          return (
            <g key={i}>
              {/* Performing Bar */}
              <rect 
                x={x} 
                y={innerHeight - hPerf + margin.top} 
                width={barWidth} 
                height={hPerf} 
                fill={COLORS.performing}
                rx={4}
              />
              {/* Overdue Bar */}
              <rect 
                x={x + barWidth + 2} 
                y={innerHeight - hOver + margin.top} 
                width={barWidth} 
                height={hOver} 
                fill={COLORS.overdue}
                rx={4}
              />
              {/* X-Axis Label */}
              <text 
                x={x + barWidth} 
                y={innerHeight + margin.top + 25} 
                textAnchor="middle" 
                fill={theme.palette.text.secondary}
                fontSize="12"
              >
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: COLORS.performing, borderRadius: '50%' }} />
          <Typography variant="caption" fontWeight="500">Performing</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: COLORS.overdue, borderRadius: '50%' }} />
          <Typography variant="caption" fontWeight="500">Overdue</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RiskChart;
