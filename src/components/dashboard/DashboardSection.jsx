import React from "react";
import {
  Grid,
} from "@mui/material";
import DashboardCard from "./DashboardCard";

const DashboardSection = ({ cards, droppableId, isMobile, handleCardClick, loading }) => {
  return (
    <Grid
      container
      spacing={isMobile ? 1.5 : 2}
      sx={{
        borderRadius: 2,
        transition: 'background-color 0.2s ease',
      }}
    >
      {cards.map((card, index) => (
        <DashboardCard
          key={card.id}
          card={card}
          index={index}
          isMobile={isMobile}
          handleCardClick={handleCardClick}
          loading={loading}
        />
      ))}
    </Grid>
  );
};

export default DashboardSection;