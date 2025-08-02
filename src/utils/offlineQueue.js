// src/utils/offlineQueue.js
import localforage from "localforage";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore"; // Import serverTimestamp

const OFFLINE_LOANS_KEY = "pendingLoans";
const OFFLINE_PAYMENTS_KEY = "pendingPayments";

/**
 * Queue a loan to be synced later when online.
 * @param {Object} loanData - The loan data object to queue.
 */
export async function queueLoan(loanData) {
  const existing = (await localforage.getItem(OFFLINE_LOANS_KEY)) || [];
  existing.push({ ...loanData, timestamp: Date.now() });
  await localforage.setItem(OFFLINE_LOANS_KEY, existing);
}

/**
 * Queue a payment to be synced later when online.
 * @param {Object} paymentData - The payment data object to queue.
 */
export async function queuePayment(paymentData) {
  const existing = (await localforage.getItem(OFFLINE_PAYMENTS_KEY)) || [];
  existing.push({ ...paymentData, timestamp: Date.now() });
  await localforage.setItem(OFFLINE_PAYMENTS_KEY, existing);
}

/**
 * Sync all pending loans and payments stored offline to Firestore.
 * Syncs loans first, then payments.
 * @returns {Promise<void>}
 */
export async function syncPendingData() {
  const syncPromises = [];
  
  // Sync loans first
  const pendingLoans = (await localforage.getItem(OFFLINE_LOANS_KEY)) || [];
  for (const loan of pendingLoans) {
    const { timestamp, ...loanData } = loan; // Exclude the offline timestamp
    syncPromises.push(
      addDoc(collection(db, "loans"), {
        ...loanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  }

  // Sync payments next
  const pendingPayments = (await localforage.getItem(OFFLINE_PAYMENTS_KEY)) || [];
  for (const payment of pendingPayments) {
    const { timestamp, ...paymentData } = payment; // Exclude the offline timestamp
    syncPromises.push(
      addDoc(collection(db, "payments"), {
        ...paymentData,
        createdAt: serverTimestamp(),
      })
    );
  }

  try {
    // Wait for all sync operations to complete
    await Promise.all(syncPromises);

    // Clear the offline queues only after successful sync
    if (pendingLoans.length > 0) {
        await localforage.removeItem(OFFLINE_LOANS_KEY);
    }
    if (pendingPayments.length > 0) {
        await localforage.removeItem(OFFLINE_PAYMENTS_KEY);
    }
    console.log("Offline data synced successfully.");
  } catch (error) {
    console.error("Failed to sync some data:", error);
    // Do not clear queues on failure so they can be retried later
    throw error;
  }
}
