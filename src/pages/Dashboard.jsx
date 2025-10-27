import React, { useState, useEffect, useCallback, lazy, Suspense, useMemo } from "react";
import {
    Box,
    Typography,
    useTheme,
    useMediaQuery,
    TextField,
    CircularProgress,
    Tabs,
    Tab,
    Grid,
    Skeleton,
    List,
    ListItem,
    ListItemText,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    FormControlLabel,
} from "@mui/material";
import { keyframes } from "@mui/system";

// CHANGED: Corrected the import path for SummarizeIcon
import SummarizeIcon from '@mui/icons-material/Summarize';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import InsightsIcon from '@mui/icons-material/Insights';
import TuneIcon from '@mui/icons-material/Tune';

import WarningAmber from '@mui/icons-material/WarningAmber';
import { useNavigate } from "react-router-dom";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useAuth } from "../contexts/AuthProvider.js";
import dayjs from "dayjs";
import { useSnackbar } from "../components/SnackbarProvider";

import { DragDropContext } from "@hello-pangea/dnd";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNavBar";
import { useDashboardCalculations } from "../hooks/dashboard/useDashboardCalculations";
import { useInsights } from "../hooks/useInsights";
import DashboardSection from "../components/dashboard/DashboardSection";
import DashboardCardSkeleton from "../components/dashboard/DashboardCardSkeleton";

const LazyCharts = lazy(() => import("../components/Charts"));

// (The rest of the initial constants and helper functions remain the same)
const STORAGE_KEY = "dashboardCardOrder";
const HIDDEN_CARDS_KEY = "hiddenDashboardCards";
const DEFAULT_CARD_IDS = [
    "investedCapital", "availableCapital", "totalDisbursed", "totalCollected", "partnerDividends",
    "totalLoans", "paidLoans", "activeLoans", "overdueLoans", "totalOutstanding",
    "expectedProfit", "actualProfit",
];
const EXECUTIVE_SUMMARY_IDS = [
    "investedCapital", "availableCapital", "totalDisbursed", "totalCollected", "partnerDividends",
];

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other} >
            {value === index && ( <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box> )}
        </div>
    );
}

function a11yProps(index) {
    return { id: `simple-tab-${index}`, "aria-controls": `simple-tabpanel-${index}`};
}

const popInAnimation = keyframes`
  0% { opacity: 0; transform: scale(0.9) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
`;


