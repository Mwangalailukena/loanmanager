import React, { useState, useEffect, useCallback, lazy, Suspense, useMemo } from "react";
import {
    Box,
    Typography,
    useTheme,
    useMediaQuery,
    TextField,
    CircularProgress,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    FormControlLabel,
    IconButton,
    Chip,
    Stack,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Paper,
} from "@mui/material";
import { alpha, keyframes } from "@mui/system";

import TuneIcon from '@mui/icons-material/Tune';
import SummarizeIcon from '@mui/icons-material/Summarize';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import InsightsIcon from '@mui/icons-material/Insights';

import { useNavigate } from "react-router-dom";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useAuth } from "../contexts/AuthProvider.js";
import dayjs from "dayjs";
import { useSnackbar } from "../components/SnackbarProvider";
import ResponsiveContentDisplay from "../components/ResponsiveContentDisplay";

import { BOTTOM_NAV_HEIGHT } from "../components/BottomNavBar";
import { useDashboardCalculations } from "../hooks/dashboard/useDashboardCalculations";
import { useInsights } from "../hooks/useInsights";
import DashboardSection from "../components/dashboard/DashboardSection";
import InsightCard from "../components/dashboard/InsightCard";


const LazyCharts = lazy(() => import("../components/Charts"));

// (The rest of the initial constants and helper functions remain the same)
const DEFAULT_CARD_IDS = [
    "investedCapital", "availableCapital", "totalDisbursed", "totalCollected", "partnerDividends",
    "totalLoans", "paidLoans", "activeLoans", "overdueLoans", "totalOutstanding",
    "expectedProfit", "actualProfit",
];
const EXECUTIVE_SUMMARY_IDS = [
    "investedCapital", "availableCapital", "totalDisbursed", "totalCollected", "partnerDividends",
];



const popInAnimation = keyframes`
  0% { opacity: 0; transform: scale(0.9) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
`;


