
import React from "react";
import {
  Grid,
} from "@mui/material";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import DashboardCard from "./DashboardCard";

const DashboardSection = ({ cards, droppableId, isMobile, handleCardClick }) => {
  return (
    <Droppable droppableId={droppableId} direction="horizontal">
      {(provided, snapshot) => (
        <Grid
          container
          spacing={isMobile ? 1.5 : 2}
          {...provided.droppableProps}
          ref={provided.innerRef}
          sx={{
            background: snapshot.isDraggingOver ? 'lightblue' : 'transparent',
            borderRadius: 2,
            transition: 'background-color 0.2s ease',
          }}
        >
          {cards.map((card, index) => (
            <Draggable key={card.id} draggableId={card.id} index={index}>
              {(provided, snapshot) => (
                <DashboardCard
                  card={card}
                  index={index}
                  isMobile={isMobile}
                  handleCardClick={handleCardClick}
                  provided={provided}
                  snapshot={snapshot}
                />
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </Grid>
      )}
    </Droppable>
  );
};

export default DashboardSection;