export default function Dashboard() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    
    const { loans, borrowers, payments, expenses, settings, loading } = useFirestore();
    
    const { currentUser } = useAuth();
    const showSnackbar = useSnackbar();

    const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
    const [cardsOrder, setCardsOrder] = useState([]);
    const [hiddenCards, setHiddenCards] = useState([]);
    const [customizeOpen, setCustomizeOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [showWelcome, setShowWelcome] = useState(false);

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
    const { defaultCards } = useDashboardCalculations(
        loans,
        selectedMonth,
        settings,
        isMobile
    );

    const insights = useInsights(loans, borrowers);

    const actionItems = useMemo(() => {
        if (!loans) return { overdueCount: 0, dueThisWeekCount: 0 };

        const overdue = loans.filter(loan => {
            if (loan.status === 'Defaulted') return false;
            const totalRepayable = Number(loan.totalRepayable || 0);
            const repaidAmount = Number(loan.repaidAmount || 0);
            if (repaidAmount >= totalRepayable && totalRepayable > 0) return false;
            return dayjs(loan.dueDate).isBefore(dayjs(), "day");
        });

        const dueThisWeek = loans.filter(loan => {
            if (loan.status === 'Defaulted') return false;
            const totalRepayable = Number(loan.totalRepayable || 0);
            const repaidAmount = Number(loan.repaidAmount || 0);
            if (repaidAmount >= totalRepayable && totalRepayable > 0) return false;
            const dueDate = dayjs(loan.dueDate);
            const now = dayjs();
            return dueDate.isAfter(now, "day") && dueDate.isBefore(now.add(7, 'day'), "day");
        });

        return {
            overdueCount: overdue.length,
            dueThisWeekCount: dueThisWeek.length,
        };
    }, [loans]);

    useEffect(() => {
        if (loans) {
            const savedOrder = localStorage.getItem(STORAGE_KEY);
            const savedHidden = localStorage.getItem(HIDDEN_CARDS_KEY);
            try {
                const parsedOrder = savedOrder ? JSON.parse(savedOrder) : [];
                const parsedHidden = savedHidden ? JSON.parse(savedHidden) : [];
                const validOrder = parsedOrder.filter((id) => DEFAULT_CARD_IDS.includes(id));
                const finalOrder = [...new Set([...validOrder, ...DEFAULT_CARD_IDS])];
                setCardsOrder(finalOrder);
                setHiddenCards(parsedHidden);
            } catch (error) {
                console.error("Error parsing saved card order from localStorage:", error);
                setCardsOrder(DEFAULT_CARD_IDS);
                setHiddenCards([]);
            }
        }
    }, [loans]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const cardsToRender = useMemo(
        () => cardsOrder.length ? cardsOrder.map((id) => defaultCards.find((c) => c.id === id)).filter(Boolean).filter(card => !hiddenCards.includes(card.id)) : defaultCards.filter(card => !hiddenCards.includes(card.id)),
        [cardsOrder, defaultCards, hiddenCards]
    );

    const executiveSummaryCards = cardsToRender.filter((card) => EXECUTIVE_SUMMARY_IDS.includes(card.id));
    const metricsCards = cardsToRender.filter((card) => !EXECUTIVE_SUMMARY_IDS.includes(card.id));

    const onDragEnd = useCallback(
        (result) => {
            const { source, destination } = result;
            if (!destination || source.droppableId !== destination.droppableId) {
                showSnackbar("Cards can only be reordered within their own section.", "error");
                return;
            }
            let reorderedCards; let newCardsOrder;
            if (source.droppableId === "executive-summary-droppable") {
                reorderedCards = Array.from(executiveSummaryCards);
                const [removed] = reorderedCards.splice(source.index, 1);
                reorderedCards.splice(destination.index, 0, removed);
                const metricsSectionIds = metricsCards.map((c) => c.id);
                newCardsOrder = [...reorderedCards.map((c) => c.id), ...metricsSectionIds];
            } else {
                reorderedCards = Array.from(metricsCards);
                const [removed] = reorderedCards.splice(source.index, 1);
                reorderedCards.splice(destination.index, 0, removed);
                const executiveSectionIds = executiveSummaryCards.map((c) => c.id);
                newCardsOrder = [...executiveSectionIds, ...reorderedCards.map((c) => c.id)];
            }
            setCardsOrder(newCardsOrder);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newCardsOrder));
            showSnackbar("Dashboard layout saved!", "success");
        },
        [executiveSummaryCards, metricsCards, showSnackbar]
    );

    const handleCardClick = (filter) => {
        const params = new URLSearchParams();
        if (filter !== "all") params.set("filter", filter);
        if (selectedMonth) params.set("month", selectedMonth);
        navigate(`/loans?${params.toString()}`);
    };

    const handleHiddenChange = (cardId) => {
        const newHidden = hiddenCards.includes(cardId) ? hiddenCards.filter(id => id !== cardId) : [...hiddenCards, cardId];
        setHiddenCards(newHidden);
        localStorage.setItem(HIDDEN_CARDS_KEY, JSON.stringify(newHidden));
    };

    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    <Skeleton width="200px" />
                </Typography>
                <Grid container spacing={2}>
                    {[...Array(8)].map((_, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}><DashboardCardSkeleton /></Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

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
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                        Welcome back, {userName}!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Here's your financial overview for {dayjs(selectedMonth).format("MMMM YYYY")}.
                    </Typography>
                </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: "1.5rem", md: "2rem" } }}>
                  Dashboard
              </Typography>
              <Button startIcon={<TuneIcon />} onClick={() => setCustomizeOpen(true)}>Customize</Button>
            </Box>

            {actionItems.overdueCount > 0 &&
                <Box sx={{ p: 2, mb: 2, backgroundColor: theme.palette.error.light, borderRadius: 2, display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.error.main, } }} onClick={() => navigate('/loans?filter=overdue')} >
                    <WarningAmber sx={{ color: theme.palette.error.contrastText, mr: 1.5 }} />
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme.palette.error.contrastText }}>Overdue Loans</Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.error.contrastText }}>{actionItems.overdueCount} loan(s) are overdue.</Typography>
                    </Box>
                </Box>
            }
            {actionItems.dueThisWeekCount > 0 &&
                <Box sx={{ p: 2, mb: 2, backgroundColor: theme.palette.info.light, borderRadius: 2, display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { backgroundColor: theme.palette.info.main, } }} onClick={() => navigate('/loans?filter=upcoming')} >
                    <WarningAmber sx={{ color: theme.palette.info.contrastText, mr: 1.5 }} />
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme.palette.info.contrastText }}>Upcoming Payments</Typography>
                        <Typography variant="body2" sx={{ color: theme.palette.info.contrastText }}>{actionItems.dueThisWeekCount} payment(s) due this week.</Typography>
                    </Box>
                </Box>
            }

            <Box mb={isMobile ? 1.5 : 2} maxWidth={isMobile ? "100%" : 200}>
                <TextField label="Select Month" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} size="small" fullWidth InputLabelProps={{ shrink: true }} />
            </Box>

            <Box sx={{ width: "100%", boxShadow: theme.shadows[3], borderRadius: 4 }} >
                <Box sx={{ backgroundColor: theme.palette.background.paper, borderRadius: 4, display: 'flex', alignItems: 'center', p: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                    <Tabs value={activeTab} onChange={handleTabChange} aria-label="dashboard sections tabs" variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile >
                        <Tab icon={<SummarizeIcon />} label="Summary" {...a11yProps(0)} />
                        <Tab icon={<BarChartIcon />} label="Metrics" {...a11yProps(1)} />
                        <Tab icon={<ShowChartIcon />} label="Charts" {...a11yProps(2)} />
                        <Tab icon={<InsightsIcon />} label="Insights" {...a11yProps(3)} />
                    </Tabs>
                </Box>
                <DragDropContext onDragEnd={onDragEnd}>
                    <TabPanel value={activeTab} index={0}>
                        <DashboardSection cards={executiveSummaryCards} droppableId="executive-summary-droppable" isMobile={isMobile} handleCardClick={handleCardClick} />
                    </TabPanel>
                    <TabPanel value={activeTab} index={1}>
                        <DashboardSection cards={metricsCards} droppableId="metrics-droppable" isMobile={isMobile} handleCardClick={handleCardClick} />
                    </TabPanel>
                </DragDropContext>
                <TabPanel value={activeTab} index={2}>
                    <Suspense fallback={ <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}><CircularProgress color="primary" /></Box> }>
                        <LazyCharts
                            loans={loans}
                            borrowers={borrowers}
                            payments={payments}
                            expenses={expenses}
                        />
                    </Suspense>
                </TabPanel>
                <TabPanel value={activeTab} index={3}>
                    <List>
                        {insights.map((insight, index) => (
                            <ListItem key={index}>
                                <ListItemText primary={insight} />
                            </ListItem>
                        ))}
                    </List>
                </TabPanel>
            </Box>
            <Dialog open={customizeOpen} onClose={() => setCustomizeOpen(false)}>
                <DialogTitle>Customize Dashboard</DialogTitle>
                <DialogContent>
                    <Typography>Select the cards you want to see on your dashboard.</Typography>
                    {DEFAULT_CARD_IDS.map(cardId => {
                        const card = defaultCards.find(c => c.id === cardId);
                        if (!card) return null;
                        return (
                            <FormControlLabel
                                key={cardId}
                                control={<Checkbox checked={!hiddenCards.includes(cardId)} onChange={() => handleHiddenChange(cardId)} />}
                                label={card.label}
                            />
                        )
                    })}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCustomizeOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
