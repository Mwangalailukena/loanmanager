import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import PsychologyAltRoundedIcon from '@mui/icons-material/PsychologyAltRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import TipsAndUpdatesRoundedIcon from '@mui/icons-material/TipsAndUpdatesRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import { motion } from 'framer-motion';

const iconMap = {
  warning: <PsychologyAltRoundedIcon fontSize="small" />,
  info: <BoltRoundedIcon fontSize="small" />,
  success: <EmojiEventsRoundedIcon fontSize="small" />,
  default: <TipsAndUpdatesRoundedIcon fontSize="small" />,
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function InsightCard({ insight, onDismiss }) {
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
          position: 'relative',
          '&:hover': {
            boxShadow: theme.shadows[6],
          },
        }}
      >
        {onDismiss && (
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(insight.id || insight.message);
            }}
            sx={{ position: 'absolute', top: 4, right: 4, color: textColor, opacity: 0.7, '&:hover': { opacity: 1 } }}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        )}
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
