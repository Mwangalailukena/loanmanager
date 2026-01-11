
import React from "react";
import {
  Grid,
  Card,
  Typography,
  Box,
  Tooltip,
  LinearProgress,
  useTheme,
} from "@mui/material";
import { alpha, keyframes } from "@mui/system";
import { motion } from "framer-motion";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import DashboardCardSkeleton from "./DashboardCardSkeleton";

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0px ${alpha('#f44336', 0.4)}; }
  70% { box-shadow: 0 0 0 10px ${alpha('#f44336', 0)}; }
  100% { box-shadow: 0 0 0 0px ${alpha('#f44336', 0)}; }
`;

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

const DashboardCard = ({
  card,
  index,
  isMobile,
  handleCardClick,
  provided,
  snapshot,
  loading,
}) => {
  const theme = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();

  const getTrendColor = () => {
    if (!card.trend) return theme.palette.text.secondary;
    if (card.trend.value === "New") return theme.palette[card.color]?.main || theme.palette.primary.main;
    
    const isUp = card.trend.direction === "up";
    const isGood = card.isInverse ? !isUp : isUp;
    
    return isGood ? theme.palette.success.main : theme.palette.error.main;
  };

  const trendColor = getTrendColor();

  const motionProps = prefersReducedMotion ? {
    initial: "visible",
    animate: "visible",
    whileHover: {},
    whileTap: {},
  } : {
    variants: cardVariants,
    initial: "hidden",
    animate: "visible",
    custom: index,
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  };

  return (
    <Grid
      item
      xs={isMobile ? 6 : 6}
      sm={6}
      md={4}
      lg={3}
      onClick={() => handleCardClick && handleCardClick(card.filter)}
      sx={{ cursor: 'pointer' }}
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      {...(provided?.dragHandleProps || {})}
    >
      {loading ? (
        <DashboardCardSkeleton />
      ) : (
        <Tooltip title={card.tooltip} arrow placement="top">
          <motion.div
            {...motionProps}
            style={{ height: "100%" }}
          >
            <Card
              sx={{
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                backgroundColor: theme.palette.background.paper,
                boxShadow: snapshot?.isDragging ? theme.shadows[8] : "0 4px 12px rgba(0,0,0,0.03)",
                border: card.pulse 
                  ? `2px solid ${theme.palette.error.main}` 
                  : `1px solid ${theme.palette.divider}`,
                animation: card.pulse && !prefersReducedMotion ? `${pulseAnimation} 2s infinite` : "none",
                transition: prefersReducedMotion ? 'none' : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  boxShadow: theme.palette.mode === 'dark' ? '0 8px 16px rgba(0,0,0,0.8)' : '0 8px 16px rgba(0,0,0,0.1)',
                  borderColor: theme.palette[card.color]?.main || theme.palette.primary.main,
                  transform: 'translateY(-2px)'
                },
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                mb={2}
              >
                <Box sx={{ 
                  color: theme.palette[card.color]?.main || theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette[card.color]?.main || theme.palette.primary.main, 0.1),
                  borderRadius: '12px',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {typeof card.icon === "function" ? card.icon(card.value) : React.cloneElement(card.icon, { style: { fontSize: '1.4rem' } })}
                </Box>
                {card.trend && (
                  <Box 
                    sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 0.5, 
                      px: 1.2, 
                      py: 0.4, 
                      borderRadius: '20px',
                      backgroundColor: alpha(trendColor, 0.1),
                    }}
                  >
                    {card.trend.value === "New" ? (
                      <HorizontalRuleIcon sx={{ fontSize: 12, color: trendColor }} />
                    ) : card.trend.direction === "up" ? (
                      <ArrowUpwardIcon sx={{ fontSize: 12, color: trendColor }} />
                    ) : (
                      <ArrowDownwardIcon sx={{ fontSize: 12, color: trendColor }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: trendColor,
                        fontWeight: 800,
                        fontSize: '0.7rem'
                      }}
                    >
                      {card.trend.value}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, fontWeight: 400, mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.6rem' }}
              >
                {card.label}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.4 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 900,
                    fontSize: isMobile ? "1.2rem" : "1.6rem",
                    color: theme.palette.text.primary,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  {card.value}
                </Typography>
              </Box>

              <Box sx={{ mt: 'auto', pt: 1.5 }}>
                {card.progress !== null && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, fontSize: '0.6rem' }}>Progress</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '0.6rem' }}>{Math.round(card.progress * 100)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={card.progress * 100}
                      sx={{
                        height: 5,
                        borderRadius: 2.5,
                        backgroundColor: alpha(theme.palette[card.color]?.main || theme.palette.primary.main, 0.1),
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 2.5,
                          backgroundColor: theme.palette[card.color]?.main || theme.palette.primary.main,
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Card>
          </motion.div>
        </Tooltip>
      )}
    </Grid>
  );
};

export default DashboardCard;
