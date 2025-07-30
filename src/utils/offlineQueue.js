// src/utils/offlineQueue.js
import localforage from "localforage";
import { db } from "../firebase";
import { addDoc, collection } from "firebase/firestore";

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
 * If any sync fails, stops further syncing.
 */
export async function syncPendingData() {
  // Sync loans first
  const pendingLoans = (await localforage.getItem(OFFLINE_LOANS_KEY)) || [];
  for (const loan of pendingLoans) {
    try {
      await addDoc(collection(db, "loans"), loan);
    } catch (error) {
      console.error("Sync failed for loan", loan, error);
      return; // Stop syncing on failure to avoid partial syncs
    }
  }

  // Sync payments next
  const pendingPayments = (await localforage.getItem(OFFLINE_PAYMENTS_KEY)) || [];
  for (const payment of pendingPayments) {
    try {
      await addDoc(collection(db, "payments"), payment);
    } catch (error) {
      console.error("Sync failed for payment", payment, error);
      return; // Stop syncing on failure
    }
  }

  // Clear the offline queues after successful sync
  await localforage.removeItem(OFFLINE_LOANS_KEY);
  await localforage.removeItem(OFFLINE_PAYMENTS_KEY);
}

