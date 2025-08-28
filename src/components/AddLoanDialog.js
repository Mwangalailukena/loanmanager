// src/components/AddLoanDialog.js

import React, { useState } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PaidIcon from '@mui/icons-material/Paid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useFirestore } from "../contexts/FirestoreProvider";
import { useSnackbar } from "./SnackbarProvider";
import dayjs from "dayjs";

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

const steps = ['Loan Details', 'Review & Submit'];

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
    1: <PaidIcon sx={{ fontSize: 20 }} />,
    2: <CheckCircleIcon sx={{ fontSize: 20 }} />,
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

function AutoLoanForm({ borrowerId, onClose }) {
  const theme = useTheme();
  const { addLoan, addActivityLog, settings, borrowers } = useFirestore();
  const showSnackbar = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [interestDuration, setInterestDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amountError, setAmountError] = useState("");

  const selectedBorrower = borrowers.find(b => b.id === borrowerId);

  const interestRates = settings?.interestRates || { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 };
  const calculateInterest = (principal, weeks) => principal * (interestRates[weeks] || 0);
  const handleAmountBlur = () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError("Loan amount must be a valid positive number.");
    } else {
      setAmountError("");
    }
  };

  const validateStep = (step) => {
    let isValid = true;
    if (step === 0) {
      handleAmountBlur();
      if (amountError || !amount.trim()) isValid = false;
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) setActiveStep(prev => prev + 1);
    else showSnackbar("Please correct the errors before proceeding.", "error");
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleSubmit = async () => {
    setError("");
    if (!validateStep(0)) {
      showSnackbar("Please correct the errors before submitting.", "error");
      return;
    }
    setLoading(true);

    const principal = Number(amount);
    const interest = calculateInterest(principal, interestDuration);
    const totalRepayable = principal + interest;
    const startDate = dayjs().format("YYYY-MM-DD");
    const dueDate = dayjs().add(interestDuration * 7, "day").format("YYYY-MM-DD");

    try {
      await addLoan({
        borrowerId: borrowerId,
        principal, interest, totalRepayable, startDate, dueDate,
        status: "Active", repaidAmount: 0, interestDuration,
        borrower: selectedBorrower.name,
        phone: selectedBorrower.phone,
        outstandingBalance: totalRepayable
      });
      await addActivityLog({
        action: "Loan Created",
        details: `Auto loan created for ${selectedBorrower?.name || 'Unknown'} (ZMW ${principal.toLocaleString()})`,
        timestamp: new Date().toISOString(),
      });
      showSnackbar(`Loan added successfully!`, "success");
      onClose();
    } catch (err) {
      console.error("Loan creation failed:", err);
      setError("Failed to add loan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayPrincipal = Number(amount);
  const displayInterest = calculateInterest(displayPrincipal, interestDuration);
  const displayTotalRepayable = displayPrincipal + displayInterest;
  const textFieldStyles = getTextFieldStyles(theme);

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={1.5} sx={{ py: 1.5 }}>
            <TextField
              label="Loan Amount (ZMW)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={handleAmountBlur}
              type="number"
              inputProps={{ min: 1 }}
              fullWidth required
              error={!!amountError}
              helperText={amountError}
              sx={textFieldStyles}
            />
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
            <Fade in={displayPrincipal > 0}>
              <Box sx={{
                p: 1.5, bgcolor: theme.palette.mode === 'light' ? theme.palette.secondary.light : theme.palette.secondary.dark,
                borderRadius: 2, borderLeft: `5px solid ${theme.palette.secondary.main}`,
              }}>
                <Typography variant="caption" color="text.secondary">
                  Calculated Interest: ZMW {displayInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Total Repayable: ZMW {displayTotalRepayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Fade>
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={1.5} sx={{ py: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 1.5, width: '100%' }}>
              <Typography variant="subtitle2" gutterBottom>Review Details</Typography>
              <Typography variant="caption" display="block"><strong>Borrower:</strong> {selectedBorrower?.name}</Typography>
              <Typography variant="caption" display="block"><strong>Phone:</strong> {selectedBorrower?.phone}</Typography>
              <Typography variant="caption" display="block"><strong>Principal:</strong> ZMW {displayPrincipal.toLocaleString()}</Typography>
              <Typography variant="caption" display="block"><strong>Interest Duration:</strong> {interestDuration} week{interestDuration > 1 ? 's' : ''}</Typography>
              <Typography variant="caption" display="block"><strong>Calculated Interest:</strong> ZMW {displayInterest.toLocaleString()}</Typography>
              <Typography variant="body2" fontWeight="bold" display="block"><strong>Total Repayable:</strong> ZMW {displayTotalRepayable.toLocaleString()}</Typography>
            </Paper>
          </Stack>
        );
      default: return 'Unknown step';
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Auto Loan</Typography>
      <Stepper alternativeLabel activeStep={activeStep} connector={<CustomStepConnector />} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}><StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel></Step>
        ))}
      </Stepper>
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 1.5, fontSize: '0.875rem' }}>{error}</Alert>}
      {getStepContent(activeStep)}
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button color="inherit" disabled={activeStep === 0 || loading} onClick={handleBack} sx={{ mr: 1, px: 1, fontSize: '0.875rem' }}>Back</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep === steps.length - 1 ? (
          <Button onClick={handleSubmit} variant="contained" color="secondary" disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null} sx={{ fontSize: '0.875rem' }}>
            {loading ? "Adding Loan..." : "Add Loan"}
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained" color="secondary" disabled={loading} sx={{ fontSize: '0.875rem' }}>Next</Button>
        )}
      </Box>
    </Box>
  );
}

