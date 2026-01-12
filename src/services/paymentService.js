import { collection, doc, runTransaction, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { addActivityLog } from "./activityService";

export const addPayment = async (db, loanId, amount, currentUser) => {
  if (!currentUser) return;
  const loanRef = doc(db, "loans", loanId);
  let paymentDocId;

  await runTransaction(db, async (transaction) => {
    const loanSnap = await transaction.get(loanRef);
    if (!loanSnap.exists()) throw new Error("Loan not found");

    const newRepaidAmount = (loanSnap.data().repaidAmount || 0) + amount;
    const paymentDocRef = doc(collection(db, "payments"));
    paymentDocId = paymentDocRef.id;

    transaction.set(paymentDocRef, {
      loanId, amount, userId: currentUser.uid, date: serverTimestamp(), createdAt: serverTimestamp()
    });
    transaction.update(loanRef, { repaidAmount: newRepaidAmount, updatedAt: serverTimestamp() });
  });

  await addActivityLog(db, {
    type: "payment_add",
    description: `Payment of ZMW ${amount.toFixed(2)} added to loan ID ${loanId}`,
    relatedId: paymentDocId,
    loanId: loanId,
    amount: amount,
    undoable: true
  }, currentUser);
};

export const getPaymentsByLoanId = async (db, loanId, currentUser) => {
  if (!currentUser) return [];
  const q = query(
    collection(db, "payments"),
    where("userId", "==", currentUser.uid),
    where("loanId", "==", loanId)
  );
  const querySnapshot = await getDocs(q);
  const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Client-side sort by date ascending
  return payments.sort((a, b) => {
      const dateA = a.date?.seconds || 0;
      const dateB = b.date?.seconds || 0;
      return dateA - dateB;
  });
};

export const undoPayment = async (db, paymentId, loanId, paymentAmount, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const loanRef = doc(db, "loans", loanId);
    const paymentRef = doc(db, "payments", paymentId);
    const activityLogRef = doc(db, "activityLogs", activityLogId);

    const loanSnap = await transaction.get(loanRef);
    if (!loanSnap.exists()) throw new Error("Loan not found");

    const currentRepaidAmount = (loanSnap.data().repaidAmount || 0);
    const newRepaidAmount = Math.max(0, currentRepaidAmount - paymentAmount); 

    transaction.update(loanRef, { repaidAmount: newRepaidAmount, updatedAt: serverTimestamp() });
    transaction.delete(paymentRef);
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "payment_undo", description: `Undid payment of ZMW ${paymentAmount.toFixed(2)} for Loan ID ${loanId}` }, currentUser);
};
