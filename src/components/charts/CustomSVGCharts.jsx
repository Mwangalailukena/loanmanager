import React from 'react';
import { Box, Typography, useTheme } from "@mui/material";

export const SimplePieChart = ({ data, colors, size = 200, innerRadius = 0 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulativeAngle = 0;
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  if (total === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: size }}><Typography variant="caption">No data</Typography></Box>;

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height={size}>
        {data.map((d, i) => {
          const startAngle = cumulativeAngle;
          const sliceAngle = (d.value / total) * 360;
          cumulativeAngle += sliceAngle;

          const x1 = centerX + radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
          const y1 = centerY + radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
          const x2 = centerX + radius * Math.cos((Math.PI * (startAngle + sliceAngle - 90)) / 180);
          const y2 = centerY + radius * Math.sin((Math.PI * (startAngle + sliceAngle - 90)) / 180);

          const largeArcFlag = sliceAngle > 180 ? 1 : 0;

          let pathData;
          if (innerRadius > 0) {
            const ix1 = centerX + innerRadius * Math.cos((Math.PI * (startAngle - 90)) / 180);
            const iy1 = centerY + innerRadius * Math.sin((Math.PI * (startAngle - 90)) / 180);
            const ix2 = centerX + innerRadius * Math.cos((Math.PI * (startAngle + sliceAngle - 90)) / 180);
            const iy2 = centerY + innerRadius * Math.sin((Math.PI * (startAngle + sliceAngle - 90)) / 180);
            pathData = [
              `M ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `L ${ix2} ${iy2}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1}`,
              'Z'
            ].join(' ');
          } else {
            pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          }

          return <path key={i} d={pathData} fill={colors[i % colors.length]} stroke="#fff" strokeWidth="1" />;
        })}
      </svg>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 1 }}>
        {data.map((d, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors[i % colors.length] }} />
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{d.name}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const SimpleBarChart = ({ data, color, height = 300 }) => {
  const theme = useTheme();
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value || d.Expenses || 0), 1) * 1.1;
  const width = 800;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const stepX = innerWidth / data.length;
  const barWidth = stepX * 0.7;

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
          <line key={i} x1={margin.left} y1={innerHeight * (1 - tick) + margin.top} x2={width - margin.right} y2={innerHeight * (1 - tick) + margin.top} stroke={theme.palette.divider} strokeDasharray="4 4" />
        ))}
        {data.map((d, i) => {
          const x = margin.left + i * stepX + (stepX - barWidth) / 2;
          const val = d.value || d.Expenses || 0;
          const bH = (val / maxVal) * innerHeight;
          return (
            <g key={i}>
              <rect x={x} y={innerHeight - bH + margin.top} width={barWidth} height={bH} fill={color || theme.palette.primary.main} rx={4} />
              {data.length <= 12 && (
                <text x={x + barWidth / 2} y={innerHeight + margin.top + 20} textAnchor="middle" fontSize="12" fill={theme.palette.text.secondary}>
                  {d.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Box>
  );
};
