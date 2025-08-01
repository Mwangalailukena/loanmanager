import { getDoc } from "firebase/firestore";
import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { useFirestore } from "../contexts/FirestoreProvider";
import { toast } from "react-toastify";
import dayjs from "dayjs";

import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";

import Papa from "papaparse";

const interestOptions = [
  { label: "1 Week", value: 1 },
  { label: "2 Weeks", value: 2 },
  { label: "3 Weeks", value: 3 },
  { label: "4 Weeks", value: 4 },
];

export default function AddLoanForm() {
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
          setPhone(selectedContact.tel[0]);
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

  const interestRates = settings?.interestRates || {
    1: 0.15,
    2: 0.2,
    3: 0.3,
    4: 0.3,
  };

  const calculateInterest = (principal, weeks) =>
    principal * (interestRates[weeks] || 0);

  const validateFields = () => {
    let isValid = true;
    setBorrowerError("");
    setPhoneError("");
    setAmountError("");

    if (!/^[a-zA-Z\s]{2,}$/.test(borrower.trim())) {
      setBorrowerError("Borrower name must contain only letters and spaces.");
      isValid = false;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setPhoneError("Phone number must be exactly 10 digits.");
      isValid = false;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError("Loan amount must be a valid positive number.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const isValid = validateFields();
    if (!isValid) {
      setLoading(false);
      return;
    }

    const principal = Number(amount);
    const interest = calculateInterest(principal, interestDuration);
    const totalRepayable = principal + interest;

    const startDate = dayjs().format("YYYY-MM-DD");
    const dueDate = dayjs()
      .add(interestDuration * 7, "day")
      .format("YYYY-MM-DD");

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

      const docSnap = await getDoc(loanDocRef);
      const isOffline = docSnap.metadata?.hasPendingWrites ?? false;

      await addActivityLog({
        action: "Loan Created",
        details: `Loan created for ${borrower} (ZMW ${principal.toLocaleString()}) [Loan ID: ${loanDocRef.id}]`,
        timestamp: new Date().toISOString(),
      });

      // Use a unique toast ID to avoid duplicates
      const toastId = "loan-add-success";

      toast.success(
        isOffline
          ? "Loan added (offline). Will sync when online."
          : `Loan added successfully! Loan ID: ${loanDocRef.id}`,
        { toastId }
      );

      // Vibration feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Clear form
      setBorrower("");
      setPhone("");
      setAmount("");
      setInterestDuration(1);
      setBorrowerError("");
      setPhoneError("");
      setAmountError("");
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
      setImportLoading(false);
      return;
    }

    setImportLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const importedLoans = results.data;
        const errors = [];
        let successCount = 0;

        for (let i = 0; i < importedLoans.length; i++) {
          const row = importedLoans[i];
          const lineNumber = i + 1;

          const borrowerName = String(row["Borrower Name"] || "").trim();
          const phoneNumber = String(row["Phone Number"] || "").trim();
          const loanAmount = Number(row["Loan Amount (ZMW)"]);
          const interestDur = Number(row["Interest Duration (Weeks)"]);

          if (!borrowerName || !/^[a-zA-Z\s]{2,}$/.test(borrowerName)) {
            errors.push(`Row ${lineNumber}: Invalid or missing 'Borrower Name'.`);
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
        setOpenImportDialog(false);

        // Unique toast IDs for import results
        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} loan(s)!`, {
            toastId: "csv-import-success",
          });
        }
        if (errors.length > 0) {
          setError(
            `CSV Import finished with ${errors.length} error(s). Please check console and toast notifications.`
          );
          console.error("CSV Import Errors:", errors);
          errors.forEach((err) =>
            toast.error(`Import Error: ${err}`, { autoClose: false })
          );
        }
      },
      error: (err) => {
        setImportLoading(false);
        setOpenImportDialog(false);
        setError("Failed to parse CSV file: " + err.message);
        toast.error("CSV parsing error: " + err.message);
        console.error("PapaParse error:", err);
      },
    });
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
        <Typography variant="h5">Add New Loan</Typography>
        <Tooltip title="Import multiple loans from CSV">
          <IconButton
            color="primary"
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
        <Stack spacing={2}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              label="Borrower Name"
              value={borrower}
              onChange={(e) => setBorrower(e.target.value)}
              fullWidth
              required
              inputProps={{ maxLength: 50 }}
              error={!!borrowerError}
              helperText={borrowerError}
            />
            {contactPickerSupported ? (
              <Tooltip title="Import from device contacts">
                <IconButton
                  color="primary"
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
                  <IconButton
                    color="primary"
                    disabled
                    aria-label="import contact not supported"
                  >
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
            fullWidth
            required
            inputProps={{ maxLength: 10 }}
            error={!!phoneError}
            helperText={phoneError}
          />
          <TextField
            label="Loan Amount (ZMW)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputProps={{ min: 1 }}
            fullWidth
            required
            error={!!amountError}
            helperText={amountError}
          />
          <TextField
            select
            label="Interest Duration"
            value={interestDuration}
            onChange={(e) => setInterestDuration(Number(e.target.value))}
            fullWidth
            required
          >
            {interestOptions.map(({ label, value }) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          {displayPrincipal > 0 && (
            <Box sx={{ p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
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
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || importLoading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "Adding Loan..." : "Add Loan"}
          </Button>
        </Stack>
      </form>

      <Dialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            Import Loans from CSV
            <IconButton onClick={() => setOpenImportDialog(false)} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload a CSV file with loan data. Ensure the first row contains these exact
            headers:
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
          <input
            accept=".csv"
            style={{ display: "none" }}
            id="csv-upload-button-dialog"
            type="file"
            onChange={handleCSVImport}
            onClick={(event) => {
              event.target.value = null;
            }}
          />
          <label htmlFor="csv-upload-button-dialog">
            <Button
              variant="contained"
              component="span"
              startIcon={
                importLoading ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />
              }
              disabled={importLoading}
              fullWidth
            >
              {importLoading ? "Importing..." : "Select CSV File"}
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImportDialog(false)} disabled={importLoading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

