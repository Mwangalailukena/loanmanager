// src/pages/SettingsPage.jsx
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
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ mt: 2 }}>{children}</Box> : null;
}

export default function SettingsPage() {
  const { settings, updateSettings } = useFirestore();

  const [tabIndex, setTabIndex] = useState(0);
  const [interestRates, setInterestRates] = useState({
    oneWeek: "",
    twoWeeks: "",
    threeWeeks: "",
    fourWeeks: "",
  });
  const [initialCapital, setInitialCapital] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (settings) {
      if (settings.interestRates) {
        setInterestRates(settings.interestRates);
      }
      if (settings.initialCapital !== undefined) {
        setInitialCapital(settings.initialCapital.toString());
      }
    }
  }, [settings]);

  const handleTabChange = (_, newValue) => {
    setTabIndex(newValue);
  };

  const handleChange = (field) => (e) => {
    setInterestRates({ ...interestRates, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate interest rates
    for (const key in interestRates) {
      const val = parseFloat(interestRates[key]);
      if (isNaN(val) || val < 0) {
        setMessage(
          "Please enter valid non-negative numbers for all interest rates."
        );
        return;
      }
    }

    // Validate initial capital
    const capitalValue = parseFloat(initialCapital);
    if (isNaN(capitalValue) || capitalValue < 0) {
      setMessage("Please enter a valid non-negative number for Initial Capital.");
      return;
    }

    // Prepare updated settings
    const updatedSettings = {
      interestRates,
      initialCapital: capitalValue,
    };

    try {
      await updateSettings(updatedSettings);
      setMessage("Settings saved successfully.");
    } catch (error) {
      setMessage("Failed to save settings. Please try again.");
      console.error(error);
    }
  };

  return (
    <Box maxWidth={500} mx="auto" p={3}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {message && (
        <Alert
          severity={message.includes("successfully") ? "success" : "error"}
          onClose={() => setMessage("")}
          sx={{ mb: 2 }}
        >
          {message}
        </Alert>
      )}

      <Tabs value={tabIndex} onChange={handleTabChange} centered>
        <Tab label="Capital" />
        <Tab label="Interest Rates" />
      </Tabs>

      <form onSubmit={handleSubmit}>
        <TabPanel value={tabIndex} index={0}>
          <TextField
            label="Initial Capital (ZMW)"
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(e.target.value)}
            required
            fullWidth
            inputProps={{ min: 0 }}
          />
        </TabPanel>

        <TabPanel value={tabIndex} index={1}>
          <Stack spacing={3}>
            <TextField
              label="Interest Rate for 1 Week (%)"
              type="number"
              value={interestRates.oneWeek}
              onChange={handleChange("oneWeek")}
              required
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Interest Rate for 2 Weeks (%)"
              type="number"
              value={interestRates.twoWeeks}
              onChange={handleChange("twoWeeks")}
              required
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Interest Rate for 3 Weeks (%)"
              type="number"
              value={interestRates.threeWeeks}
              onChange={handleChange("threeWeeks")}
              required
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Interest Rate for 4 Weeks (%)"
              type="number"
              value={interestRates.fourWeeks}
              onChange={handleChange("fourWeeks")}
              required
              inputProps={{ min: 0 }}
            />
          </Stack>
        </TabPanel>

        <Box mt={3}>
          <Button variant="contained" type="submit" fullWidth>
            Save Settings
          </Button>
        </Box>
      </form>
    </Box>
  );
}

