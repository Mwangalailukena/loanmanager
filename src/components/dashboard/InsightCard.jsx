import React from 'react';
import { Card, CardContent, Typography, Button, Box, useTheme } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { motion } from 'framer-motion';

const iconMap = {
  warning: <WarningAmberIcon fontSize="small" />,
  info: <InfoOutlinedIcon fontSize="small" />,
  success: <CheckCircleOutlineIcon fontSize="small" />,
  default: <InfoOutlinedIcon fontSize="small" />,
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function InsightCard({ insight }) {
  const theme = useTheme();
  const IconComponent = iconMap[insight.type] || iconMap.default;
  const cardColor = theme.palette[insight.type]?.light || theme.palette.grey[200];
  const textColor = theme.palette[insight.type]?.contrastText || theme.palette.text.primary;

  return (
    <motion.div variants={cardVariant}>
      <Card
        sx={{
          bgcolor: cardColor,
          color: textColor,
          mb: 2,
          boxShadow: theme.shadows[3],
          '&:hover': {
            boxShadow: theme.shadows[6],
          },
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" mb={1}>
            {React.cloneElement(IconComponent, { sx: { mr: 1, color: textColor } })}
            <Typography variant="subtitle2" fontWeight="bold" color={textColor}>
              {insight.title || (insight.type.charAt(0).toUpperCase() + insight.type.slice(1))}
            </Typography>
          </Box>
          <Typography variant="body2" color={textColor} mb={1}>
            {insight.message}
          </Typography>
          {insight.action && (
            <Button
              variant="contained"
              size="small"
              onClick={insight.action.onClick}
              sx={{
                bgcolor: theme.palette[insight.type]?.dark || theme.palette.primary.main,
                color: theme.palette[insight.type]?.contrastText || theme.palette.primary.contrastText,
                '&:hover': {
                  bgcolor: theme.palette[insight.type]?.main || theme.palette.primary.dark,
                },
              }}
            >
              {insight.action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
