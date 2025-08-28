import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useSnackbar } from './SnackbarProvider';

export default function GuarantorDialog({ open, onClose, borrowerId, guarantor }) {
  const { addGuarantor, updateGuarantor } = useFirestore();
  const showSnackbar = useSnackbar();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditMode = guarantor != null;

  useEffect(() => {
    if (isEditMode) {
      setName(guarantor.name || '');
      setPhone(guarantor.phone || '');
      setNationalId(guarantor.nationalId || '');
      setAddress(guarantor.address || '');
    } else {
      // Reset form when opening for a new guarantor
      setName('');
      setPhone('');
      setNationalId('');
      setAddress('');
    }
  }, [guarantor, isEditMode, open]);

  const handleSubmit = async () => {
    if (!name || !phone) {
      showSnackbar('Name and Phone are required fields.', 'error');
      return;
    }
    setLoading(true);
    try {
      const guarantorData = { name, phone, nationalId, address, borrowerId };
      if (isEditMode) {
        await updateGuarantor(guarantor.id, guarantorData);
        showSnackbar('Guarantor updated successfully', 'success');
      } else {
        await addGuarantor(guarantorData);
        showSnackbar('Guarantor added successfully', 'success');
      }
      onClose();
    } catch (error) {
      console.error("Failed to save guarantor:", error);
      showSnackbar('Failed to save guarantor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEditMode ? 'Edit Guarantor' : 'Add Guarantor'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="National ID (Optional)"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            fullWidth
          />
          <TextField
            label="Address (Optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
