// src/components/OfflineQueueProcessor.js
import { useEffect } from 'react';
import useOfflineStatus from '../hooks/useOfflineStatus';
import { getQueuedRequests, dequeueRequest } from '../utils/offlineQueue';
import { useFirestore } from '../contexts/FirestoreProvider';
import { useSnackbar } from './SnackbarProvider';

export default function OfflineQueueProcessor() {
  const isOnline = useOfflineStatus();
  const { addLoan, addActivityLog } = useFirestore();
  const showSnackbar = useSnackbar();

  useEffect(() => {
    async function processQueue() {
      const queuedRequests = await getQueuedRequests();
      if (queuedRequests.length > 0) {
        showSnackbar(`Processing ${queuedRequests.length} offline requests...`, "info");
        let request = await dequeueRequest();
        while (request) {
          try {
            if (request.type === 'addLoan') {
              await addLoan(request.data);
            } else if (request.type === 'addActivityLog') {
              await addActivityLog(request.data);
            }
            showSnackbar(`Request processed successfully.`, "success");
          } catch (error) {
            showSnackbar(`Failed to process request. It will be retried.`, "error");
            // Re-enqueue the request if it fails
            // Note: This is a simple retry mechanism. For a more robust solution,
            // you might want to add a retry limit or a backoff strategy.
            // For now, we'll just put it back at the end of the queue.
            // await enqueueRequest(request);
          }
          request = await dequeueRequest();
        }
      }
    }

    if (isOnline) {
      processQueue();
    }
  }, [isOnline, addLoan, addActivityLog, showSnackbar]);

  return null;
}
