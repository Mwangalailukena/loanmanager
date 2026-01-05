
import React from "react";
import {
  Grid,
  Card,
  Typography,
  Box,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha,
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

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
}) => {
  const theme = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();

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
      xs={isMobile ? 4 : 6}
      sm={6}
      md={4}
      lg={3}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
        userSelect: snapshot.isDragging ? "none" : "auto",
      }}
    >
      <Tooltip title={card.tooltip} arrow placement="top">
        <motion.div
          {...motionProps}
          style={{ height: "100%" }}
        >
          <Card
            sx={{
              p: 1.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              backgroundColor: theme.palette.background.paper,
              boxShadow: snapshot.isDragging ? theme.shadows[8] : "0 4px 12px rgba(0,0,0,0.03)",
              border: `1px solid ${theme.palette.divider}`,
              transition: prefersReducedMotion ? 'none' : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: snapshot.isDragging ? 'rotate(2deg)' : 'rotate(0deg)',
              "&:hover": {
                boxShadow: theme.palette.mode === 'dark' ? '0 4px 10px rgba(0,0,0,0.8)' : '0 4px 10px rgba(0,0,0,0.15)',
                borderColor: theme.palette[card.color]?.main || theme.palette.primary.main,
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
                borderRadius: 2.5,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {typeof card.icon === "function" ? card.icon(card.value) : React.cloneElement(card.icon, { style: { fontSize: '1.25rem' } })}
              </Box>
              {card.trend && (
                <Tooltip title="Change from previous period" arrow>
                  <Box 
                    sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 0.2, 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 10,
                    }}
                  >
                    {card.trend.direction === "up" ? (
                      <ArrowUpwardIcon sx={{ fontSize: 12, color: theme.palette.success.main }} />
                    ) : (
                      <ArrowDownwardIcon sx={{ fontSize: 12, color: theme.palette.error.main }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: card.trend.direction === "up"
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                        fontWeight: 700,
                      }}
                    >
                      {card.trend.value}
                    </Typography>
                  </Box>
                </Tooltip>
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
    </Grid>
  );
};

export default DashboardCard;
