// src/components/AddLoanDialog.js

import React, { useState, useMemo } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  Tabs,
  Tab,
  Fade,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled,
  alpha,
  Autocomplete,
  Grid,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/CloseRounded";
import PersonIcon from '@mui/icons-material/PersonRounded';
import SettingsIcon from '@mui/icons-material/SettingsRounded';
import CheckCircleIcon from '@mui/icons-material/TaskAltRounded';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useSnackbar } from "./SnackbarProvider";
import dayjs from "dayjs";
import useOfflineStatus from "../hooks/useOfflineStatus";
import { enqueueRequest } from "../utils/offlineQueue";

const interestOptions = [
  { label: "1 Week", value: 1 },
  { label: "2 Weeks", value: 2 },
  { label: "3 Weeks", value: 3 },
  { label: "4 Weeks", value: 4 },
];

const getTextFieldStyles = (theme) => ({
  "& .MuiOutlinedInput-root": {
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.secondary.main,
    },
    "& .MuiInputBase-input": { padding: "10px 12px", fontSize: "0.875rem" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: theme.palette.secondary.main },
  "& .MuiInputLabel-root": { fontSize: "0.875rem", transform: "translate(12px, 12px) scale(1)" },
  "& .MuiInputLabel-shrink": { transform: "translate(12px, -9px) scale(0.75)" },
  "& .MuiFormHelperText-root": { fontSize: "0.75rem" },
});

const steps = ['Select Borrower', 'Loan Details', 'Confirm'];

const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 40, height: 40,
  display: 'flex', borderRadius: '50%', justifyContent: 'center', alignItems: 'center',
  ...(ownerState.active && {
    backgroundImage: `linear-gradient(136deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundImage: `linear-gradient(136deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
  }),
}));

function ColorlibStepIcon(props) {
  const { active, completed, className, icon } = props;
  const icons = {
    1: <PersonIcon sx={{ fontSize: 20 }} />,
    2: <SettingsIcon sx={{ fontSize: 20 }} />,
    3: <CheckCircleIcon sx={{ fontSize: 20 }} />,
  };
  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)` },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)` },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3, border: 0, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0', borderRadius: 1,
  },
}));

