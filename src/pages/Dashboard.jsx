// Define groups and card IDs for each group:
const CARD_GROUPS = [
  {
    id: "capitalFlow",
    label: "💰 Capital Flow",
    cardIds: ["investedCapital", "disbursedCapital", "availableCapital"],
  },
  {
    id: "repayments",
    label: "📈 Repayments",
    cardIds: [
      "totalCollected",
      "totalOutstanding",
      "expectedInterest",
      "actualInterest",
    ],
  },
  {
    id: "loanStatus",
    label: "📊 Loan Status",
    cardIds: ["totalLoans", "paidLoans", "activeLoans", "overdueLoans"],
  },
  {
    id: "metricsCharts",
    label: "📐 Metrics and Charts",
    cardIds: ["averageLoan"], // Add more cards or charts here as you expand
  },
];

// Helper: get cards for a group filtered by current order
function getCardsForGroup(group) {
  // From current cardsOrder, filter those in group's cardIds
  if (!cardsOrder.length) return [];
  return cardsOrder
    .map((id) => defaultCards.find((c) => c.id === id))
    .filter((c) => c && group.cardIds.includes(c.id));
}

// Handle drag end separately per group to reorder cards inside the group only
const onDragEndGroup = (groupId) => (result) => {
  if (!result.destination) return;

  const group = CARD_GROUPS.find((g) => g.id === groupId);
  if (!group) return;

  // Extract the cards in this group in current order
  const groupCards = getCardsForGroup(group);

  // Reorder groupCards based on drag result
  const newGroupCards = Array.from(groupCards);
  const [moved] = newGroupCards.splice(result.source.index, 1);
  newGroupCards.splice(result.destination.index, 0, moved);

  // Now update the global cardsOrder by replacing group's cards with newGroupCards in place
  const newCardsOrder = [...cardsOrder];

  // For each card in group's cardIds, find index in newCardsOrder and remove
  group.cardIds.forEach((id) => {
    const idx = newCardsOrder.indexOf(id);
    if (idx !== -1) newCardsOrder.splice(idx, 1);
  });

  // Insert reordered group's card IDs at the position of the first removed card
  const firstIndex = cardsOrder.findIndex((id) => group.cardIds.includes(id));
  newCardsOrder.splice(firstIndex, 0, ...newGroupCards.map((c) => c.id));

  setCardsOrder(newCardsOrder);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newCardsOrder));
  toast.success("Dashboard layout saved!");
};

