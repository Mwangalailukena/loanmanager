// src/components/HelpDialog.jsx
import React from "react";
import {
  Dialog,
  Box,
  Typography,
  Button,
} from "@mui/material";

export default function HelpDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          Help & Support
        </Typography>
        <Typography><strong>Mwangala Ilukena</strong></Typography>
        <Typography>Phone: 0974103004</Typography>
        <Typography>Email: ilukenamwangala@gmail.com</Typography>
        <Box mt={3} textAlign="right">
          <Button onClick={onClose} variant="contained">Close</Button>
        </Box>
      </Box>
    </Dialog>
  );
}

