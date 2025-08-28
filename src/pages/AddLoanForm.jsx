import React, { useState, useRef, useEffect } from "react";
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
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Fade,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled,
  Divider,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';

// Custom icons for the stepper
import AssignmentIcon from '@mui/icons-material/Assignment';
import PaidIcon from '@mui/icons-material/Paid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Date picker imports
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// Other imports
import { useFirestore } from "../contexts/FirestoreProvider";
import { useSnackbar } from "../components/SnackbarProvider";
import { useNavigate, useLocation } from "react-router-dom";

import dayjs from "dayjs";
import Papa from "papaparse";

// Options for auto interest duration
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
    // Smaller padding for a more compact feel
    "& .MuiInputBase-input": {
      padding: "10px 12px",
      fontSize: "0.875rem",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.secondary.main,
  },
  // Smaller label text
  "& .MuiInputLabel-root": {
    fontSize: "0.875rem",
    transform: "translate(12px, 12px) scale(1)",
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(12px, -9px) scale(0.75)",
  },
  "& .MuiFormHelperText-root": {
    fontSize: "0.75rem",
  },
});

const steps = ['Borrower Details', 'Loan Details', 'Review & Submit'];

// Custom stepper icon styles
const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 40, // Smaller icon size
  height: 40, // Smaller icon size
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
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
    1: <AssignmentIcon sx={{ fontSize: 20 }} />, // Smaller icon inside
    2: <PaidIcon sx={{ fontSize: 20 }} />,
    3: <CheckCircleIcon sx={{ fontSize: 20 }} />,
  };
  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

// Custom step connector styles
const CustomStepConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}));

/**
 * AutoLoanForm Component
 * Refactored to a multi-step stepper form with refined styling.
 */
