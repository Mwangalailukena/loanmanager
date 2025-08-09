import React, { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from '@mui/icons-material/FileDownload';

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
import { toast } from "react-toastify";
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
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.secondary.main,
  },
});

const steps = ['Borrower Details', 'Loan Details', 'Review & Submit'];

// Custom stepper icon styles
const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
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
    1: <AssignmentIcon />,
    2: <PaidIcon />,
    3: <CheckCircleIcon />,
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
  const { addLoan, addActivityLog, settings } = useFirestore();

  const [activeStep, setActiveStep] = useState(0);

  const [borrower, setBorrower] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [interestDuration, setInterestDuration] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);

  const [borrowerError, setBorrowerError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [csvErrors, setCsvErrors] = useState([]);
  const [processedCount, setProcessedCount] = useState(0);

  const [contactPickerSupported, setContactPickerSupported] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if ("contacts" in navigator && "select" in navigator.contacts) {
      setContactPickerSupported(true);
    } else {
      console.warn("Contact Picker API not supported in this browser or context.");
    }
  }, []);

  const handleSelectContact = async () => {
    if (!contactPickerSupported) {
      toast.warn("Your browser does not support picking contacts directly.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const properties = ["name", "tel"];
      const options = { multiple: false };
      const contacts = await navigator.contacts.select(properties, options);

      if (contacts && contacts.length > 0) {
        const selectedContact = contacts[0];
        if (selectedContact.name && selectedContact.name.length > 0) {
          setBorrower(selectedContact.name.join(" "));
        }
        if (selectedContact.tel && selectedContact.tel.length > 0) {
          setPhone(selectedContact.tel[0].replace(/\D/g, ""));
        }
        toast.success("Contact details imported!");
      } else {
        toast.info("No contact was selected.");
      }
    } catch (err) {
      console.error("Error accessing contacts:", err);
      if (err.name === "NotAllowedError" || err.name === "SecurityError") {
        toast.error("Permission denied to access contacts. Please grant access in your browser settings.");
      } else if (err.name === "AbortError") {
        toast.info("Contact selection cancelled.");
      } else {
        toast.error("Failed to access contacts. " + (err.message || ""));
      }
    } finally {
      setLoading(false);
    }
  };

  const interestRates = settings?.interestRates || {
    1: 0.15,
    2: 0.2,
    3: 0.3,
    4: 0.3,
  };

  const calculateInterest = (principal, weeks) => principal * (interestRates[weeks] || 0);

  const handleBorrowerBlur = () => {
    if (!borrower.trim() || !/^[a-zA-Z\s]{2,50}$/.test(borrower.trim())) {
      setBorrowerError("Borrower name must be 2-50 characters, containing only letters and spaces.");
    } else {
      setBorrowerError("");
    }
  };

  const handlePhoneBlur = () => {
    if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) {
      setPhoneError("Phone number must be exactly 10 digits.");
    } else {
      setPhoneError("");
    }
  };

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
      handleBorrowerBlur();
      handlePhoneBlur();
      if (borrowerError || phoneError || !borrower.trim() || !phone.trim()) {
        isValid = false;
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
      toast.error("Please correct the errors before proceeding.");
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    const principal = Number(amount);
    const interest = calculateInterest(principal, interestDuration);
    const totalRepayable = principal + interest;
    const startDate = dayjs().format("YYYY-MM-DD");
    const dueDate = dayjs().add(interestDuration * 7, "day").format("YYYY-MM-DD");

    try {
      const loanDocRef = await addLoan({
        borrower,
        phone,
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
        details: `Loan created for ${borrower} (ZMW ${principal.toLocaleString()}) [Loan ID: ${loanDocRef.id}]`,
        timestamp: new Date().toISOString(),
      });

      toast.success(`Loan added successfully! Loan ID: ${loanDocRef.id}`);

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setLoading(false); // Reset loading state on success

      setBorrower("");
      setPhone("");
      setAmount("");
      setInterestDuration(1);
      setActiveStep(0);
      setBorrowerError("");
      setPhoneError("");
      setAmountError("");
    } catch (err) {
      console.error("Loan creation failed:", err);
      setError("Failed to add loan. Please try again.");
      setLoading(false); // Also reset loading on failure
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
          toast.success(`Successfully imported ${successCount} loan(s)!`);
        }
        if (errors.length > 0) {
          setCsvErrors(errors);
          setError(`CSV Import finished with ${errors.length} error(s). Please review the details below.`);
          errors.forEach((err) =>
            toast.error(`Import Error: ${err}`, { autoClose: false })
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
        toast.error("CSV parsing error: " + err.message);
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
          <Stack spacing={2} sx={{ py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                label="Borrower Name"
                value={borrower}
                onChange={(e) => setBorrower(e.target.value)}
                onBlur={handleBorrowerBlur}
                fullWidth
                required
                inputProps={{ maxLength: 50 }}
                error={!!borrowerError}
                helperText={borrowerError}
                sx={textFieldStyles}
              />
              {contactPickerSupported ? (
                <Tooltip title="Import from device contacts">
                  <IconButton color="secondary" onClick={handleSelectContact} disabled={loading || importLoading} aria-label="import contact">
                    <ContactPhoneIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Your browser does not support the Contact Picker API.">
                  <span>
                    <IconButton color="primary" disabled aria-label="import contact not supported">
                      <ContactPhoneIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Box>
            <TextField
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={handlePhoneBlur}
              fullWidth
              required
              inputProps={{ maxLength: 10, inputMode: "numeric", pattern: "[0-9]*" }}
              error={!!phoneError}
              helperText={phoneError}
              sx={textFieldStyles}
            />
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={2} sx={{ py: 2 }}>
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
                p: 2,
                bgcolor: theme.palette.mode === 'light' ? theme.palette.secondary.light : theme.palette.secondary.dark,
                borderRadius: 2,
                borderLeft: `5px solid ${theme.palette.secondary.main}`,
              }}>
                <Typography variant="body2" color="text.secondary">
                  Calculated Interest: ZMW{" "}
                  {displayInterest.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
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
          <Stack spacing={2} sx={{ py: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, width: '100%' }}>
              <Typography variant="h6" gutterBottom>Review Details</Typography>
              <Typography variant="body1"><strong>Borrower:</strong> {borrower}</Typography>
              <Typography variant="body1"><strong>Phone:</strong> {phone}</Typography>
              <Typography variant="body1"><strong>Principal:</strong> ZMW {displayPrincipal.toLocaleString()}</Typography>
              <Typography variant="body1"><strong>Interest Duration:</strong> {interestDuration} week{interestDuration > 1 ? 's' : ''}</Typography>
              <Typography variant="body1"><strong>Calculated Interest:</strong> ZMW {displayInterest.toLocaleString()}</Typography>
              <Typography variant="body1" fontWeight="bold"><strong>Total Repayable:</strong> ZMW {displayTotalRepayable.toLocaleString()}</Typography>
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
        mt: 3,
        p: 3,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Add New Loan (Auto)</Typography>
        <Tooltip title="Import multiple loans from CSV">
          <IconButton color="secondary" onClick={() => setOpenImportDialog(true)} disabled={loading || importLoading} aria-label="import loans">
            <UploadFileIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Stepper alternativeLabel activeStep={activeStep} connector={<CustomStepConnector />} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {getStepContent(activeStep)}
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 3 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0 || loading || importLoading}
          onClick={handleBack}
          sx={{ mr: 1 }}
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
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "Adding Loan..." : "Add Loan"}
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained" color="secondary" disabled={loading || importLoading}>
            Next
          </Button>
        )}
      </Box>

      {/* Dialog for CSV Import (remains unchanged) */}
      <Dialog open={openImportDialog} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Import Loans from CSV
            <IconButton onClick={handleCloseImportDialog} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a CSV file with loan data. Ensure the first row contains these exact headers.
          </Typography>
          <Paper variant="outlined" sx={{ p: 1, mb: 2, bgcolor: "grey.100" }}>
            <Typography variant="body2" component="pre" sx={{ overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              "Borrower Name","Phone Number","Loan Amount (ZMW)","Interest Duration (Weeks)"
            </Typography>
          </Paper>
          <Button onClick={handleDownloadSample} color="primary" variant="outlined" size="small" startIcon={<FileDownloadIcon />} sx={{ mb: 2 }}>
            Download Sample CSV
          </Button>
          {csvErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body1" fontWeight="bold">Errors found in CSV file:</Typography>
              <List dense>
                {csvErrors.map((err, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: "30px" }}><WarningIcon color="error" /></ListItemIcon>
                    <ListItemText primary={err} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
          <input accept=".csv" style={{ display: "none" }} id="csv-upload-button-dialog" type="file" onChange={handleCSVImport} ref={fileInputRef} />
          <label htmlFor="csv-upload-button-dialog">
            <Button variant="contained" component="span" color="secondary" startIcon={importLoading ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />} disabled={importLoading} fullWidth>
              {importLoading ? `Importing... (${processedCount} processed)` : "Select CSV File"}
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog} disabled={importLoading}>Cancel</Button>
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
  const { addLoan, addActivityLog } = useFirestore();

  const [activeStep, setActiveStep] = useState(0);

  const [borrower, setBorrower] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(dayjs());
  const [dueDate, setDueDate] = useState(dayjs().add(1, 'week'));
  const [manualInterestRate, setManualInterestRate] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [borrowerError, setBorrowerError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [dueDateError, setDueDateError] = useState("");
  const [manualInterestRateError, setManualInterestRateError] = useState("");

  const [contactPickerSupported, setContactPickerSupported] = useState(false);
  useEffect(() => {
    if ("contacts" in navigator && "select" in navigator.contacts) {
      setContactPickerSupported(true);
    } else {
      console.warn("Contact Picker API not supported in this browser or context.");
    }
  }, []);

  const handleSelectContact = async () => {
    if (!contactPickerSupported) {
      toast.warn("Your browser does not support picking contacts directly.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const properties = ["name", "tel"];
      const options = { multiple: false };
      const contacts = await navigator.contacts.select(properties, options);
      if (contacts && contacts.length > 0) {
        const selectedContact = contacts[0];
        if (selectedContact.name && selectedContact.name.length > 0) {
          setBorrower(selectedContact.name.join(" "));
        }
        if (selectedContact.tel && selectedContact.tel.length > 0) {
          setPhone(selectedContact.tel[0].replace(/\D/g, ""));
        }
        toast.success("Contact details imported!");
      } else {
        toast.info("No contact was selected.");
      }
    } catch (err) {
      console.error("Error accessing contacts:", err);
      if (err.name === "NotAllowedError" || err.name === "SecurityError") {
        toast.error("Permission denied to access contacts. Please grant access in your browser settings.");
      } else if (err.name === "AbortError") {
        toast.info("Contact selection cancelled.");
      } else {
        toast.error("Failed to access contacts. " + (err.message || ""));
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateInterest = (principal, rate) => principal * (rate / 100);

  const handleBorrowerBlur = () => {
    if (!borrower.trim() || !/^[a-zA-Z\s]{2,50}$/.test(borrower.trim())) {
      setBorrowerError("Borrower name must be 2-50 characters, containing only letters and spaces.");
    } else {
      setBorrowerError("");
    }
  };
  const handlePhoneBlur = () => {
    if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) {
      setPhoneError("Phone number must be exactly 10 digits.");
    } else {
      setPhoneError("");
    }
  };
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
      handleBorrowerBlur();
      handlePhoneBlur();
      if (borrowerError || phoneError || !borrower.trim() || !phone.trim()) {
        isValid = false;
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
      toast.error("Please correct the errors before proceeding.");
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    const principal = Number(amount);
    const interestRateDecimal = Number(manualInterestRate);
    const interest = calculateInterest(principal, interestRateDecimal);
    const totalRepayable = principal + interest;

    const formattedStartDate = startDate.format("YYYY-MM-DD");
    const formattedDueDate = dueDate.format("YYYY-MM-DD");

    try {
      const loanDocRef = await addLoan({
        borrower,
        phone,
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
        details: `Manual loan created for ${borrower} (ZMW ${principal.toLocaleString()}) [Loan ID: ${loanDocRef.id}]`,
        timestamp: new Date().toISOString(),
      });

      toast.success(`Manual loan added successfully! Loan ID: ${loanDocRef.id}`);

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      
      setLoading(false); // Reset loading state on success

      setBorrower("");
      setPhone("");
      setAmount("");
      setStartDate(dayjs());
      setDueDate(dayjs().add(1, 'week'));
      setManualInterestRate("");
      setActiveStep(0);
      setBorrowerError("");
      setPhoneError("");
      setAmountError("");
      setStartDateError("");
      setDueDateError("");
      setManualInterestRateError("");
    } catch (err) {
      console.error("Manual loan creation failed:", err);
      setError("Failed to add manual loan. Please try again.");
      setLoading(false); // Also reset loading on failure
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
          <Stack spacing={2} sx={{ py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                label="Borrower Name"
                value={borrower}
                onChange={(e) => setBorrower(e.target.value)}
                onBlur={handleBorrowerBlur}
                fullWidth
                required
                inputProps={{ maxLength: 50 }}
                error={!!borrowerError}
                helperText={borrowerError}
                sx={textFieldStyles}
              />
              {contactPickerSupported ? (
                <Tooltip title="Import from device contacts">
                  <IconButton color="secondary" onClick={handleSelectContact} disabled={loading} aria-label="import contact">
                    <ContactPhoneIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Your browser does not support the Contact Picker API.">
                  <span>
                    <IconButton color="primary" disabled aria-label="import contact not supported">
                      <ContactPhoneIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Box>
            <TextField
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={handlePhoneBlur}
              fullWidth
              required
              inputProps={{ maxLength: 10, inputMode: "numeric", pattern: "[0-9]*" }}
              error={!!phoneError}
              helperText={phoneError}
              sx={textFieldStyles}
            />
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={2} sx={{ py: 2 }}>
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
                p: 2,
                bgcolor: theme.palette.mode === 'light' ? theme.palette.secondary.light : theme.palette.secondary.dark,
                borderRadius: 2,
                borderLeft: `5px solid ${theme.palette.secondary.main}`,
              }}>
                <Typography variant="body2" color="text.secondary">
                  Calculated Interest: ZMW{" "}
                  {displayInterest.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
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
          <Stack spacing={2} sx={{ py: 2 }}>
            <Paper variant="outlined" sx={{ p: 2, width: '100%' }}>
              <Typography variant="h6" gutterBottom>Review Details</Typography>
              <Typography variant="body1"><strong>Borrower:</strong> {borrower}</Typography>
              <Typography variant="body1"><strong>Phone:</strong> {phone}</Typography>
              <Typography variant="body1"><strong>Principal:</strong> ZMW {displayPrincipal.toLocaleString()}</Typography>
              <Typography variant="body1"><strong>Start Date:</strong> {startDate.format("YYYY-MM-DD")}</Typography>
              <Typography variant="body1"><strong>Due Date:</strong> {dueDate.format("YYYY-MM-DD")}</Typography>
              <Typography variant="body1"><strong>Interest Rate:</strong> {manualInterestRate}%</Typography>
              <Typography variant="body1"><strong>Calculated Interest:</strong> ZMW {displayInterest.toLocaleString()}</Typography>
              <Typography variant="body1" fontWeight="bold"><strong>Total Repayable:</strong> ZMW {displayTotalRepayable.toLocaleString()}</Typography>
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
        mt: 3,
        p: 3,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Add New Loan (Manual)</Typography>
      <Stepper alternativeLabel activeStep={activeStep} connector={<CustomStepConnector />} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {getStepContent(activeStep)}
      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 3 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          sx={{ mr: 1 }}
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
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "Adding Loan..." : "Add Loan"}
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained" color="secondary" disabled={loading}>
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
      <Box sx={{ width: "100%", mt: 3 }}>
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
            },
          }}
        >
          <Tab label="Auto Loan" />
          <Tab label="Manual Loan" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {selectedTab === 0 && <AutoLoanForm />}
          {selectedTab === 1 && <ManualLoanForm />}
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
