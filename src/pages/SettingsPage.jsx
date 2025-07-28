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
  // Removed AppBar, Toolbar, IconButton, useTheme, useMediaQuery as they are no longer needed for a non-fullscreen dialog
} from "@mui/material";
// Removed CloseIcon import as it's not used internally anymore
import { useFirestore } from "../contexts/FirestoreProvider";

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
  const { settings, updateSettings } = useFirestore();

  const [tabIndex, setTabIndex] = useState(0);
  const [interestRates, setInterestRates] = useState({
    oneWeek: "0",
    twoWeeks: "0",
    threeWeeks: "0",
    fourWeeks: "0",
  });
  const [initialCapital, setInitialCapital] = useState("0");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Effect to load settings when the component mounts or settings data changes
  useEffect(() => {
    if (settings) {
      if (settings.interestRates) {
        setInterestRates({
          oneWeek: settings.interestRates.oneWeek?.toString() || "0",
          twoWeeks: settings.interestRates.twoWeeks?.toString() || "0",
          threeWeeks: settings.interestRates.threeWeeks?.toString() || "0",
          fourWeeks: settings.interestRates.fourWeeks?.toString() || "0",
        });
      } else {
        // Ensure defaults if interestRates is not set
        setInterestRates({
          oneWeek: "0",
          twoWeeks: "0",
          threeWeeks: "0",
          fourWeeks: "0",
        });
      }
      if (settings.initialCapital !== undefined) {
        setInitialCapital(settings.initialCapital.toString());
      } else {
        setInitialCapital("0"); // Default if not set
      }
    }
  }, [settings]);

  const handleTabChange = (_, newValue) => {
    setTabIndex(newValue);
    setMessage(""); // Clear message when changing tabs
  };

  const handleChange = (field) => (e) => {
    setMessage(""); // Clear message on input change
    setInterestRates({ ...interestRates, [field]: e.target.value });
  };

  const handleInitialCapitalChange = (e) => {
    setMessage(""); // Clear message on input change
    setInitialCapital(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(""); // Clear previous messages before new submission

    // Validate interest rates
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

    // Validate initial capital
    const capitalValue = parseFloat(initialCapital);
    if (isNaN(capitalValue) || capitalValue < 0) {
      setMessage("Please enter a valid non-negative number for Initial Capital.");
      setLoading(false);
      return;
    }

    // Example upper limit for capital value; adjust based on your business logic
    if (capitalValue > 1_000_000_000) {
      setMessage("Initial Capital seems excessively high. Please review.");
      setLoading(false);
      return;
    }

    const updatedSettings = {
      interestRates: numericInterestRates,
      initialCapital: capitalValue,
    };

    try {
      await updateSettings(updatedSettings);
      setMessage("Settings saved successfully.");
      // If you want the dialog to close automatically on successful save, uncomment the line below:
      // if (onClose) onClose();
    } catch (error) {
      console.error("Error updating settings:", error);
      setMessage("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessage(""); // Clear message on reset
    if (settings) {
      setInterestRates({
        oneWeek: settings.interestRates?.oneWeek?.toString() || "0",
        twoWeeks: settings.interestRates?.twoWeeks?.toString() || "0",
        threeWeeks: settings.interestRates?.threeWeeks?.toString() || "0",
        fourWeeks: settings.interestRates?.fourWeeks?.toString() || "0",
      });
      setInitialCapital(settings.initialCapital?.toString() || "0");
    } else {
      // Reset to default empty/zero if no settings loaded
      setInterestRates({
        oneWeek: "0",
        twoWeeks: "0",
        threeWeeks: "0",
        fourWeeks: "0",
      });
      setInitialCapital("0");
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 3, sm: 4 }, // Add padding directly to the main content box for dialogs
      }}
    >
      {/* Settings Page Title */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Settings
      </Typography>

      {/* Alert for messages (success/error) */}
      {message && (
        <Alert
          severity={message.includes("successfully") ? "success" : "error"}
          onClose={() => setMessage("")}
          sx={{ mb: 3 }}
        >
          {message}
        </Alert>
      )}

      {/* Tabs for navigating between sections */}
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="settings tabs"
        sx={{ mb: 3 }}
      >
        <Tab label="Capital" {...a11yProps(0)} />
        <Tab label="Interest Rates" {...a11yProps(1)} />
      </Tabs>

      <form onSubmit={handleSubmit}>
        {/* Capital Tab Panel */}
        <TabPanel value={tabIndex} index={0}>
          <TextField
            label="Initial Capital (ZMW)"
            type="number"
            value={initialCapital}
            onChange={handleInitialCapitalChange}
            required
            fullWidth
            inputProps={{ min: 0, step: "any" }}
            margin="normal"
          />
        </TabPanel>

        {/* Interest Rates Tab Panel */}
        <TabPanel value={tabIndex} index={1}>
          <Stack spacing={3}>
            <TextField
              label="Interest Rate for 1 Week (%)"
              type="number"
              value={interestRates.oneWeek}
              onChange={handleChange("oneWeek")}
              required
              inputProps={{ min: 0, step: "any" }}
              margin="normal"
            />
            <TextField
              label="Interest Rate for 2 Weeks (%)"
              type="number"
              value={interestRates.twoWeeks}
              onChange={handleChange("twoWeeks")}
              required
              inputProps={{ min: 0, step: "any" }}
              margin="normal"
            />
            <TextField
              label="Interest Rate for 3 Weeks (%)"
              type="number"
              value={interestRates.threeWeeks}
              onChange={handleChange("threeWeeks")}
              required
              inputProps={{ min: 0, step: "any" }}
              margin="normal"
            />
            <TextField
              label="Interest Rate for 4 Weeks (%)"
              type="number"
              value={interestRates.fourWeeks}
              onChange={handleChange("fourWeeks")}
              required
              inputProps={{ min: 0, step: "any" }}
              margin="normal"
            />
          </Stack>
        </TabPanel>

        {/* Action Buttons */}
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
      </form>
    </Box>
  );
}
