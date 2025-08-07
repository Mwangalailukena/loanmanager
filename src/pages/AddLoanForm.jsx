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
} from "@mui/material";
// Changed ErrorIcon to WarningIcon
import WarningIcon from "@mui/icons-material/Warning";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// --- NEW IMPORTS FOR DATE PICKERS ---
// These are required for the DatePicker components in the Manual Loan tab.
// Please ensure you have '@mui/x-date-pickers' and 'dayjs' installed:
// npm install @mui/x-date-pickers dayjs
// or yarn add @mui/x-date-pickers dayjs
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// --- END NEW IMPORTS ---

// --- ORIGINAL IMPORTS (as provided by you, untouched) ---
// This component assumes your FirestoreProvider is correctly set up
// and provides the 'useFirestore' hook.
// CORRECTED PATH: Changed from "../contents/FirestoreProvider" to "../contexts/FirestoreProvider"
import { useFirestore } from "../contexts/FirestoreProvider";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import Papa from "papaparse"; // Used for CSV import in AutoLoanForm
// --- END ORIGINAL IMPORTS ---


// Options for auto interest duration (retained from your original code)
const interestOptions = [
  { label: "1 Week", value: 1 },
  { label: "2 Weeks", value: 2 },
  { label: "3 Weeks", value: 3 },
  { label: "4 Weeks", value: 4 },
];

// Helper for common TextField styles to apply theme accent color on focus
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

/**
 * AutoLoanForm Component
 * This component encapsulates your original AddLoanForm logic.
 * It handles adding loans with automatically calculated interest and dates
 * based on predefined durations.
 */
