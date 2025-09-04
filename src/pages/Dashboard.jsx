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
} from "@mui/material";
import { keyframes } from "@mui/system";

import SummarizeIcon from '@mui/icons-material/Summarize';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useNavigate } from "react-router-dom";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useAuth } from "../contexts/AuthProvider.js";
import dayjs from "dayjs"; // <-- Add this import
import { useSnackbar } from "../components/SnackbarProvider";

import { DragDropContext } from "@hello-pangea/dnd";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNavBar";
import { useDashboardCalculations } from "../hooks/dashboard/useDashboardCalculations";
import DashboardSection from "../components/dashboard/DashboardSection";
import DashboardCardSkeleton from "../components/dashboard/DashboardCardSkeleton";

const LazyCharts = lazy(() => import("../components/Charts"));

const STORAGE_KEY = "dashboardCardOrder";

const DEFAULT_CARD_IDS = [
    "investedCapital",
    "availableCapital",
    "totalDisbursed",
    "totalCollected",
    "partnerDividends",
    "totalLoans",
    "paidLoans",
    "activeLoans",
    "overdueLoans",
    "totalOutstanding",
    "expectedProfit",
    "actualProfit",
];
const EXECUTIVE_SUMMARY_IDS = [
    "investedCapital",
    "availableCapital",
    "totalDisbursed",
    "totalCollected",
    "partnerDividends",
];

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: { xs: 2, md: 3 } }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
}

