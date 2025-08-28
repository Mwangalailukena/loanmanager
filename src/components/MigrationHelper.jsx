import React, { useState } from 'react';
import { Button, Paper, Typography, CircularProgress, Box, Alert } from '@mui/material';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthProvider';
import { useSnackbar } from './SnackbarProvider';
import localforage from 'localforage';

export default function MigrationHelper() {
  const [loading, setLoading] = useState(false);
  const [clearCacheLoading, setClearCacheLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();
  const showSnackbar = useSnackbar();

  const handleClearCache = async () => {
    setClearCacheLoading(true);
    try {
      await localforage.clear();
      showSnackbar('Local cache cleared successfully! The app will now reload.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Cache clearing failed:", err);
      showSnackbar(`Failed to clear cache: ${err.message}`, 'error');
      setClearCacheLoading(false);
    }
  }

  const handleMigration = async () => {
    if (!currentUser) {
      setError('You must be logged in to perform this action.');
      showSnackbar('Error: Not logged in.', 'error');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const batch = writeBatch(db);
      let loansUpdated = 0;
      let paymentsUpdated = 0;

      // Migrate Loans
      const loansQuery = await getDocs(collection(db, 'loans'));
      loansQuery.forEach(doc => {
        const data = doc.data();
        if (!data.userId) {
          batch.update(doc.ref, { userId: currentUser.uid });
          loansUpdated++;
        }
      });

      // Migrate Payments
      const paymentsQuery = await getDocs(collection(db, 'payments'));
      paymentsQuery.forEach(doc => {
        const data = doc.data();
        if (!data.userId) {
          batch.update(doc.ref, { userId: currentUser.uid });
          paymentsUpdated++;
        }
      });

      if (loansUpdated > 0 || paymentsUpdated > 0) {
        await batch.commit();
        const successMsg = `Migration successful! Updated ${loansUpdated} loans and ${paymentsUpdated} payments.`;
        setSuccess(successMsg);
        showSnackbar(successMsg, 'success');
      } else {
        setSuccess('No documents needed updating. Your data is already up-to-date.');
        showSnackbar('No updates needed.', 'info');
      }

    } catch (err) {
      console.error("Migration failed:", err);
      const errorMsg = `Migration failed: ${err.message}`;
      setError(errorMsg);
      showSnackbar(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 4, maxWidth: 600, mx: 'auto', border: '1px solid', borderColor: 'warning.main' }}>
      <Typography variant="h6" gutterBottom>One-Time Data Migration</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Step 1: Click this button to update your data on the server. This will not delete any data.
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={handleMigration} 
          disabled={loading || clearCacheLoading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Migrating...' : 'Start Data Migration'}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Step 2: If data is still not visible or you see an "offline" message, click here to clear the local cache and reload the app.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={handleClearCache} 
          disabled={loading || clearCacheLoading}
          startIcon={clearCacheLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {clearCacheLoading ? 'Clearing Cache...' : 'Clear Cache & Reload'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
    </Paper>
  );
}