function ManualLoanForm({ borrowerId, onClose }) {
  const theme = useTheme();
  const { addLoan, addActivityLog, borrowers } = useFirestore();
  const showSnackbar = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(dayjs());
  const [dueDate, setDueDate] = useState(dayjs().add(1, 'week'));
  const [manualInterestRate, setManualInterestRate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [dueDateError, setDueDateError] = useState("");
  const [manualInterestRateError, setManualInterestRateError] = useState("");
  const selectedBorrower = borrowers.find(b => b.id === borrowerId);

  const calculateInterest = (principal, rate) => principal * (rate / 100);
  const handleAmountBlur = () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) setAmountError("Loan amount must be a valid positive number.");
    else setAmountError("");
  };
  const handleManualInterestRateBlur = () => {
    const numInterestRate = Number(manualInterestRate);
    if (isNaN(numInterestRate) || numInterestRate < 0 || numInterestRate > 100) setManualInterestRateError("Interest rate must be a number between 0 and 100.");
    else setManualInterestRateError("");
  };

  const validateStep = (step) => {
    let isValid = true;
    if (step === 0) {
      handleAmountBlur();
      handleManualInterestRateBlur();
      if (!startDate || !startDate.isValid()) { setStartDateError("Invalid start date."); isValid = false; }
      if (!dueDate || !dueDate.isValid()) { setDueDateError("Invalid due date."); isValid = false; }
      else if (startDate && dueDate && dueDate.isBefore(startDate, 'day')) { setDueDateError("Due date cannot be before the start date."); isValid = false; }
      if (amountError || manualInterestRateError || !amount.trim() || !manualInterestRate.trim()) isValid = false;
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) setActiveStep(prev => prev + 1);
    else showSnackbar("Please correct the errors before proceeding.", "error");
  };
  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleSubmit = async () => {
    setError("");
    if (!validateStep(0)) {
      showSnackbar("Please correct the errors before submitting.", "error");
      return;
    }
    setLoading(true);

    const principal = Number(amount);
    const interestRateDecimal = Number(manualInterestRate);
    const interest = calculateInterest(principal, interestRateDecimal);
    const totalRepayable = principal + interest;
    const formattedStartDate = startDate.format("YYYY-MM-DD");
    const formattedDueDate = dueDate.format("YYYY-MM-DD");

    try {
      await addLoan({
        borrowerId: borrowerId, principal, interest, totalRepayable,
        startDate: formattedStartDate, dueDate: formattedDueDate,
        status: "Active", repaidAmount: 0, manualInterestRate: interestRateDecimal,
        borrower: selectedBorrower.name,
        phone: selectedBorrower.phone,
        outstandingBalance: totalRepayable
      });
      await addActivityLog({
        action: "Loan Created (Manual)",
        details: `Manual loan created for ${selectedBorrower?.name || 'Unknown'} (ZMW ${principal.toLocaleString()})`,
        timestamp: new Date().toISOString(),
      });
      showSnackbar(`Manual loan added successfully!`, "success");
      onClose();
    } catch (err) {
      console.error("Manual loan creation failed:", err);
      setError("Failed to add manual loan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayPrincipal = Number(amount);
  const displayInterest = calculateInterest(displayPrincipal, Number(manualInterestRate));
  const displayTotalRepayable = displayPrincipal + displayInterest;
  const textFieldStyles = getTextFieldStyles(theme);

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={1.5} sx={{ py: 1.5 }}>
            <TextField
              label="Loan Amount (ZMW)" value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={handleAmountBlur}
              type="number" inputProps={{ min: 1 }} fullWidth required error={!!amountError} helperText={amountError} sx={textFieldStyles}
            />
            <DatePicker
              label="Start Date" value={startDate} onChange={(newValue) => setStartDate(newValue)}
              slots={{ textField: TextField }} slotProps={{ textField: { fullWidth: true, required: true, error: !!startDateError, helperText: startDateError, sx: textFieldStyles } }}
            />
            <DatePicker
              label="Due Date" value={dueDate} onChange={(newValue) => setDueDate(newValue)}
              slots={{ textField: TextField }} slotProps={{ textField: { fullWidth: true, required: true, error: !!dueDateError, helperText: dueDateError, sx: textFieldStyles } }}
              minDate={startDate || dayjs()}
              disablePast
            />
            <TextField
              label="Interest Rate (%)" value={manualInterestRate} onChange={(e) => setManualInterestRate(e.target.value)} onBlur={handleManualInterestRateBlur}
              type="number" inputProps={{ min: 0, max: 100, step: "0.01" }} fullWidth required error={!!manualInterestRateError} helperText={manualInterestRateError} sx={textFieldStyles}
            />
            <Fade in={displayPrincipal > 0 && manualInterestRate !== ""}>
              <Box sx={{
                p: 1.5, bgcolor: theme.palette.mode === 'light' ? theme.palette.secondary.light : theme.palette.secondary.dark,
                borderRadius: 2, borderLeft: `5px solid ${theme.palette.secondary.main}`,
              }}>
                <Typography variant="caption" color="text.secondary">
                  Calculated Interest: ZMW {displayInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Total Repayable: ZMW {displayTotalRepayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Fade>
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={1.5} sx={{ py: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 1.5, width: '100%' }}>
              <Typography variant="subtitle2" gutterBottom>Review Details</Typography>
              <Typography variant="caption" display="block"><strong>Borrower:</strong> {selectedBorrower?.name}</Typography>
              <Typography variant="caption" display="block"><strong>Phone:</strong> {selectedBorrower?.phone}</Typography>
              <Typography variant="caption" display="block"><strong>Principal:</strong> ZMW {displayPrincipal.toLocaleString()}</Typography>
              <Typography variant="caption" display="block"><strong>Start Date:</strong> {startDate.format("YYYY-MM-DD")}</Typography>
              <Typography variant="caption" display="block"><strong>Due Date:</strong> {dueDate.format("YYYY-MM-DD")}</Typography>
              <Typography variant="caption" display="block"><strong>Interest Rate:</strong> {manualInterestRate}%</Typography>
              <Typography variant="caption" display="block"><strong>Calculated Interest:</strong> ZMW {displayInterest.toLocaleString()}</Typography>
              <Typography variant="body2" fontWeight="bold" display="block"><strong>Total Repayable:</strong> ZMW {displayTotalRepayable.toLocaleString()}</Typography>
            </Paper>
          </Stack>
        );
      default: return 'Unknown step';
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Manual Loan</Typography>
      <Stepper alternativeLabel activeStep={activeStep} connector={<CustomStepConnector />} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}><StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel></Step>
        ))}
      </Stepper>
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 1.5, fontSize: '0.875rem' }}>{error}</Alert>}
      {getStepContent(activeStep)}
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button color="inherit" disabled={activeStep === 0 || loading} onClick={handleBack} sx={{ mr: 1, px: 1, fontSize: '0.875rem' }}>Back</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep === steps.length - 1 ? (
          <Button onClick={handleSubmit} variant="contained" color="secondary" disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null} sx={{ fontSize: '0.875rem' }}>
            {loading ? "Adding Loan..." : "Add Loan"}
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained" color="secondary" disabled={loading} sx={{ fontSize: '0.875rem' }}>Next</Button>
        )}
      </Box>
    </Box>
  );
}

export default function AddLoanDialog({ open, onClose, borrowerId }) {
  const [selectedTab, setSelectedTab] = useState(0);
  const handleChangeTab = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight="bold" sx={{ pb: 1, pt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">Add Loan</Typography>
            <IconButton onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Box sx={{ width: "100%", borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={selectedTab}
              onChange={handleChangeTab}
              aria-label="loan type tabs"
              centered
              sx={{
                "& .MuiTabs-indicator": { backgroundColor: (theme) => theme.palette.secondary.main },
                "& .MuiTab-root": {
                  color: (theme) => theme.palette.text.secondary,
                  "&.Mui-selected": { color: (theme) => theme.palette.secondary.main },
                },
              }}
            >
              <Tab label="Auto Loan" />
              <Tab label="Manual Loan" />
            </Tabs>
          </Box>
          <Box sx={{ pt: 2 }}>
            {selectedTab === 0 && <AutoLoanForm borrowerId={borrowerId} onClose={onClose} />}
            {selectedTab === 1 && <ManualLoanForm borrowerId={borrowerId} onClose={onClose} />}
          </Box>
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
}
