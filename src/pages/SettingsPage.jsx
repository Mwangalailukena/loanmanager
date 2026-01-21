import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
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
import { useAuth } from "../contexts/AuthProvider";
import { requestNotificationPermission } from "../utils/push";
import Profile from "./Profile";
import ChangePassword from "./ChangePassword";

// TabPanel component
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
        <Box sx={{ mt: 2 }}>{children}</Box>
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

export default function SettingsPage({ onClose }) {
  const { settings, updateSettings, updateUser } = useFirestore();
  const { currentUser } = useAuth();
  const showSnackbar = useSnackbar();

  const [tabIndex, setTabIndex] = useState(0);
  
  // Financial Settings State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyCapital, setMonthlyCapital] = useState("0");
  const [interestRates, setInterestRates] = useState({
    1: "0", 2: "0", 3: "0", 4: "0",
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    overdue: true,
    upcoming: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const year = selectedYear.toString();
    const month = selectedMonth.toString().padStart(2, '0');
    const monthKey = `${year}-${month}`;

    if (settings && settings.monthlySettings && settings.monthlySettings[monthKey]) {
      const monthSettings = settings.monthlySettings[monthKey];
      setMonthlyCapital(monthSettings.capital?.toString() || "0");
      if (monthSettings.interestRates) {
        setInterestRates({
          1: monthSettings.interestRates['1']?.toString() || "0",
          2: monthSettings.interestRates['2']?.toString() || "0",
          3: monthSettings.interestRates['3']?.toString() || "0",
          4: monthSettings.interestRates['4']?.toString() || "0",
        });
      }
    } else {
      setMonthlyCapital("0");
      setInterestRates({ 1: "0", 2: "0", 3: "0", 4: "0" });
    }

    if (currentUser && currentUser.notificationPreferences) {
      setNotificationPreferences(currentUser.notificationPreferences);
    }
  }, [settings, selectedYear, selectedMonth, currentUser]);

  const handleTabChange = (_, newValue) => {
    setTabIndex(newValue);
  };

  const handleMonthlyCapitalChange = (e) => {
    setMonthlyCapital(e.target.value);
  };

  const handleInterestRateChange = (field) => (e) => {
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
    } catch (error) {
      console.error("Error updating notification preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      await requestNotificationPermission();
      showSnackbar("Successfully subscribed to notifications!", "success");
    } catch (error) {
      showSnackbar("Failed to subscribe to notifications.", "error");
    }
  };

  const handleFinancialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const capitalValue = parseFloat(monthlyCapital);
    if (isNaN(capitalValue) || capitalValue < 0) {
      showSnackbar("Please enter a valid non-negative number for Invested Capital.", "error");
      setLoading(false);
      return;
    }

    const numericInterestRates = {};
    for (const key of Object.keys(interestRates)) {
      const val = parseFloat(interestRates[key]);
      if (isNaN(val) || val < 0) {
        showSnackbar("Please enter valid non-negative numbers for all interest rates.", "error");
        setLoading(false);
        return;
      }
      numericInterestRates[key] = val;
    }

    if (capitalValue > 1_000_000_000) {
      showSnackbar("Invested Capital seems excessively high. Please review.", "warning");
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
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFinancial = () => {
    const year = selectedYear.toString();
    const month = selectedMonth.toString().padStart(2, '0');
    const monthKey = `${year}-${month}`;

    if (settings && settings.monthlySettings && settings.monthlySettings[monthKey]) {
        const monthSettings = settings.monthlySettings[monthKey];
        setMonthlyCapital(monthSettings.capital?.toString() || "0");
        if (monthSettings.interestRates) {
            setInterestRates({
                1: monthSettings.interestRates['1']?.toString() || "0",
                2: monthSettings.interestRates['2']?.toString() || "0",
                3: monthSettings.interestRates['3']?.toString() || "0",
                4: monthSettings.interestRates['4']?.toString() || "0",
            });
        } else {
            setInterestRates({ 1: "0", 2: "0", 3: "0", 4: "0" });
        }
    } else {
        setMonthlyCapital("0");
        setInterestRates({ 1: "0", 2: "0", 3: "0", 4: "0" });
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Settings
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="settings tabs"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Financial" {...a11yProps(0)} />
        <Tab label="Account" {...a11yProps(1)} />
        <Tab label="Security" {...a11yProps(2)} />
        <Tab label="Notifications" {...a11yProps(3)} />
        <Tab label="Help" {...a11yProps(4)} />
      </Tabs>

      {/* Financial Settings */}
      <TabPanel value={tabIndex} index={0}>
        <form onSubmit={handleFinancialSubmit}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth size="small">
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
                <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth size="small">
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
                size="small"
            />
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Interest Rates (%)</Typography>
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((weeks) => (
                <Grid size={{ xs: 6 }} key={weeks}>
                  <TextField
                    label={`${weeks} Week${weeks > 1 ? 's' : ''}`}
                    type="number"
                    value={interestRates[weeks]}
                    onChange={handleInterestRateChange(weeks)}
                    required
                    fullWidth
                    inputProps={{ min: 0, step: "any" }}
                    size="small"
                  />
                </Grid>
              ))}
            </Grid>
            
            <Box display="flex" gap={2} mt={2}>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Financial Settings"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleResetFinancial}
                disabled={loading}
              >
                Reset
              </Button>
            </Box>
          </Stack>
        </form>
      </TabPanel>
      
      {/* Account Settings (Profile) */}
      <TabPanel value={tabIndex} index={1}>
        {/* Pass an empty onClose since we don't want the profile component to close the whole settings dialog on save */}
        <Profile onClose={() => {}} /> 
      </TabPanel>

      {/* Security Settings (Change Password) */}
      <TabPanel value={tabIndex} index={2}>
         <ChangePassword onClose={() => {}} />
      </TabPanel>

      {/* Notification Settings */}
      <TabPanel value={tabIndex} index={3}>
        <Typography variant="body1" gutterBottom>
          Enable push notifications to stay updated on loan statuses and payments.
        </Typography>
        <Button
          variant="contained"
          onClick={handleSubscribe}
          sx={{ mt: 2, mb: 4 }}
        >
          Enable Notifications
        </Button>
        
        <Typography variant="h6" gutterBottom>Preferences</Typography>
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
      </TabPanel>

      {/* Help */}
      <TabPanel value={tabIndex} index={4}>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            Help & Support
          </Typography>
          <Typography variant="body1" paragraph>
            If you encounter any issues or have questions, please contact the developer.
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">Mwangala Ilukena</Typography>
            <Typography variant="body2">Phone: 0974103004</Typography>
            <Typography variant="body2">Email: ilukenamwangala@gmail.com</Typography>
          </Box>
        </Box>
      </TabPanel>

      <Box mt={3} textAlign="right">
        <Button onClick={onClose} color="inherit">Close</Button>
      </Box>
    </Box>
  );
}
