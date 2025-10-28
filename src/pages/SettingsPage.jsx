import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useSnackbar } from "../components/SnackbarProvider";
import { useFirestore } from "../contexts/FirestoreProvider";
import { subscribeUserToPushNotifications } from "../utils/push";

// TabPanel component for managing tab content visibility and accessibility
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ mt: 2 }}>{children}</Box> // Consistent margin top for tab content
      )}
    </div>
  );
}

// Helper function for accessibility props for Tabs
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

// SettingsPage component, accepts an onClose prop for when it's rendered in a Dialog
export default function SettingsPage({ onClose }) {
  const { settings, updateSettings, updateUser, currentUser } = useFirestore();
  const showSnackbar = useSnackbar();

  const [tabIndex, setTabIndex] = useState(0);
  
  // New state for month and year selection
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // State for monthly capital and interest rates
  const [monthlyCapital, setMonthlyCapital] = useState("0");
  const [interestRates, setInterestRates] = useState({
    oneWeek: "0",
    twoWeeks: "0",
    threeWeeks: "0",
    fourWeeks: "0",
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    overdue: true,
    upcoming: true,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Effect to load settings when the component mounts or settings data changes, or when month/year changes
  useEffect(() => {
    const year = selectedYear.toString();
    const month = selectedMonth.toString().padStart(2, '0');
    const monthKey = `${year}-${month}`;

    if (settings && settings.monthlySettings && settings.monthlySettings[monthKey]) {
      const monthSettings = settings.monthlySettings[monthKey];
      setMonthlyCapital(monthSettings.capital?.toString() || "0");
      if (monthSettings.interestRates) {
        setInterestRates({
          oneWeek: monthSettings.interestRates.oneWeek?.toString() || "0",
          twoWeeks: monthSettings.interestRates.twoWeeks?.toString() || "0",
          threeWeeks: monthSettings.interestRates.threeWeeks?.toString() || "0",
          fourWeeks: monthSettings.interestRates.fourWeeks?.toString() || "0",
        });
      }
    } else {
      setMonthlyCapital("0");
      setInterestRates({ oneWeek: "0", twoWeeks: "0", threeWeeks: "0", fourWeeks: "0" });
    }

    if (currentUser && currentUser.notificationPreferences) {
      setNotificationPreferences(currentUser.notificationPreferences);
    }
  }, [settings, selectedYear, selectedMonth, currentUser]);

  const handleTabChange = (_, newValue) => {
    setTabIndex(newValue);
    setMessage(""); // Clear message when changing tabs
  };

  const handleMonthlyCapitalChange = (e) => {
    setMessage(""); // Clear message on input change
    setMonthlyCapital(e.target.value);
  };

  const handleInterestRateChange = (field) => (e) => {
    setMessage(""); // Clear message on input change
    setInterestRates({ ...interestRates, [field]: e.target.value });
  };

  const handleNotificationPreferenceChange = (event) => {
    setNotificationPreferences({
      ...notificationPreferences,
      [event.target.name]: event.target.checked,
    });
  };

  const handleSaveNotificationPreferences = async () => {
    setLoading(true);
    try {
      await updateUser({ notificationPreferences });
      setMessage("Notification preferences saved successfully.");
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      setMessage("Failed to save notification preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      await subscribeUserToPushNotifications();
      showSnackbar("Successfully subscribed to notifications!", "success");
    } catch (error) {
      showSnackbar("Failed to subscribe to notifications.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(""); // Clear previous messages before new submission

    const capitalValue = parseFloat(monthlyCapital);
    if (isNaN(capitalValue) || capitalValue < 0) {
      setMessage("Please enter a valid non-negative number for Invested Capital.");
      setLoading(false);
      return;
    }

    const numericInterestRates = {};
    for (const key in interestRates) {
      const val = parseFloat(interestRates[key]);
      if (isNaN(val) || val < 0) {
        setMessage("Please enter valid non-negative numbers for all interest rates.");
        setLoading(false);
        return;
      }
      numericInterestRates[key] = val;
    }

    if (capitalValue > 1_000_000_000) {
      setMessage("Invested Capital seems excessively high. Please review.");
      setLoading(false);
      return;
    }

    const year = selectedYear.toString();
    const month = selectedMonth.toString().padStart(2, '0');
    const monthKey = `${year}-${month}`;

    const updatedSettings = {
      ...settings,
      monthlySettings: {
        ...(settings.monthlySettings || {}),
        [monthKey]: {
          capital: capitalValue,
          interestRates: numericInterestRates,
        },
      },
    };

    try {
      await updateSettings(updatedSettings);
      setMessage("Settings saved successfully.");
    } catch (error) {
      console.error("Error updating settings:", error);
      setMessage("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessage(""); // Clear message on reset
    const year = selectedYear.toString();
    const month = selectedMonth.toString().padStart(2, '0');
    const monthKey = `${year}-${month}`;

    if (settings && settings.monthlySettings && settings.monthlySettings[monthKey]) {
        const monthSettings = settings.monthlySettings[monthKey];
        setMonthlyCapital(monthSettings.capital?.toString() || "0");
        if (monthSettings.interestRates) {
            setInterestRates({
                oneWeek: monthSettings.interestRates.oneWeek?.toString() || "0",
                twoWeeks: monthSettings.interestRates.twoWeeks?.toString() || "0",
                threeWeeks: monthSettings.interestRates.threeWeeks?.toString() || "0",
                fourWeeks: monthSettings.interestRates.fourWeeks?.toString() || "0",
            });
        } else {
            setInterestRates({ oneWeek: "0", twoWeeks: "0", threeWeeks: "0", fourWeeks: "0" });
        }
    } else {
        setMonthlyCapital("0");
        setInterestRates({ oneWeek: "0", twoWeeks: "0", threeWeeks: "0", fourWeeks: "0" });
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

  return (
    <Box
      sx={{
        p: { xs: 3, sm: 4 }, // Add padding directly to the main content box for dialogs
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Settings
      </Typography>

      {message && (
        <Alert
          severity={message.includes("successfully") ? "success" : "error"}
          onClose={() => setMessage("")}
          sx={{ mb: 3 }}
        >
          {message}
        </Alert>
      )}

      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="settings tabs"
        sx={{ mb: 3 }}
      >
        <Tab label="Monthly Settings" {...a11yProps(0)} />
        <Tab label="Notifications" {...a11yProps(1)} />
      </Tabs>

      <form onSubmit={handleSubmit}>
        <TabPanel value={tabIndex} index={0}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                    <FormControl fullWidth>
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={selectedYear}
                            label="Year"
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            {years.map(year => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={6}>
                    <FormControl fullWidth>
                        <InputLabel>Month</InputLabel>
                        <Select
                            value={selectedMonth}
                            label="Month"
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            {months.map(month => (
                                <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
          <Stack spacing={3}>
            <TextField
                label="Invested Capital (ZMW)"
                type="number"
                value={monthlyCapital}
                onChange={handleMonthlyCapitalChange}
                required
                fullWidth
                inputProps={{ min: 0, step: "any" }}
                margin="normal"
            />
            <TextField
              label="Interest Rate for 1 Week (%)"
              type="number"
              value={interestRates.oneWeek}
              onChange={handleInterestRateChange("oneWeek")}
              required
              inputProps={{ min: 0, step: "any" }}
              margin="normal"
            />
            <TextField
              label="Interest Rate for 2 Weeks (%)"
              type="number"
              value={interestRates.twoWeeks}
              onChange={handleInterestRateChange("twoWeeks")}
              required
              inputProps={{ min: 0, step: "any" }}
              margin="normal"
            />
            <TextField
              label="Interest Rate for 3 Weeks (%)"
              type="number"
              value={interestRates.threeWeeks}
              onChange={handleInterestRateChange("threeWeeks")}
              required
              inputProps={{ min: 0, step: "any" }}
              margin="normal"
            />
            <TextField
              label="Interest Rate for 4 Weeks (%)"
              type="number"
              value={interestRates.fourWeeks}
              onChange={handleInterestRateChange("fourWeeks")}
              required
              inputProps={{ min: 0, step: "any" }}
              margin="normal"
            />
          </Stack>
        </TabPanel>
        
        <TabPanel value={tabIndex} index={1}>
          <Typography variant="body1" gutterBottom>
            Enable push notifications to stay updated on loan statuses and payments.
          </Typography>
          <Button
            variant="contained"
            onClick={handleSubscribe}
            sx={{ mt: 2 }}
          >
            Enable Notifications
          </Button>
          <Box mt={4}>
            <Typography variant="h6">Notification Preferences</Typography>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={notificationPreferences.overdue} onChange={handleNotificationPreferenceChange} name="overdue" />}
                label="Overdue Loan Reminders"
              />
              <FormControlLabel
                control={<Checkbox checked={notificationPreferences.upcoming} onChange={handleNotificationPreferenceChange} name="upcoming" />}
                label="Upcoming Payment Reminders"
              />
            </FormGroup>
            <Button
              variant="contained"
              onClick={handleSaveNotificationPreferences}
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
          </Box>
        </TabPanel>

        {tabIndex !== 1 && (
        <Box mt={3} display="flex" gap={2}>
          <Button
            variant="contained"
            type="submit"
            fullWidth
            disabled={loading}
            size="large"
          >
            {loading ? "Saving..." : "Save Settings"}
          </Button>

          <Button
            variant="outlined"
            onClick={handleReset}
            fullWidth
            disabled={loading}
            size="large"
          >
            Reset
          </Button>
        </Box>
        )}
      </form>
    </Box>
  );
}