function AutoLoanForm() {
  const theme = useTheme();
  // Destructure addLoan, addActivityLog, and settings from your existing Firestore context.
  const { addLoan, addActivityLog, settings } = useFirestore();

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
    // Check for Contact Picker API support on component mount
    if ("contacts" in navigator && "select" in navigator.contacts) {
      setContactPickerSupported(true);
    } else {
      console.warn("Contact Picker API not supported in this browser or context.");
    }
  }, []);

  // Handler for selecting contact from device using the Contact Picker API
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
          // Clean phone number to digits only, removing non-numeric characters
          setPhone(selectedContact.tel[0].replace(/\D/g, ""));
        }
        toast.success("Contact details imported!");
      } else {
        toast.info("No contact was selected.");
      }
    } catch (err) {
      console.error("Error accessing contacts:", err);
      if (err.name === "NotAllowedError" || err.name === "SecurityError") {
        toast.error(
          "Permission denied to access contacts. Please grant access in your browser settings."
        );
      } else if (err.name === "AbortError") {
        toast.info("Contact selection cancelled.");
      } else {
        toast.error("Failed to access contacts. " + (err.message || ""));
      }
    } finally {
      setLoading(false);
    }
  };

  // Retrieve interest rates from settings, or use default fallback values
  const interestRates = settings?.interestRates || {
    1: 0.15, // 15% for 1 week
    2: 0.2,  // 20% for 2 weeks
    3: 0.3,  // 30% for 3 weeks
    4: 0.3,  // 30% for 4 weeks
  };

  // Function to calculate interest based on principal and duration in weeks
  const calculateInterest = (principal, weeks) =>
    principal * (interestRates[weeks] || 0);

  // NEW: Refactored validation functions with new regex for name
  const handleBorrowerBlur = () => {
    if (!borrower.trim() || !/^[a-zA-Z]{2,50}$/.test(borrower.trim())) {
      setBorrowerError("Borrower name must be 2-50 characters, containing only letters.");
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

  // The main validation function for submission
  const validateFields = () => {
    handleBorrowerBlur();
    handlePhoneBlur();
    handleAmountBlur();
    return !borrowerError && !phoneError && !amountError;
  };

  // Handle form submission for adding a single loan
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Call validateFields for final check
    if (!validateFields()) {
      setLoading(false);
      return;
    }

    const principal = Number(amount);
    const interest = calculateInterest(principal, interestDuration);
    const totalRepayable = principal + interest;
    const startDate = dayjs().format("YYYY-MM-DD"); // Current date as start date
    const dueDate = dayjs().add(interestDuration * 7, "day").format("YYYY-MM-DD"); // Due date based on duration

    try {
      const loanDocRef = await addLoan({
        borrower,
        phone,
        principal,
        interest,
        totalRepayable,
        startDate,
        dueDate,
        status: "Active", // Default status for new loans
        repaidAmount: 0,   // Initial repaid amount
        interestDuration,  // Store the selected interest duration
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

      setBorrower("");
      setPhone("");
      setAmount("");
      setInterestDuration(1); // Reset to default duration
      setBorrowerError("");
      setPhoneError("");
      setAmountError("");
    } catch (err) {
      console.error("Loan creation failed:", err);
      setError("Failed to add loan. Please try again.");
    } finally {
      setLoading(false); // End loading state
    }
  };

  // Calculated values for display in the UI
  const displayPrincipal = Number(amount);
  const displayInterest = calculateInterest(displayPrincipal, interestDuration);
  const displayTotalRepayable = displayPrincipal + displayInterest;

  // Handle CSV file import for bulk loan creation
  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setImportLoading(true);
    setCsvErrors([]); // Clear any previous CSV errors
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

          // UPDATED: Name validation with new regex
          if (!borrowerName || !/^[a-zA-Z]{2,50}$/.test(borrowerName)) {
            errors.push(`Row ${lineNumber}: Invalid 'Borrower Name'. Must be 2-50 letters.`);
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

  return (
    <Paper
      elevation={2}
      sx={{
        maxWidth: 500,
        mx: "auto",
        mt: 3,
        p: 3,
        border: (theme) => `2px solid ${theme.palette.primary.main}`,
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5">Add New Loan (Auto)</Typography>
        <Tooltip title="Import multiple loans from CSV">
          <IconButton
            color="secondary"
            onClick={() => setOpenImportDialog(true)}
            disabled={loading || importLoading}
            aria-label="import loans"
          >
            <UploadFileIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={1}>
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
                <IconButton
                  color="secondary"
                  onClick={handleSelectContact}
                  disabled={loading || importLoading}
                  aria-label="import contact"
                >
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

          {/* IMPROVED: Fade animation and enhanced styling for the summary box */}
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


          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={loading || importLoading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "Adding Loan..." : "Add Loan"}
          </Button>
        </Stack>
      </form>

      {/* Dialog for CSV Import */}
      <Dialog
        open={openImportDialog}
        onClose={handleCloseImportDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            Import Loans from CSV
            <IconButton onClick={handleCloseImportDialog} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a CSV file with loan data. Ensure the first row contains these exact
            headers.
          </Typography>
          <Paper variant="outlined" sx={{ p: 1, mb: 2, bgcolor: "grey.100" }}>
            <Typography
              variant="body2"
              component="pre"
              sx={{ overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
            >
              "Borrower Name","Phone Number","Loan Amount (ZMW)","Interest Duration (Weeks)"
            </Typography>
          </Paper>

          <Button
            onClick={handleDownloadSample}
            color="primary"
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            sx={{ mb: 2 }}
          >
            Download Sample CSV
          </Button>

          {csvErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body1" fontWeight="bold">
                Errors found in CSV file:
              </Typography>
              <List dense>
                {csvErrors.map((err, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: "30px" }}>
                      <WarningIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary={err} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}

          <input
            accept=".csv"
            style={{ display: "none" }}
            id="csv-upload-button-dialog"
            type="file"
            onChange={handleCSVImport}
            ref={fileInputRef}
          />
          <label htmlFor="csv-upload-button-dialog">
            <Button
              variant="contained"
              component="span"
              color="secondary"
              startIcon={
                importLoading ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />
              }
              disabled={importLoading}
              fullWidth
            >
              {importLoading ? `Importing... (${processedCount} processed)` : "Select CSV File"}
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog} disabled={importLoading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

/**
 * ManualLoanForm Component
 * This component allows adding loans with manually set start date, end date, and interest rate.
 */
function ManualLoanForm() {
  const theme = useTheme();
  const { addLoan, addActivityLog } = useFirestore();

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

  // UPDATED: Name validation with new regex
  const handleBorrowerBlur = () => {
    if (!borrower.trim() || !/^[a-zA-Z]{2,50}$/.test(borrower.trim())) {
      setBorrowerError("Borrower name must be 2-50 characters, containing only letters.");
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

  const validateFields = () => {
    let isValid = true;
    setBorrowerError("");
    setPhoneError("");
    setAmountError("");
    setStartDateError("");
    setDueDateError("");
    setManualInterestRateError("");

    // UPDATED: Name validation with new regex
    if (!borrower.trim() || !/^[a-zA-Z]{2,50}$/.test(borrower.trim())) {
      setBorrowerError("Borrower name must be 2-50 characters, containing only letters.");
      isValid = false;
    }

    if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) {
      setPhoneError("Phone number must be exactly 10 digits.");
      isValid = false;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError("Loan amount must be a valid positive number.");
      isValid = false;
    }

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

    const numInterestRate = Number(manualInterestRate);
    if (isNaN(numInterestRate) || numInterestRate < 0 || numInterestRate > 100) {
      setManualInterestRateError("Interest rate must be a number between 0 and 100.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!validateFields()) {
      setLoading(false);
      return;
    }

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

      setBorrower("");
      setPhone("");
      setAmount("");
      setStartDate(dayjs());
      setDueDate(dayjs().add(1, 'week'));
      setManualInterestRate("");
      setBorrowerError("");
      setPhoneError("");
      setAmountError("");
      setStartDateError("");
      setDueDateError("");
      setManualInterestRateError("");
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

  return (
    <Paper
      elevation={2}
      sx={{
        maxWidth: 500,
        mx: "auto",
        mt: 3,
        p: 3,
        border: (theme) => `2px solid ${theme.palette.primary.main}`,
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" sx={{ mb: 3 }}>
        Add New Loan (Manual)
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={1}>
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
                <IconButton
                  color="secondary"
                  onClick={handleSelectContact}
                  disabled={loading}
                  aria-label="import contact"
                >
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

          {/* IMPROVED: Fade animation and enhanced styling for the summary box */}
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

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "Adding Loan..." : "Add Loan"}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}

/**
 * Main LoanManagementTabs Component
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
