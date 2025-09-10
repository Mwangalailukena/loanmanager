
import React, { useState, useEffect } from 'react';
import { Typography, Button, List, ListItem, ListItemText, Paper } from '@mui/material';
import { getQueuedRequests } from '../utils/offlineQueue';
import useOfflineStatus from '../hooks/useOfflineStatus';
import OfflineQueueProcessor from './OfflineQueueProcessor';

export default function OfflineQueueMonitor() {
  const [queuedRequests, setQueuedRequests] = useState([]);
  const isOnline = useOfflineStatus();

  const fetchQueuedRequests = async () => {
    const requests = await getQueuedRequests();
    setQueuedRequests(requests);
  };

  useEffect(() => {
    fetchQueuedRequests();
  }, []);

  const handleRetry = () => {
    // The OfflineQueueProcessor will automatically try to process the queue when online.
    // This button provides a manual trigger for the user.
    // We can also add a more direct way to trigger the processor if needed.
    window.location.reload(); // Simple way to re-trigger the process
  };

  if (!isOnline && queuedRequests.length === 0) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6">Offline Queue</Typography>
      {isOnline ? (
        <Typography variant="body2" color="text.secondary">
          You are online. Pending requests will be processed automatically.
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          You are offline. These requests will be sent when you are back online.
        </Typography>
      )}
      <List>
        {queuedRequests.map((req) => (
          <ListItem key={req.id}>
            <ListItemText primary={req.type} secondary={`Data: ${JSON.stringify(req.data)}`} />
          </ListItem>
        ))}
      </List>
      {!isOnline && queuedRequests.length > 0 && (
        <Button variant="contained" onClick={handleRetry}>
          Retry Now
        </Button>
      )}
      <OfflineQueueProcessor />
    </Paper>
  );
}