export default function AddLoanDialog({ open, onClose, borrowerId }) {
  const theme = useTheme();
  const { borrowers, addLoan, addActivityLog, settings } = useFirestore();
  const showSnackbar = useSnackbar();
  const isOffline = useOfflineStatus();
  const textFieldStyles = getTextFieldStyles(theme);

  // --- Unified State ---
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0); // 0: Auto, 1: Manual
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Fields
  const [amount, setAmount] = useState("");
  const [interestDuration, setInterestDuration] = useState(1);
  const [startDate, setStartDate] = useState(dayjs());
  const [dueDate, setDueDate] = useState(dayjs().add(1, 'week'));
  const [manualInterestRate, setManualInterestRate] = useState("");

  // Validation States
  const [amountError, setAmountError] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [dueDateError, setDueDateError] = useState("");
  const [manualInterestRateError, setManualInterestRateError] = useState("");

  const currentMonthKey = useMemo(() => {
    return startDate ? startDate.format('YYYY-MM') : dayjs().format('YYYY-MM');
  }, [startDate]);

  const interestRates = useMemo(() => {
    if (settings?.monthlySettings?.[currentMonthKey]?.interestRates) {
      return settings.monthlySettings[currentMonthKey].interestRates;
    }
    return settings?.interestRates || { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 };
  }, [settings, currentMonthKey]);

  // Reset logic when dialog opens
  useMemo(() => {
    if (open) {
      setActiveStep(0);
      setSelectedTab(0);
      setAmount("");
      setInterestDuration(1);
      setStartDate(dayjs());
      setDueDate(dayjs().add(1, 'week'));
      setManualInterestRate("");
      setAmountError("");
      setStartDateError("");
      setDueDateError("");
      setManualInterestRateError("");
      setError("");
      
      if (borrowerId) {
        const b = borrowers.find(b => b.id === borrowerId);
        setSelectedBorrower(b || null);
        setActiveStep(1); // Skip selection if ID provided
      } else {
        setSelectedBorrower(null);
      }
    }
  }, [open, borrowerId, borrowers]);

  const calculateInterest = (principal, durationVal) => {
    if (selectedTab === 0) {
      return principal * (interestRates[durationVal] || 0);
    }
    return principal * (Number(durationVal) / 100);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!selectedBorrower) {
        showSnackbar("Please select a borrower first.", "error");
        return;
      }
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Validate Step 1
      const numAmount = Number(amount);
      let isValid = true;

      if (isNaN(numAmount) || numAmount <= 0) {
        setAmountError("Please enter a valid loan amount.");
        isValid = false;
      } else {
        setAmountError("");
      }

      if (selectedTab === 1) {
        if (!startDate || !startDate.isValid()) {
          setStartDateError("Invalid start date.");
          isValid = false;
        } else {
          setStartDateError("");
        }

        if (!dueDate || !dueDate.isValid()) {
          setDueDateError("Invalid due date.");
          isValid = false;
        } else if (startDate && dueDate && dueDate.isBefore(startDate, 'day')) {
          setDueDateError("Due date cannot be before the start date.");
          isValid = false;
        } else {
          setDueDateError("");
        }

        const numRate = Number(manualInterestRate);
        if (manualInterestRate === "" || isNaN(numRate) || numRate < 0) {
          setManualInterestRateError("Please enter a valid interest rate.");
          isValid = false;
        } else {
          setManualInterestRateError("");
        }
      }

      if (isValid) setActiveStep(2);
    }
  };

  const handleBack = () => {
    if (activeStep === 1 && borrowerId) {
        onClose(); // Can't go back to selection if it was fixed
        return;
    }
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const principal = Number(amount);
    const finalInterestDuration = selectedTab === 0 ? interestDuration : null;
    const finalManualRate = selectedTab === 1 ? Number(manualInterestRate) : null;
    const interest = calculateInterest(principal, selectedTab === 0 ? interestDuration : manualInterestRate);
    const totalRepayable = principal + interest;
    
    const finalStartDate = selectedTab === 0 ? dayjs().format("YYYY-MM-DD") : startDate.format("YYYY-MM-DD");
    const finalDueDate = selectedTab === 0 ? dayjs().add(interestDuration * 7, "day").format("YYYY-MM-DD") : dueDate.format("YYYY-MM-DD");

    const loanData = {
      borrowerId: selectedBorrower.id,
      principal, interest, totalRepayable,
      startDate: finalStartDate,
      dueDate: finalDueDate,
      status: "Active", repaidAmount: 0,
      interestDuration: finalInterestDuration,
      manualInterestRate: finalManualRate,
      borrower: selectedBorrower.name,
      phone: selectedBorrower.phone,
      outstandingBalance: totalRepayable
    };

    if (isOffline) {
      try {
        await enqueueRequest({ type: 'addLoan', data: loanData });
        await addActivityLog({
          action: "Loan Created",
          details: `Loan created for ${selectedBorrower?.name} (ZMW ${principal.toLocaleString()})`,
          timestamp: new Date().toISOString(),
        });
        showSnackbar("Offline: Loan queued successfully!", "info");
        onClose();
      } catch (err) {
        setError("Failed to queue loan offline.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      await addLoan(loanData);
      await addActivityLog({
        action: "Loan Created",
        details: `Loan added for ${selectedBorrower?.name} (ZMW ${principal.toLocaleString()})`,
        timestamp: new Date().toISOString(),
      });
      showSnackbar("Loan created successfully!", "success");
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create loan. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const displayPrincipal = Number(amount);
  const displayInterest = calculateInterest(displayPrincipal, selectedTab === 0 ? interestDuration : manualInterestRate);
  const displayTotalRepayable = displayPrincipal + displayInterest;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pt: 3, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">Create New Loan</Typography>
            <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
          <Stepper alternativeLabel activeStep={activeStep} connector={<CustomStepConnector />} sx={{ mb: 4, mt: 1 }}>
            {steps.map((label) => (
              <Step key={label}><StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* STEP 0: Select Borrower */}
          {activeStep === 0 && (
            <Box sx={{ py: 1 }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">Step 1: Choose a borrower</Typography>
              <Autocomplete
                options={borrowers}
                getOptionLabel={(option) => `${option.name} (${option.phone})`}
                value={selectedBorrower}
                onChange={(_, val) => setSelectedBorrower(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Search Borrower..." variant="outlined" fullWidth autoFocus />
                )}
                sx={{ mt: 2 }}
              />
            </Box>
          )}

          {/* STEP 1: Loan Details */}
          {activeStep === 1 && (
            <Box>
              <Box sx={{ mb: 2, p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <Typography variant="caption" color="text.secondary">Lending to:</Typography>
                <Typography variant="subtitle2" fontWeight="bold">{selectedBorrower?.name}</Typography>
              </Box>

              <Tabs
                value={selectedTab}
                onChange={(_, v) => setSelectedTab(v)}
                centered
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Auto Plan" />
                <Tab label="Manual Entry" />
              </Tabs>

              <Stack spacing={2.5}>
                <TextField
                  label="Principal Amount (ZMW)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  fullWidth required
                  error={!!amountError}
                  helperText={amountError}
                  sx={textFieldStyles}
                />

                {selectedTab === 0 ? (
                  <TextField
                    select
                    label="Interest Duration"
                    value={interestDuration}
                    onChange={(e) => setInterestDuration(Number(e.target.value))}
                    fullWidth required
                    sx={textFieldStyles}
                  >
                    {interestOptions.map(({ label, value }) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <>
                    <Stack direction="row" spacing={2}>
                      <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={(val) => setStartDate(val)}
                        slotProps={{ textField: { fullWidth: true, size: 'small', error: !!startDateError, helperText: startDateError, sx: textFieldStyles } }}
                      />
                      <DatePicker
                        label="Due Date"
                        value={dueDate}
                        onChange={(val) => setDueDate(val)}
                        minDate={startDate}
                        slotProps={{ textField: { fullWidth: true, size: 'small', error: !!dueDateError, helperText: dueDateError, sx: textFieldStyles } }}
                      />
                    </Stack>
                    <TextField
                      label="Manual Interest Rate (%)"
                      value={manualInterestRate}
                      onChange={(e) => setManualInterestRate(e.target.value)}
                      type="number"
                      fullWidth required
                      error={!!manualInterestRateError}
                      helperText={manualInterestRateError}
                      sx={textFieldStyles}
                    />
                  </>
                )}

                <Fade in={displayPrincipal > 0}>
                  <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05), borderLeft: `4px solid ${theme.palette.secondary.main}` }}>
                    <Typography variant="caption" color="text.secondary">Calculated Interest: ZMW {displayInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                    <Typography variant="h6" fontWeight="bold">Total Repayable: ZMW {displayTotalRepayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
                  </Paper>
                </Fade>
              </Stack>
            </Box>
          )}

          {/* STEP 2: Confirm */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">Step 3: Review and Confirm</Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Borrower</Typography><Typography variant="body2" fontWeight="bold">{selectedBorrower?.name}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Principal</Typography><Typography variant="body2" fontWeight="bold">ZMW {Number(amount).toLocaleString()}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Interest</Typography><Typography variant="body2" fontWeight="bold">ZMW {displayInterest.toLocaleString()}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Total Due</Typography><Typography variant="body2" fontWeight="bold" color="primary">ZMW {displayTotalRepayable.toLocaleString()}</Typography></Grid>
                  <Grid item xs={12}><Divider /></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Start Date</Typography><Typography variant="body2">{selectedTab === 0 ? dayjs().format("YYYY-MM-DD") : startDate.format("YYYY-MM-DD")}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Due Date</Typography><Typography variant="body2">{selectedTab === 0 ? dayjs().add(interestDuration * 7, "day").format("YYYY-MM-DD") : dueDate.format("YYYY-MM-DD")}</Typography></Grid>
                </Grid>
              </Paper>
              <Alert severity="info" sx={{ mt: 2 }}>Click 'Confirm & Disburse' to finalize this loan record.</Alert>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0 || loading} onClick={handleBack} color="inherit">Back</Button>
            <Box>
              {activeStep < 2 ? (
                <Button variant="contained" color="primary" onClick={handleNext}>Next</Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={handleSubmit} 
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} color="inherit" />}
                >
                  {loading ? "Processing..." : "Confirm & Disburse"}
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
}