const popInAnimation = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  75% {
    opacity: 1;
    transform: scale(1.05) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

export default function Dashboard() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { loans, settings, loading } = useFirestore(); 
    const { currentUser } = useAuth();
    const showSnackbar = useSnackbar();

    const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
    const [cardsOrder, setCardsOrder] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [showWelcome, setShowWelcome] = useState(true);

    const { loansForCalculations, defaultCards } = useDashboardCalculations(
        loans,
        selectedMonth,
        settings,
        isMobile
    );

    useEffect(() => {
        if (currentUser) {
            const timer = setTimeout(() => {
                setShowWelcome(false);
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [currentUser]);

    useEffect(() => {
        if (loans) {
            const savedOrder = localStorage.getItem(STORAGE_KEY);
            try {
                const parsedOrder = savedOrder ? JSON.parse(savedOrder) : [];
                const validOrder = parsedOrder.filter((id) =>
                    DEFAULT_CARD_IDS.includes(id)
                );
                const finalOrder = [...new Set([...validOrder, ...DEFAULT_CARD_IDS])];
                setCardsOrder(finalOrder);
            } catch (error) {
                console.error("Error parsing saved card order from localStorage:", error);
                setCardsOrder(DEFAULT_CARD_IDS);
            }
        }
    }, [loans]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const cardsToRender = useMemo(
        () =>
            cardsOrder.length
                ? cardsOrder.map((id) => defaultCards.find((c) => c.id === id)).filter(Boolean)
                : defaultCards,
        [cardsOrder, defaultCards]
    );

    const executiveSummaryCards = cardsToRender.filter((card) =>
        EXECUTIVE_SUMMARY_IDS.includes(card.id)
    );
    const metricsCards = cardsToRender.filter(
        (card) => !EXECUTIVE_SUMMARY_IDS.includes(card.id)
    );

    const onDragEnd = useCallback(
        (result) => {
            const { source, destination } = result;
            if (!destination || source.droppableId !== destination.droppableId) {
                showSnackbar("Cards can only be reordered within their own section.", "error");
                return;
            }

            let reorderedCards;
            let newCardsOrder;

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

    if (loading) {
        return (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    <Skeleton width="200px" />
                </Typography>
                <Grid container spacing={2}>
                    {[...Array(8)].map((_, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <DashboardCardSkeleton />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    const userName = currentUser?.displayName || currentUser?.email;

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
                <Box
                    sx={{
                        animation: `${popInAnimation} 0.5s ease-out forwards`,
                        mb: 1,
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            color: theme.palette.text.secondary,
                            fontWeight: 600,
                        }}
                    >
                        Welcome back, {userName}!
                    </Typography>
                </Box>
            )}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: "1.5rem", md: "2rem" } }}>
                Dashboard
            </Typography>
            <Box mb={isMobile ? 1.5 : 2} maxWidth={isMobile ? "100%" : 200}>
                <TextField
                    label="Select Month"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: theme.palette.background.paper,
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: theme.palette.secondary.main,
                            },
                        },
                        "& .MuiInputBase-input": {
                            padding: isMobile ? "10px 14px" : "12px 16px",
                        },
                        "& .MuiInputLabel-root": {
                            transform: isMobile ? "translate(14px, 10px) scale(0.75)" : "translate(14px, 12px) scale(0.75)",
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                            color: theme.palette.secondary.main,
                        },
                        "& .MuiInputLabel-shrink": {
                            transform: "translate(14px, -9px) scale(0.75)",
                        },
                    }}
                />
            </Box>

            <Box
                sx={{
                    width: "100%",
                    boxShadow: theme.shadows[3],
                    borderRadius: 4,
                }}
            >
                <Box sx={{
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    p: { xs: 0.5, sm: 1 },
                    flexWrap: 'wrap'
                }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        aria-label="dashboard sections tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            "& .MuiTabs-indicator": {
                                display: "flex",
                                justifyContent: "center",
                                backgroundColor: "transparent",
                                '& > span': {
                                    maxWidth: 40,
                                    width: '100%',
                                    backgroundColor: theme.palette.secondary.main,
                                },
                            },
                            "& .MuiTabs-flexContainer": {
                                gap: { xs: 0, sm: 1 },
                            }
                        }}
                    >
                        <Tab
                            icon={<SummarizeIcon />}
                            label="Summary"
                            {...a11yProps(0)}
                            sx={{
                                color: activeTab === 0 ? theme.palette.secondary.main : theme.palette.text.secondary,
                                fontWeight: activeTab === 0 ? 600 : 500,
                                borderRadius: 999,
                                backgroundColor: activeTab === 0 ? theme.palette.secondary.light + '33' : 'transparent',
                                textTransform: 'none',
                                transition: 'all 0.3s ease',
                                minHeight: 48,
                                minWidth: 'auto',
                                px: { xs: 1.5, sm: 2 },
                                "&:hover": {
                                    backgroundColor: activeTab === 0 ? theme.palette.secondary.light + '33' : theme.palette.action.hover,
                                    color: theme.palette.secondary.main,
                                },
                            }}
                        />
                        <Tab
                            icon={<BarChartIcon />}
                            label="Metrics"
                            {...a11yProps(1)}
                            sx={{
                                color: activeTab === 1 ? theme.palette.secondary.main : theme.palette.text.secondary,
                                fontWeight: activeTab === 1 ? 600 : 500,
                                borderRadius: 999,
                                backgroundColor: activeTab === 1 ? theme.palette.secondary.light + '33' : 'transparent',
                                textTransform: 'none',
                                transition: 'all 0.3s ease',
                                minHeight: 48,
                                minWidth: 'auto',
                                px: { xs: 1.5, sm: 2 },
                                "&:hover": {
                                    backgroundColor: activeTab === 1 ? theme.palette.secondary.light + '33' : theme.palette.action.hover,
                                    color: theme.palette.secondary.main,
                                },
                            }}
                        />
                        <Tab
                            icon={<ShowChartIcon />}
                            label="Charts"
                            {...a11yProps(2)}
                            sx={{
                                color: activeTab === 2 ? theme.palette.secondary.main : theme.palette.text.secondary,
                                fontWeight: activeTab === 2 ? 600 : 500,
                                borderRadius: 999,
                                backgroundColor: activeTab === 2 ? theme.palette.secondary.light + '33' : 'transparent',
                                textTransform: 'none',
                                transition: 'all 0.3s ease',
                                minHeight: 48,
                                minWidth: 'auto',
                                px: { xs: 1.5, sm: 2 },
                                "&:hover": {
                                    backgroundColor: activeTab === 2 ? theme.palette.secondary.light + '33' : theme.palette.action.hover,
                                    color: theme.palette.secondary.main,
                                },
                            }}
                        />
                    </Tabs>
                </Box>
                <DragDropContext onDragEnd={onDragEnd}>
                    <TabPanel value={activeTab} index={0}>
                        <DashboardSection
                            cards={executiveSummaryCards}
                            droppableId="executive-summary-droppable"
                            isMobile={isMobile}
                            handleCardClick={handleCardClick}
                        />
                    </TabPanel>
                    <TabPanel value={activeTab} index={1}>
                        <DashboardSection
                            cards={metricsCards}
                            droppableId="metrics-droppable"
                            isMobile={isMobile}
                            handleCardClick={handleCardClick}
                        />
                    </TabPanel>
                </DragDropContext>
                <TabPanel value={activeTab} index={2}>
                    <Suspense
                        fallback={
                            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                                <CircularProgress color="primary" />
                            </Box>
                        }
                    >
                        {loansForCalculations.length > 0 ? (
                            <LazyCharts loans={loansForCalculations} selectedMonth={selectedMonth} />
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No loan data available for charts.
                            </Typography>
                        )}
                    </Suspense>
                </TabPanel>
            </Box>

            
        </Box>
    );
}