
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
import { motion } from "framer-motion";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
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

  return (
    <Grid
      xs={isMobile ? 4 : 6}
      sm={6}
      md={4}
      lg={3}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...(!isMobile && provided.dragHandleProps)}
      style={{
        ...provided.draggableProps.style,
        userSelect: snapshot.isDragging ? "none" : "auto",
      }}
    >
      <Tooltip title={card.tooltip} arrow placement="top">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={index}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCardClick(card.filter)}
          style={{ height: "100%" }}
        >
          <Card
            sx={{
              p: isMobile ? 1.5 : 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              backgroundColor: theme.palette.background.paper,
              boxShadow: snapshot.isDragging ? theme.shadows[8] : undefined, // Remove base override
              border: `1px solid ${theme.palette.divider}`,
              transition: "box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out",
              transform: snapshot.isDragging ? 'rotate(2deg)' : 'rotate(0deg)',
              "&:hover": {
                boxShadow: theme.shadows[4],
                cursor: "pointer",
                borderColor: theme.palette[card.color]?.main || theme.palette.primary.main,
              },
              ...(card.pulse && { animation: "pulse 1.5s infinite" }),
              position: "relative",
            }}
          >
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              mb={0.5}
              gap={0.5}
            >
              <Box sx={{ 
                color: theme.palette[card.color]?.main || theme.palette.text.primary,
                backgroundColor: theme.palette[card.color]?.light + '33' || theme.palette.action.hover,
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {typeof card.icon === "function" ? card.icon(card.value) : card.icon}
              </Box>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: isMobile ? "0.6rem" : "0.75rem" }}
              >
                {card.label}
              </Typography>
            </Box>
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: isMobile ? "1.2rem" : "1.8rem",
                }}
              >
                {card.value}
              </Typography>
            </Box>
            {card.progress !== null && (
              <LinearProgress
                variant="determinate"
                value={card.progress * 100}
                sx={{
                  height: 5,
                  borderRadius: 2,
                  backgroundColor: theme.palette.grey[300],
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: theme.palette[card.color]?.main || theme.palette.primary.main,
                  },
                  width: "80%",
                  mt: 0.5,
                  mb: 0.5,
                }}
              />
            )}
            {card.trend && (
              <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                {card.trend.startsWith("+") ? (
                  <ArrowUpwardIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                ) : (
                  <ArrowDownwardIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: card.trend.startsWith("+")
                      ? theme.palette.success.main
                      : theme.palette.error.main,
                    fontWeight: 600,
                  }}
                >
                  {card.trend} vs. last month
                </Typography>
              </Box>
            )}
          </Card>
        </motion.div>
      </Tooltip>
    </Grid>
  );
};

export default DashboardCard;