return (
  <Box p={isMobile ? 1 : 2}>
    <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
      Dashboard
    </Typography>

    {/* Month picker */}
    <Box mb={isMobile ? 2 : 3} maxWidth={isMobile ? "100%" : 180}>
      <TextField
        label="Filter by Month"
        type="month"
        size="small"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        fullWidth
      />
    </Box>

    {/* Render each card group with heading and drag-and-drop */}
    {CARD_GROUPS.map(({ id: groupId, label, cardIds }) => {
      const groupCards = getCardsForGroup({ cardIds });
      if (!groupCards.length) return null; // Skip empty groups

      return (
        <Box key={groupId} mb={4}>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            mb={isMobile ? 1 : 2}
            sx={{ fontWeight: "bold" }}
          >
            {label}
          </Typography>

          <DragDropContext onDragEnd={onDragEndGroup(groupId)}>
            <Droppable
              droppableId={`droppable-${groupId}`}
              direction={isMobile ? "vertical" : "horizontal"}
            >
              {(provided) =>
                isMobile ? (
                  <Stack
                    spacing={1}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {groupCards.map(
                      (
                        {
                          id,
                          label,
                          value,
                          color,
                          filter,
                          tooltip,
                          progress,
                          pulse,
                          icon,
                        },
                        index
                      ) => (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(providedDraggable) => (
                            <motion.div
                              key={id}
                              custom={index}
                              initial="hidden"
                              animate="visible"
                              variants={cardVariants}
                              ref={providedDraggable.innerRef}
                              {...providedDraggable.draggableProps}
                              style={{
                                ...providedDraggable.draggableProps.style,
                                marginBottom: 8,
                              }}
                            >
                              <Tooltip title={tooltip} arrow>
                                <Card
                                  sx={{
                                    p: 1.5,
                                    cursor: "pointer",
                                    borderLeft: `6px solid ${theme.palette[color].main}`,
                                    position: "relative",
                                    boxShadow: pulse
                                      ? `0 0 8px ${theme.palette.error.main}`
                                      : undefined,
                                    animation: pulse
                                      ? "pulse 2s infinite"
                                      : undefined,
                                    "&:hover": {
                                      boxShadow: `0 0 10px ${theme.palette[color].main}`,
                                    },
                                  }}
                                  onClick={() => handleCardClick(filter)}
                                  elevation={3}
                                >
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    mb={0.5}
                                    gap={1}
                                  >
                                    {/* Drag handle */}
                                    <Box
                                      sx={{ cursor: "grab" }}
                                      {...providedDraggable.dragHandleProps}
                                    >
                                      <DragIndicatorIcon
                                        sx={{
                                          color: theme.palette.text.secondary,
                                        }}
                                      />
                                    </Box>
                                    {React.cloneElement(icon, {
                                      fontSize: "medium",
                                    })}
                                    <Typography
                                      variant="subtitle2"
                                      color="textSecondary"
                                      flexGrow={1}
                                    >
                                      {label}
                                    </Typography>
                                    <Typography
                                      variant="subtitle1"
                                      fontWeight="bold"
                                    >
                                      {value}
                                    </Typography>
                                  </Box>
                                  {progress !== null &&
                                    progress !== undefined && (
                                      <LinearProgress
                                        variant="determinate"
                                        value={Math.min(progress * 100, 100)}
                                        sx={{ height: 6, borderRadius: 3 }}
                                      />
                                    )}
                                </Card>
                              </Tooltip>
                            </motion.div>
                          )}
                        </Draggable>
                      )
                    )}
                    {provided.placeholder}
                  </Stack>
                ) : (
                  <Grid
                    container
                    spacing={2}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {groupCards.map(
                      (
                        {
                          id,
                          label,
                          value,
                          color,
                          filter,
                          tooltip,
                          progress,
                          pulse,
                          icon,
                        },
                        index
                      ) => (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(providedDraggable) => (
                            <Grid
                              item
                              xs={6}
                              sm={4}
                              md={3}
                              lg={2}
                              ref={providedDraggable.innerRef}
                              {...providedDraggable.draggableProps}
                              {...providedDraggable.dragHandleProps}
                              style={{
                                ...providedDraggable.draggableProps.style,
                              }}
                            >
                              <motion.div
                                custom={index}
                                initial="hidden"
                                animate="visible"
                                variants={cardVariants}
                              >
                                <Tooltip title={tooltip} arrow>
                                  <Card
                                    sx={{
                                      p: 2,
                                      cursor: "grab",
                                      borderLeft: `6px solid ${theme.palette[color].main}`,
                                      position: "relative",
                                      boxShadow: pulse
                                        ? `0 0 12px ${theme.palette.error.main}`
                                        : undefined,
                                      animation: pulse
                                        ? "pulse 2s infinite"
                                        : undefined,
                                      "&:hover": {
                                        boxShadow: `0 0 12px ${theme.palette[color].main}`,
                                      },
                                    }}
                                    onClick={() => handleCardClick(filter)}
                                    elevation={3}
                                  >
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      mb={1}
                                      gap={1}
                                    >
                                      {icon}
                                      <Typography
                                        variant="subtitle1"
                                        color="textSecondary"
                                        flexGrow={1}
                                      >
                                        {label}
                                      </Typography>
                                      <Typography
                                        variant="h6"
                                        fontWeight="bold"
                                      >
                                        {value}
                                      </Typography>
                                    </Box>
                                    {progress !== null &&
                                      progress !== undefined && (
                                        <LinearProgress
                                          variant="determinate"
                                          value={Math.min(progress * 100, 100)}
                                          sx={{ height: 8, borderRadius: 4 }}
                                        />
                                      )}
                                  </Card>
                                </Tooltip>
                              </motion.div>
                            </Grid>
                          )}
                        </Draggable>
                      )
                    )}
                    {provided.placeholder}
                  </Grid>
                )
              }
            </Droppable>
          </DragDropContext>
        </Box>
      );
    })}
</Box>