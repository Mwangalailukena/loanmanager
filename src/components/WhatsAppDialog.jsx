import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from '@mui/material';
import { generateWhatsAppLink } from '../utils/whatsapp';

const WhatsAppDialog = ({ open, onClose, phoneNumber, defaultMessage }) => {
  const [message, setMessage] = useState(defaultMessage);

  const handleSend = () => {
    window.open(generateWhatsAppLink(phoneNumber, message), '_blank');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Compose WhatsApp Message</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Message"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSend}>Send</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WhatsAppDialog;