function AutoLoanForm() {
  const theme = useTheme();
  const { addLoan, addActivityLog, settings, borrowers } = useFirestore(); // Get borrowers
  const showSnackbar = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeStep, setActiveStep] = useState(0);

  const [selectedBorrowerId, setSelectedBorrowerId] = useState(""); // New state
  const [amount, setAmount] = useState("");
  const [interestDuration, setInterestDuration] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);

  const [borrowerError, setBorrowerError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [csvErrors, setCsvErrors] = useState([]);
  const [processedCount, setProcessedCount] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (location.state?.borrower) {
      setSelectedBorrowerId(location.state.borrower.id);
    }
  }, [location.state]);

  const interestRates = settings?.interestRates || {
    1: 0.15,
    2: 0.2,
    3: 0.3,
    4: 0.3,
  };

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
      if (!selectedBorrowerId) {
        setBorrowerError("Please select a borrower.");
        isValid = false;
      } else {
        setBorrowerError("");
      }
    } else if (step === 1) {
      handleAmountBlur();
      if (amountError || !amount.trim()) {
        isValid = false;
      }
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      showSnackbar("Please correct the errors before proceeding.", "error");
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const selectedBorrower = borrowers.find(b => b.id === selectedBorrowerId);

  const handleSubmit = async () => {
    setError("");

    if (!validateStep(0) || !validateStep(1)) {
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
      const loanDocRef = await addLoan({
        borrowerId: selectedBorrowerId,
        principal,
        interest,
        totalRepayable,
        startDate,
        dueDate,
        status: "Active",
        repaidAmount: 0,
        interestDuration,
      });

      await addActivityLog({
        action: "Loan Created",
        details: `Loan created for ${selectedBorrower?.name || 'Unknown'} (ZMW ${principal.toLocaleString()}) [Loan ID: ${loanDocRef.id}]`,
        timestamp: new Date().toISOString(),
      });

      showSnackbar(`Loan added successfully! Loan ID: ${loanDocRef.id}`, "success");

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      if (location.state?.borrower) {
        navigate(-1); // Go back to the previous page
      } else {
        // Reset form if not coming from a specific borrower profile
        setSelectedBorrowerId("");
        setAmount("");
        setInterestDuration(1);
        setActiveStep(0);
        setBorrowerError("");
        setAmountError("");
      }

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

  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setImportLoading(true);
    setCsvErrors([]);
    setProcessedCount(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: async (results) => {
        const importedLoans = results.data;
        const errors = [];
        let successCount = 0;

        for (let i = 0; i < importedLoans.length; i++) {
          const row = importedLoans[i];
          const lineNumber = i + 2;

          setProcessedCount(i + 1);

          const borrowerName = String(row["Borrower Name"] || "").trim();
          const phoneNumber = String(row["Phone Number"] || "").trim();
          const loanAmount = Number(row["Loan Amount (ZMW)"]);
          const interestDur = Number(row["Interest Duration (Weeks)"]);

          if (!borrowerName || !/^[a-zA-Z\s]{2,50}$/.test(borrowerName)) {
            errors.push(`Row ${lineNumber}: Invalid 'Borrower Name'. Must be 2-50 letters and spaces.`);
            continue;
          }
          if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
            errors.push(
              `Row ${lineNumber}: Invalid 'Phone Number'. It must be 10 digits.`
            );
            continue;
          }
          if (isNaN(loanAmount) || loanAmount <= 0) {
            errors.push(
              `Row ${lineNumber}: Invalid 'Loan Amount (ZMW)'. Must be a positive number.`
            );
            continue;
          }
          if (
            isNaN(interestDur) ||
            !interestOptions.some((opt) => opt.value === interestDur)
          ) {
            errors.push(
              `Row ${lineNumber}: Invalid 'Interest Duration (Weeks)'. Must be 1, 2, 3, or 4.`
            );
            continue;
          }

          const interest = calculateInterest(loanAmount, interestDur);
          const totalRepayable = loanAmount + interest;
          const startDate = dayjs().format("YYYY-MM-DD");
          const dueDate = dayjs().add(interestDur * 7, "day").format("YYYY-MM-DD");

          try {
            await addLoan({
              borrower: borrowerName,
              phone: phoneNumber,
              principal: loanAmount,
              interest,
              totalRepayable,
              startDate,
              dueDate,
              status: "Active",
              repaidAmount: 0,
              interestDuration: interestDur,
            });
            successCount++;
          } catch (addError) {
            console.error(`Error adding loan from row ${lineNumber}:`, addError);
            errors.push(
              `Row ${lineNumber}: Failed to add loan to database. (${
                addError.message || "Unknown error"
              })`
            );
          }
        }

        setImportLoading(false);
        setProcessedCount(0);

        if (successCount > 0) {
          showSnackbar(`Successfully imported ${successCount} loan(s)!`, "success");
        }
        if (errors.length > 0) {
          setCsvErrors(errors);
          setError(`CSV Import finished with ${errors.length} error(s). Please review the details below.`);
          errors.forEach((err) =>
            showSnackbar(`Import Error: ${err}`, "error", null, { autoClose: false })
          );
        } else {
          setOpenImportDialog(false);
        }
      },
      error: (err) => {
        setImportLoading(false);
        setOpenImportDialog(false);
        setProcessedCount(0);
        setError("Failed to parse CSV file: " + err.message);
        showSnackbar("CSV parsing error: " + err.message, "error");
        console.error("PapaParse error:", err);
      },
    });
  };

  const textFieldStyles = getTextFieldStyles(theme);

  const handleDownloadSample = () => {
    const headers = '"Borrower Name","Phone Number","Loan Amount (ZMW)","Interest Duration (Weeks)"';
    const sampleData = `\n"John Doe","1234567890","1000","1"\n"Jane Smith","0987654321","500","2"`;
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + sampleData);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "loan_import_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseImportDialog = () => {
    setOpenImportDialog(false);
    setCsvErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={1.5} sx={{ py: 1.5 }}>
            <TextField
              select
              label="Select Borrower"
              value={selectedBorrowerId}
              onChange={(e) => setSelectedBorrowerId(e.target.value)}
              fullWidth
              required
              error={!!borrowerError}
              helperText={borrowerError || "Select a borrower or create a new one."}
              sx={textFieldStyles}
            >
              <MenuItem value="" disabled>
                <em>Select a borrower...</em>
              </MenuItem>
              {borrowers.map((borrower) => (
                <MenuItem key={borrower.id} value={borrower.id}>
                  {borrower.name} - {borrower.phone}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={() => navigate('/add-borrower')}>
                <ListItemIcon>
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Create New Borrower</ListItemText>
              </MenuItem>
            </TextField>
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={1.5} sx={{ py: 1.5 }}>
            <TextField
              label="Loan Amount (ZMW)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={handleAmountBlur}
              type="number"
              inputProps={{ min: 1 }}
              fullWidth
              required
              error={!!amountError}
              helperText={amountError}
              sx={textFieldStyles}
            />
            <TextField
              select
              label="Interest Duration"
              value={interestDuration}
              onChange={(e) => setInterestDuration(Number(e.target.value))}
              fullWidth
              required
              sx={textFieldStyles}
            >
              {interestOptions.map(({ label, value }) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <Fade in={displayPrincipal > 0}>
              <Box sx={{
                p: 1.5, // Reduced padding
                bgcolor: theme.palette.mode === 'light' ? theme.palette.secondary.light : theme.palette.secondary.dark,
                borderRadius: 2,
                borderLeft: `5px solid ${theme.palette.secondary.main}`,
              }}>
                <Typography variant="caption" color="text.secondary">
                  Calculated Interest: ZMW{" "}
                  {displayInterest.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
                <Typography variant="body1" fontWeight="bold"> {/* Smaller variant */}
                  Total Repayable: ZMW{" "}
                  {displayTotalRepayable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </Fade>
          </Stack>
        );
      case 2:
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
      default:
        return 'Unknown step';
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        maxWidth: 500,
        mx: "auto",
        mt: 2, // Reduced margin top
        p: 2, // Reduced padding
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">Add New Loan (Auto)</Typography>
        <Tooltip title="Import multiple loans from CSV">
          <IconButton color="secondary" onClick={() => setOpenImportDialog(true)} disabled={loading || importLoading} aria-label="import loans" size="small">
            <UploadFileIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Stepper alternativeLabel activeStep={activeStep} connector={<CustomStepConnector />} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={ColorlibStepIcon} sx={{ fontSize: '0.875rem' }}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 1.5, fontSize: '0.875rem' }}>
          {error}
        </Alert>
      )}

      {getStepContent(activeStep)}
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0 || loading || importLoading}
          onClick={handleBack}
          sx={{ mr: 1, px: 1, fontSize: '0.875rem' }}
        >
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="secondary"
            disabled={loading || importLoading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ fontSize: '0.875rem' }}
          >
            {loading ? "Adding Loan..." : "Add Loan"}
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained" color="secondary" disabled={loading || importLoading} sx={{ fontSize: '0.875rem' }}>
            Next
          </Button>
        )}
      </Box>

      {/* Dialog for CSV Import (remains largely unchanged) */}
      <Dialog open={openImportDialog} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1.5, px: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Import Loans from CSV</Typography>
            <IconButton onClick={handleCloseImportDialog} aria-label="close" size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Upload a CSV file with loan data. Ensure the first row contains these exact headers.
          </Typography>
          <Paper variant="outlined" sx={{ p: 1, mb: 1.5, bgcolor: "grey.100" }}>
            <Typography variant="body2" component="pre" sx={{ overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: '0.8rem' }}>
              "Borrower Name","Phone Number","Loan Amount (ZMW)","Interest Duration (Weeks)"
            </Typography>
          </Paper>
          <Button onClick={handleDownloadSample} color="primary" variant="outlined" size="small" startIcon={<FileDownloadIcon />} sx={{ mb: 1.5, fontSize: '0.75rem' }}>
            Download Sample CSV
          </Button>
          {csvErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.875rem' }}>
              <Typography variant="subtitle2" fontWeight="bold">Errors found in CSV file:</Typography>
              <List dense sx={{ mt: 0.5 }}>
                {csvErrors.map((err, index) => (
                  <ListItem key={index} disableGutters sx={{ py: 0, '& .MuiListItemIcon-root': { minWidth: '24px' }}}>
                    <ListItemIcon><WarningIcon color="error" sx={{ fontSize: '1rem' }} /></ListItemIcon>
                    <ListItemText primary={err} primaryTypographyProps={{ variant: 'caption' }} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
          <input accept=".csv" style={{ display: "none" }} id="csv-upload-button-dialog" type="file" onChange={handleCSVImport} ref={fileInputRef} />
          <label htmlFor="csv-upload-button-dialog">
            <Button variant="contained" component="span" color="secondary" startIcon={importLoading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />} disabled={importLoading} fullWidth>
              {importLoading ? `Importing... (${processedCount} processed)` : "Select CSV File"}
            </Button>
          </label>
        </DialogContent>
        <DialogActions sx={{ p: 1 }}>
          <Button onClick={handleCloseImportDialog} disabled={importLoading} sx={{ fontSize: '0.875rem' }}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

/**
 * ManualLoanForm Component
 * Refactored to a multi-step stepper form with refined styling.
 */
function ManualLoanForm() {
  const theme = useTheme();
  const { addLoan, addActivityLog, borrowers } = useFirestore();
  const showSnackbar = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeStep, setActiveStep] = useState(0);

  const [selectedBorrowerId, setSelectedBorrowerId] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(dayjs());
  const [dueDate, setDueDate] = useState(dayjs().add(1, 'week'));
  const [manualInterestRate, setManualInterestRate] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [borrowerError, setBorrowerError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [dueDateError, setDueDateError] = useState("");
  const [manualInterestRateError, setManualInterestRateError] = useState("");

  useEffect(() => {
    if (location.state?.borrower) {
      setSelectedBorrowerId(location.state.borrower.id);
    }
  }, [location.state]);

  const calculateInterest = (principal, rate) => principal * (rate / 100);
  const handleAmountBlur = () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError("Loan amount must be a valid positive number.");
    } else {
      setAmountError("");
    }
  };
  const handleManualInterestRateBlur = () => {
    const numInterestRate = Number(manualInterestRate);
    if (isNaN(numInterestRate) || numInterestRate < 0 || numInterestRate > 100) {
      setManualInterestRateError("Interest rate must be a number between 0 and 100.");
    } else {
      setManualInterestRateError("");
    }
  };

  const validateStep = (step) => {
    let isValid = true;
    if (step === 0) {
      if (!selectedBorrowerId) {
        setBorrowerError("Please select a borrower.");
        isValid = false;
      } else {
        setBorrowerError("");
      }
    } else if (step === 1) {
      handleAmountBlur();
      handleManualInterestRateBlur();
      if (!startDate || !startDate.isValid()) {
        setStartDateError("Invalid start date.");
        isValid = false;
      }
      if (!dueDate || !dueDate.isValid()) {
        setDueDateError("Invalid due date.");
        isValid = false;
      } else if (startDate && dueDate && dueDate.isBefore(startDate, 'day')) {
        setDueDateError("Due date cannot be before the start date.");
        isValid = false;
      }
      if (amountError || manualInterestRateError || !amount.trim() || !manualInterestRate.trim()) {
        isValid = false;
      }
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      showSnackbar("Please correct the errors before proceeding.", "error");
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const selectedBorrower = borrowers.find(b => b.id === selectedBorrowerId);

  const handleSubmit = async () => {
    setError("");

    if (!validateStep(0) || !validateStep(1)) {
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
      const loanDocRef = await addLoan({
        borrowerId: selectedBorrowerId,
        principal,
        interest,
        totalRepayable,
        startDate: formattedStartDate,
        dueDate: formattedDueDate,
        status: "Active",
        repaidAmount: 0,
        manualInterestRate: interestRateDecimal,
      });

      await addActivityLog({
        action: "Loan Created (Manual)",
        details: `Manual loan created for ${selectedBorrower?.name || 'Unknown'} (ZMW ${principal.toLocaleString()}) [Loan ID: ${loanDocRef.id}]`,
        timestamp: new Date().toISOString(),
      });

      showSnackbar(`Manual loan added successfully! Loan ID: ${loanDocRef.id}`, "success");

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      if (location.state?.borrower) {
        navigate(-1); // Go back to the previous page
      } else {
        setSelectedBorrowerId("");
        setAmount("");
        setStartDate(dayjs());
        setDueDate(dayjs().add(1, 'week'));
        setManualInterestRate("");
        setActiveStep(0);
        setBorrowerError("");
        setAmountError("");
        setStartDateError("");
        setDueDateError("");
        setManualInterestRateError("");
      }

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
              select
              label="Select Borrower"
              value={selectedBorrowerId}
              onChange={(e) => setSelectedBorrowerId(e.target.value)}
              fullWidth
              required
              error={!!borrowerError}
              helperText={borrowerError || "Select a borrower or create a new one."}
              sx={textFieldStyles}
            >
              <MenuItem value="" disabled>
                <em>Select a borrower...</em>
              </MenuItem>
              {borrowers.map((borrower) => (
                <MenuItem key={borrower.id} value={borrower.id}>
                  {borrower.name} - {borrower.phone}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={() => navigate('/add-borrower')}>
                <ListItemIcon>
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Create New Borrower</ListItemText>
              </MenuItem>
            </TextField>
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={1.5} sx={{ py: 1.5 }}>
            <TextField
              label="Loan Amount (ZMW)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={handleAmountBlur}
              type="number"
              inputProps={{ min: 1 }}
              fullWidth
              required
              error={!!amountError}
              helperText={amountError}
              sx={textFieldStyles}
            />
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              enableAccessibleFieldDOMStructure={false}
              slots={{ textField: TextField }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!startDateError,
                  helperText: startDateError,
                  sx: textFieldStyles,
                },
              }}
            />
            <DatePicker
              label="Due Date"
              value={dueDate}
              onChange={(newValue) => setDueDate(newValue)}
              enableAccessibleFieldDOMStructure={false}
              slots={{ textField: TextField }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!dueDateError,
                  helperText: dueDateError,
                  sx: textFieldStyles,
                },
              }}
              minDate={startDate || dayjs()}
              disablePast
            />
            <TextField
              label="Interest Rate (%)"
              value={manualInterestRate}
              onChange={(e) => setManualInterestRate(e.target.value)}
              onBlur={handleManualInterestRateBlur}
              type="number"
              inputProps={{ min: 0, max: 100, step: "0.01" }}
              fullWidth
              required
              error={!!manualInterestRateError}
              helperText={manualInterestRateError}
              sx={textFieldStyles}
            />
            <Fade in={displayPrincipal > 0 && manualInterestRate !== ""}>
              <Box sx={{
                p: 1.5,
                bgcolor: theme.palette.mode === 'light' ? theme.palette.secondary.light : theme.palette.secondary.dark,
                borderRadius: 2,
                borderLeft: `5px solid ${theme.palette.secondary.main}`,
              }}>
                <Typography variant="caption" color="text.secondary">
                  Calculated Interest: ZMW{" "}
                  {displayInterest.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Total Repayable: ZMW{" "}
                  {displayTotalRepayable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </Fade>
          </Stack>
        );
      case 2:
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
      default:
        return 'Unknown step';
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        maxWidth: 500,
        mx: "auto",
        mt: 2,
        p: 2,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Add New Loan (Manual)</Typography>
      <Stepper alternativeLabel activeStep={activeStep} connector={<CustomStepConnector />} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={ColorlibStepIcon} sx={{ fontSize: '0.875rem' }}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 1.5, fontSize: '0.875rem' }}>
          {error}
        </Alert>
      )}

      {getStepContent(activeStep)}
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          sx={{ mr: 1, px: 1, fontSize: '0.875rem' }}
        >
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep === steps.length - 1 ? (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="secondary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ fontSize: '0.875rem' }}
          >
            {loading ? "Adding Loan..." : "Add Loan"}
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained" color="secondary" disabled={loading} sx={{ fontSize: '0.875rem' }}>
            Next
          </Button>
        )}
      </Box>
    </Paper>
  );
}

/**
 * Main LoanManagementTabs Component
 * This component now orchestrates the new stepper-based forms with refined styling.
 */
export default function LoanManagementTabs() {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleChangeTab = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%", mt: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={handleChangeTab}
          aria-label="loan type tabs"
          centered
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: (theme) => theme.palette.secondary.main,
            },
            "& .MuiTab-root": {
              color: (theme) => theme.palette.text.secondary,
              "&.Mui-selected": {
                color: (theme) => theme.palette.secondary.main,
              },
              fontSize: '0.875rem',
              minHeight: '48px',
              padding: '12px 16px',
            },
          }}
        >
          <Tab label="Auto Loan" />
          <Tab label="Manual Loan" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {selectedTab === 0 && <AutoLoanForm />}
          {selectedTab === 1 && <ManualLoanForm />}
        </Box>
      </Box>
    </LocalizationProvider>
  );
}