export default function Dashboard() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    
    const { loans, borrowers, payments, expenses, settings, loading, updateSettings } = useFirestore();
    
    const { currentUser } = useAuth();
    const showSnackbar = useSnackbar();

    const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
    const [cardsOrder, setCardsOrder] = useState([]);
    const [hiddenCards, setHiddenCards] = useState([]);
    const [customizeOpen, setCustomizeOpen] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [peekOpen, setPeekOpen] = useState(false);
    const [peekData, setPeekData] = useState({ title: "", loans: [], filter: "" });
    const [dismissedInsights, setDismissedInsights] = useState([]);

    useEffect(() => {
        const welcomeMessageShown = sessionStorage.getItem('welcomeMessageShown');
        if (!welcomeMessageShown) {
            setShowWelcome(true);
            const timer = setTimeout(() => {
                setShowWelcome(false);
                sessionStorage.setItem('welcomeMessageShown', 'true');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, []);

    // Sync state with settings from Firestore
    useEffect(() => {
        if (settings) {
            const savedOrder = settings.dashboardCardOrder || [];
            const savedHidden = settings.hiddenDashboardCards || [];
            const savedDismissed = settings.dismissedInsights || [];
            
            const validOrder = savedOrder.filter((id) => DEFAULT_CARD_IDS.includes(id));
            const finalOrder = [...new Set([...validOrder, ...DEFAULT_CARD_IDS])];
            
            setCardsOrder(finalOrder);
            setHiddenCards(savedHidden);
            setDismissedInsights(savedDismissed);
        }
    }, [settings]);

    // Function to update Firestore settings
    const saveLayoutToFirestore = useCallback(async (newOrder, newHidden, newDismissed = dismissedInsights) => {
        try {
            await updateSettings({
                ...settings,
                dashboardCardOrder: newOrder,
                hiddenDashboardCards: newHidden,
                dismissedInsights: newDismissed
            });
        } catch (error) {
            console.error("Error saving dashboard layout:", error);
            showSnackbar("Failed to save layout.", "error");
        }
    }, [settings, updateSettings, showSnackbar, dismissedInsights]);

    const handleDismissInsight = async (insightId) => {
        const newDismissed = [...dismissedInsights, insightId];
        setDismissedInsights(newDismissed);
        await saveLayoutToFirestore(cardsOrder, hiddenCards, newDismissed);
        showSnackbar("Insight hidden.", "info");
    };

    useEffect(() => {
        const welcomeMessageShown = sessionStorage.getItem('welcomeMessageShown');
        if (!welcomeMessageShown) {
            setShowWelcome(true);
            const timer = setTimeout(() => {
                setShowWelcome(false);
                sessionStorage.setItem('welcomeMessageShown', 'true');
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, []);

    // CHANGED: Removed the unused 'loansForCalculations' variable
    const { defaultCards, rolloverAmount, hasUnsettledLoans } = useDashboardCalculations(
        loans,
        selectedMonth,
        settings,
        isMobile
    );

    const handleRollover = async () => {
        if (!selectedMonth) return;
        
        const nextMonth = dayjs(selectedMonth).add(1, 'month').format("YYYY-MM");
        const updatedSettings = {
            ...settings,
            monthlySettings: {
                ...(settings.monthlySettings || {}),
                [nextMonth]: {
                    ...(settings.monthlySettings?.[nextMonth] || {}),
                    capital: rolloverAmount
                }
            }
        };

        try {
            await updateSettings(updatedSettings);
            showSnackbar(`Successfully pushed K ${rolloverAmount.toLocaleString()} to ${dayjs(nextMonth).format("MMMM YYYY")}`, "success");
        } catch (error) {
            console.error("Rollover error:", error);
            showSnackbar("Failed to perform rollover.", "error");
        }
    };

    const insights = useInsights(loans, borrowers, payments, dayjs(selectedMonth).startOf('month').format("YYYY-MM-DD"), dayjs(selectedMonth).endOf('month').format("YYYY-MM-DD"));

    const visibleInsights = useMemo(() => {
        return insights.filter(i => !dismissedInsights.includes(i.id || i.message));
    }, [insights, dismissedInsights]);

    // Removed the old useEffect that used localStorage

    const cardsToRender = useMemo(() => {
        const allVisibleCards = defaultCards.filter(card => !hiddenCards.includes(card.id));
        const sortedCards = cardsOrder.length
            ? cardsOrder
                .map(id => allVisibleCards.find(c => c.id === id))
                .filter(Boolean)
            : allVisibleCards;

        // Group cards by their 'group' property
        const grouped = sortedCards.reduce((acc, card) => {
            const groupName = card.group || 'Ungrouped'; // Default to 'Ungrouped' if no group is defined
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(card);
            return acc;
        }, {});

        // Maintain order of groups for display
        const orderedGroupNames = [
          "Financial Overview", // Explicitly define group order
          "Loan Portfolio",
          "Ungrouped" // Fallback for cards without a defined group
        ].filter(groupName => grouped[groupName] && grouped[groupName].length > 0);

        return orderedGroupNames.map(groupName => ({
            name: groupName,
            cards: grouped[groupName]
        }));
    }, [cardsOrder, defaultCards, hiddenCards]);

    /* 
    // DragDropContext has been removed to optimize initial load bundle size.
    // Commenting out onDragEnd to resolve ESLint unused variable warning.
    const onDragEnd = useCallback(
        (result) => {
            const { source, destination } = result;

            if (!destination) {
                return;
            }

            // Helper to reorder an array
            const reorder = (list, startIndex, endIndex) => {
                const result = Array.from(list);
                const [removed] = result.splice(startIndex, 1);
                result.splice(endIndex, 0, removed);
                return result;
            };

            // Helper to move an item from one list to another
            const move = (sourceList, destinationList, source, destination) => {
                const sourceClone = Array.from(sourceList);
                const destClone = Array.from(destinationList);
                // eslint-disable-next-line no-unused-vars
                const [removed] = sourceClone.splice(source.index, 1);

                destClone.splice(destination.index, 0, removed);
                return { sourceList: sourceClone, destinationList: destClone };
            };

            // Get a flat list of all currently visible cards with their full data
            const allVisibleCards = defaultCards.filter(card => !hiddenCards.includes(card.id));
            const currentFlatCards = cardsOrder.length
                ? cardsOrder.map(id => allVisibleCards.find(c => c.id === id)).filter(Boolean)
                : allVisibleCards;

            // Reconstruct the grouped structure based on the currentFlatCards
            const currentGroupedCards = currentFlatCards.reduce((acc, card) => {
                const groupName = card.group || 'Ungrouped';
                if (!acc[groupName]) {
                    acc[groupName] = [];
                }
                acc[groupName].push(card);
                return acc;
            }, {});

            // Extract the actual lists of cards for source and destination droppables
            const sourceCards = currentGroupedCards[source.droppableId];
            const destinationCards = currentGroupedCards[destination.droppableId];

            let newGroupedCards = { ...currentGroupedCards };

            // Case 1: Dragged within the same group
            if (source.droppableId === destination.droppableId) {
                const reordered = reorder(sourceCards, source.index, destination.index);
                newGroupedCards[source.droppableId] = reordered;
            }
            // Case 2: Dragged to a different group
            else {
                const result = move(
                    sourceCards,
                    destinationCards,
                    source,
                    destination
                );
                newGroupedCards[source.droppableId] = result.sourceList;
                newGroupedCards[destination.droppableId] = result.destinationList;
            }

            // Flatten the new grouped structure back into the single cardsOrder array
            const finalFlatOrder = Object.values(newGroupedCards).flat().map(card => card.id);

            setCardsOrder(finalFlatOrder);
            saveLayoutToFirestore(finalFlatOrder, hiddenCards);
            showSnackbar("Dashboard layout saved!", "success");
        },
        [cardsOrder, defaultCards, hiddenCards, showSnackbar, saveLayoutToFirestore]
    );
    */


    const handleCardClick = (filter) => {
        let filteredPeekLoans = loans;

        // Filter by month first
        if (selectedMonth) {
            filteredPeekLoans = filteredPeekLoans.filter(l => dayjs(l.startDate).format("YYYY-MM") === selectedMonth);
        }

        // Apply status filters
        if (filter === "overdue") {
            filteredPeekLoans = filteredPeekLoans.filter(l => {
                const totalRepayable = Number(l.totalRepayable || 0);
                const repaidAmount = Number(l.repaidAmount || 0);
                const isPaid = repaidAmount >= totalRepayable && totalRepayable > 0;
                return !isPaid && dayjs(l.dueDate).isBefore(dayjs(), "day");
            });
        } else if (filter === "active") {
            filteredPeekLoans = filteredPeekLoans.filter(l => {
                const totalRepayable = Number(l.totalRepayable || 0);
                const repaidAmount = Number(l.repaidAmount || 0);
                const isPaid = repaidAmount >= totalRepayable && totalRepayable > 0;
                return !isPaid && !dayjs(l.dueDate).isBefore(dayjs(), "day");
            });
        } else if (filter === "paid") {
            filteredPeekLoans = filteredPeekLoans.filter(l => {
                const totalRepayable = Number(l.totalRepayable || 0);
                const repaidAmount = Number(l.repaidAmount || 0);
                return repaidAmount >= totalRepayable && totalRepayable > 0;
            });
        }

        setPeekData({
            title: `${filter.charAt(0).toUpperCase() + filter.slice(1)} Loans`,
            loans: filteredPeekLoans,
            filter: filter
        });
        setPeekOpen(true);
    };

    const handleHiddenChange = (cardId) => {
        const newHidden = hiddenCards.includes(cardId) ? hiddenCards.filter(id => id !== cardId) : [...hiddenCards, cardId];
        setHiddenCards(newHidden);
        saveLayoutToFirestore(cardsOrder, newHidden);
    };

    const handleGroupVisibilityChange = (groupName, show) => {
        const cardIdsInGroup = defaultCards
            .filter(card => (card.group || 'Ungrouped') === groupName)
            .map(card => card.id);

        let newHidden = [...hiddenCards];
        if (show) { // Show all cards in this group
            newHidden = newHidden.filter(id => !cardIdsInGroup.includes(id));
        } else { // Hide all cards in this group
            newHidden = [...new Set([...newHidden, ...cardIdsInGroup])];
        }
        setHiddenCards(newHidden);
        saveLayoutToFirestore(cardsOrder, newHidden);
    };

    const handleGlobalVisibilityChange = (show) => {
        const allCardIds = DEFAULT_CARD_IDS; // Or use defaultCards.map(c => c.id)

        let newHidden = [...hiddenCards];
        if (show) { // Show all cards globally
            newHidden = newHidden.filter(id => !allCardIds.includes(id));
        } else { // Hide all cards globally
            newHidden = [...new Set([...newHidden, ...allCardIds])];
        }
        setHiddenCards(newHidden);
        saveLayoutToFirestore(cardsOrder, newHidden);
    };



    const dashboardSections = [
        {
            id: 'summary',
            title: 'Financial Overview',
            icon: <SummarizeIcon />,
            content: (
                <Box>
                    {selectedMonth && (
                        <Paper 
                            sx={{ 
                                p: 2, 
                                mb: 2, 
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                border: `1px dashed ${theme.palette.primary.main}`,
                                borderRadius: 2,
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2
                            }}
                        >
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                                    Monthly Rollover Available
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Push <strong>K {rolloverAmount.toLocaleString()}</strong> starting capital to {dayjs(selectedMonth).add(1, 'month').format("MMMM YYYY")}.
                                </Typography>
                                {hasUnsettledLoans && (
                                    <Typography variant="caption" display="block" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                                        * Note: You can push again if remaining loans are settled later.
                                    </Typography>
                                )}
                            </Box>
                            <Button 
                                variant="contained" 
                                size="small" 
                                onClick={handleRollover}
                                startIcon={<SummarizeIcon />}
                            >
                                Push to {dayjs(selectedMonth).add(1, 'month').format("MMM")}
                            </Button>
                        </Paper>
                    )}
                    {cardsToRender.filter(group => group.cards.some(card => EXECUTIVE_SUMMARY_IDS.includes(card.id))).map(group => (
                        <Box key={group.name} sx={{ mb: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, px: 1, fontWeight: 800, fontSize: '1.1rem' }}>
                                {group.name}
                            </Typography>
                            <DashboardSection cards={group.cards} droppableId={group.name} isMobile={isMobile} handleCardClick={handleCardClick} loading={loading} />
                        </Box>
                    ))}
                </Box>
            ),
        },
        {
            id: 'metrics',
            title: 'Metrics',
            icon: <BarChartIcon />,
            content: (
                <Grid container spacing={2}>
                    {cardsToRender.filter(group => group.cards.some(card => !EXECUTIVE_SUMMARY_IDS.includes(card.id))).map(group => (
                        <Grid xs={12} key={group.name}>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, px: 2, fontWeight: 'bold' }}>
                                    {group.name}
                                </Typography>
                                <DashboardSection cards={group.cards} droppableId={group.name} isMobile={isMobile} handleCardClick={handleCardClick} loading={loading} />
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            ),
        },
        {
            id: 'charts',
            title: 'Charts',
            icon: <ShowChartIcon />,
            content: (
                <Suspense fallback={ <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}><CircularProgress color="primary" /></Box> }>
                    <LazyCharts
                        loans={loans}
                        borrowers={borrowers}
                        payments={payments}
                        expenses={expenses}
                    />
                </Suspense>
            ),
        },
        {
            id: 'insights',
            title: 'Insights',
            icon: <InsightsIcon />,
            content: (
                <Grid container spacing={2}>
                    {visibleInsights.filter(insight => !insight.action).map((insight, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <InsightCard insight={insight} onDismiss={handleDismissInsight} />
                        </Grid>
                    ))}
                </Grid>
            ),
        },
    ];

    const userName = currentUser?.displayName?.split(' ')[0] || currentUser?.email;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: theme.palette.background.default,
                p: { xs: 2, md: 3 },
                pb: isMobile ? `calc(${BOTTOM_NAV_HEIGHT}px + ${theme.spacing(2)})` : 3,
            }}
        >
            {userName && showWelcome && (
                <Box sx={{ animation: `${popInAnimation} 0.5s ease-out forwards`, mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary, letterSpacing: '-0.02em' }}>
                        Welcome back, {userName}!
                    </Typography>
                </Box>
            )}


            {/* Date Selector and Customize Button */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' }, 
                justifyContent: 'space-between', 
                gap: 2, 
                mb: 3, 
                mt: userName && showWelcome ? 2 : 0 
            }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                        label="This Month" 
                        onClick={() => setSelectedMonth(dayjs().format("YYYY-MM"))}
                        color={selectedMonth === dayjs().format("YYYY-MM") ? "primary" : "default"}
                        variant={selectedMonth === dayjs().format("YYYY-MM") ? "filled" : "outlined"}
                        size="small"
                    />
                    <Chip 
                        label="Last Month" 
                        onClick={() => setSelectedMonth(dayjs().subtract(1, 'month').format("YYYY-MM"))}
                        color={selectedMonth === dayjs().subtract(1, 'month').format("YYYY-MM") ? "primary" : "default"}
                        variant={selectedMonth === dayjs().subtract(1, 'month').format("YYYY-MM") ? "filled" : "outlined"}
                        size="small"
                    />
                    <Chip 
                        label="All Time" 
                        onClick={() => setSelectedMonth("")}
                        color={selectedMonth === "" ? "primary" : "default"}
                        variant={selectedMonth === "" ? "filled" : "outlined"}
                        size="small"
                    />
                </Stack>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
                    <TextField
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 150 }}
                    />
                    <IconButton onClick={() => setCustomizeOpen(true)} color="primary" aria-label="Customize Dashboard">
                        <TuneIcon />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", md: "1.75rem" }, letterSpacing: '-0.01em' }}>
                  Dashboard
              </Typography>
                          </Box>

            {/* Actionable Insights Section */}
            {visibleInsights.filter(insight => insight.action).map((insight, index) => (
              <InsightCard key={index} insight={{
                ...insight,
                action: {
                  ...insight.action,
                  onClick: () => {
                    if (insight.action.label === 'View Overdue Loans') {
                      navigate('/loans?filter=overdue');
                    } else if (insight.action.label === 'View Upcoming Loans') {
                      navigate('/loans?filter=upcoming');
                    }
                  }
                }
              }} onDismiss={handleDismissInsight} />
            ))}
            


            {/* DragDropContext has been removed to optimize initial load bundle size. */}
            <ResponsiveContentDisplay sections={dashboardSections} />
            <Dialog open={customizeOpen} onClose={() => setCustomizeOpen(false)}>
                <DialogTitle>Customize Dashboard</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>Select the cards you want to see on your dashboard.</Typography>

                    <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => handleGlobalVisibilityChange(true)}>Show All</Button>
                        <Button size="small" variant="outlined" onClick={() => handleGlobalVisibilityChange(false)}>Hide All</Button>
                    </Box>

                    {cardsToRender.map(group => (
                        <Box key={group.name} sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" gutterBottom>
                                    {group.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button size="small" onClick={() => handleGroupVisibilityChange(group.name, true)}>Show Group</Button>
                                    <Button size="small" onClick={() => handleGroupVisibilityChange(group.name, false)}>Hide Group</Button>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2 }}>
                                {group.cards.map(card => (
                                    <FormControlLabel
                                        key={card.id}
                                        control={<Checkbox checked={!hiddenCards.includes(card.id)} onChange={() => handleHiddenChange(card.id)} />}
                                        label={card.label}
                                    />
                                ))}
                            </Box>
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCustomizeOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Peek Dialog */}
            <Dialog open={peekOpen} onClose={() => setPeekOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>{peekData.title}</DialogTitle>
                <DialogContent dividers>
                    {peekData.loans.length === 0 ? (
                        <Typography color="text.secondary" align="center">No loans found for this category.</Typography>
                    ) : (
                        <List>
                            {peekData.loans.map((loan) => {
                                const borrower = borrowers.find(b => b.id === loan.borrowerId);
                                const outstanding = Number(loan.totalRepayable || 0) - Number(loan.repaidAmount || 0);
                                return (
                                    <ListItem key={loan.id} divider>
                                        <ListItemText 
                                            primary={borrower?.name || "Unknown Borrower"}
                                            secondary={`Due: ${loan.dueDate}`}
                                        />
                                        <ListItemSecondaryAction>
                                            <Typography variant="body2" fontWeight="bold">
                                                ZMW {outstanding.toFixed(2)}
                                            </Typography>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between', px: 2 }}>
                    <Button onClick={() => setPeekOpen(false)}>Close</Button>
                    <Button 
                        color="primary" 
                        variant="contained" 
                        onClick={() => {
                            const params = new URLSearchParams();
                            if (peekData.filter !== "all") params.set("filter", peekData.filter);
                            if (selectedMonth) params.set("month", selectedMonth);
                            navigate(`/loans?${params.toString()}`);
                            setPeekOpen(false);
                        }}
                    >
                        View All
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
