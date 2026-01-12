import { 
  addDoc, 
  collection, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDoc, 
  runTransaction, 
  deleteField 
} from "firebase/firestore";
import { addActivityLog } from "./activityService";
import dayjs from "dayjs";

export const addLoan = async (db, loan, borrowers, currentUser) => {
  const docRef = await addDoc(collection(db, "loans"), { 
    ...loan, 
    userId: currentUser.uid, 
    createdAt: serverTimestamp(), 
    updatedAt: serverTimestamp() 
  });
  const borrowerName = borrowers.find(b => b.id === loan.borrowerId)?.name || "A borrower";
  await addActivityLog(db, {
    type: "loan_creation",
    description: `Loan added for borrower ${borrowerName}`,
    relatedId: docRef.id,
    undoable: true
  }, currentUser);
  return docRef;
};

export const updateLoan = async (db, id, updates, currentUser) => {
  if (!currentUser) return;
  const loanRef = doc(db, "loans", id);
  const loanSnap = await getDoc(loanRef);
  const previousData = loanSnap.exists() ? { ...loanSnap.data() } : null;

  await updateDoc(loanRef, { ...updates, updatedAt: serverTimestamp() });
  await addActivityLog(db, { 
    type: "loan_update", 
    description: `Loan ID ${id} updated`,
    relatedId: id,
    undoData: previousData,
    undoable: !!previousData
  }, currentUser);
};

export const deleteLoan = async (db, id, currentUser) => {
  if (!currentUser) return;
  const loanRef = doc(db, "loans", id);
  const loanSnap = await getDoc(loanRef);
  const loanData = loanSnap.exists() ? { id: loanSnap.id, ...loanSnap.data() } : null;

  await deleteDoc(loanRef);
  await addActivityLog(db, { 
    type: "loan_deletion", 
    description: `Loan ID ${id} deleted`,
    relatedId: id,
    undoData: loanData,
    undoable: !!loanData
  }, currentUser);
};

export const markLoanAsDefaulted = async (db, loanId, currentUser) => {
  if (!currentUser) return;
  await updateDoc(doc(db, "loans", loanId), {
    status: "Defaulted",
    updatedAt: serverTimestamp(),
  });
  await addActivityLog(db, { type: "loan_defaulted", description: `Loan ID ${loanId} marked as defaulted` }, currentUser);
};

export const refinanceLoan = async (db, oldLoanId, newStartDate, newDueDate, newPrincipalAmount, newInterestDuration, manualInterestRate, settings, currentUser) => {
  if (!currentUser) return;
  const oldLoanRef = doc(db, "loans", oldLoanId);
  let newLoanRefId = "";

  await runTransaction(db, async (transaction) => {
    const oldLoanSnap = await transaction.get(oldLoanRef);
    if (!oldLoanSnap.exists()) {
      throw new Error("Original loan not found for refinancing.");
    }

    const oldLoanData = oldLoanSnap.data();

    const monthKey = newStartDate ? dayjs(newStartDate).format('YYYY-MM') : dayjs().format('YYYY-MM');
    const monthlyRates = settings?.monthlySettings?.[monthKey]?.interestRates || settings.interestRates || { 1: 0.15, 2: 0.2, 3: 0.3, 4: 0.3 };

    const interestRate = (manualInterestRate !== undefined && manualInterestRate !== null)
      ? manualInterestRate
      : (monthlyRates[newInterestDuration] || 0);
    
    const newInterest = newPrincipalAmount * interestRate;
    const newTotalRepayable = newPrincipalAmount + newInterest;

    // Create new loan document
    const newLoanRef = doc(collection(db, "loans"));
    newLoanRefId = newLoanRef.id;

    const newLoan = {
      borrowerId: oldLoanData.borrowerId, // Keep same borrower
      principal: newPrincipalAmount,
      interest: newInterest,
      totalRepayable: newTotalRepayable,
      repaidAmount: 0,
      startDate: newStartDate,
      dueDate: newDueDate,
      interestDuration: newInterestDuration || null,
      manualInterestRate: manualInterestRate || null,
      status: "Active",
      refinancedFromId: oldLoanId, // Link to old loan
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    transaction.set(newLoanRef, newLoan);

    // Update old loan to mark as refinanced
    transaction.update(oldLoanRef, {
      status: "Refinanced",
      refinancedToId: newLoanRefId, // Link to new loan
      updatedAt: serverTimestamp(),
    });
  });

  await addActivityLog(db, {
    type: "loan_refinanced",
    description: `Loan ID ${oldLoanId} refinanced to new loan ID ${newLoanRefId}`,
    relatedId: newLoanRefId,
    oldLoanId: oldLoanId,
    undoable: true
  }, currentUser);
  return newLoanRefId;
};

export const topUpLoan = async (db, loanId, topUpAmount, currentUser) => {
  if (!currentUser) return;
  const loanRef = doc(db, "loans", loanId);
  let previousData = null;

  await runTransaction(db, async (transaction) => {
    const loanSnap = await transaction.get(loanRef);
    if (!loanSnap.exists()) {
      throw new Error("Loan not found for top-up.");
    }

    const loanData = loanSnap.data();
    previousData = loanData;
    const currentPrincipal = Number(loanData.principal || 0);
    const currentInterest = Number(loanData.interest || 0);

    // Calculate effective rate from existing loan to preserve the agreed rate
    const effectiveRate = currentPrincipal > 0 ? (currentInterest / currentPrincipal) : 0;

    const newPrincipal = currentPrincipal + topUpAmount;
    const newInterest = newPrincipal * effectiveRate;
    const newTotalRepayable = newPrincipal + newInterest;

    transaction.update(loanRef, {
      principal: newPrincipal,
      interest: newInterest,
      totalRepayable: newTotalRepayable,
      // Keep repaidAmount the same, as top-up is not a payment
      updatedAt: serverTimestamp(),
    });
  });

  await addActivityLog(db, {
    type: "loan_top_up",
    description: `Loan ID ${loanId} topped up by ZMW ${topUpAmount.toFixed(2)}`,
    relatedId: loanId,
    undoData: previousData,
    undoable: true
  }, currentUser);
};

export const undoLoanCreation = async (db, loanId, activityLogId, currentUser) => {
  if (!currentUser) return;
  if (!loanId || !activityLogId) throw new Error("Invalid ID provided for undoLoanCreation");
  await runTransaction(db, async (transaction) => {
    const loanRef = doc(db, "loans", loanId);
    const activityLogRef = doc(db, "activityLogs", activityLogId);

    transaction.delete(loanRef);
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "loan_creation_undo", description: `Undid creation of Loan ID ${loanId}` }, currentUser);
};

export const undoRefinanceLoan = async (db, newLoanId, oldLoanId, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const newLoanRef = doc(db, "loans", newLoanId);
    const oldLoanRef = doc(db, "loans", oldLoanId);
    const activityLogRef = doc(db, "activityLogs", activityLogId);

    // Get old loan to restore its status
    const oldLoanSnap = await transaction.get(oldLoanRef);
    const oldLoanData = oldLoanSnap.data();

    transaction.update(oldLoanRef, { status: oldLoanData.status === "Refinanced" ? "Active" : oldLoanData.status, refinancedToId: deleteField(), updatedAt: serverTimestamp() });
    transaction.delete(newLoanRef);
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "loan_refinance_undo", description: `Undid refinance of Loan ID ${oldLoanId}` }, currentUser);
};

export const undoTopUpLoan = async (db, loanId, previousLoanData, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const loanRef = doc(db, "loans", loanId);
    const activityLogRef = doc(db, "activityLogs", activityLogId);

    // Restore the loan to its pre-top-up state
    transaction.set(loanRef, { ...previousLoanData, updatedAt: serverTimestamp() });
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "loan_top_up_undo", description: `Undid top-up of Loan ID ${loanId}` }, currentUser);
};

export const undoDeleteLoan = async (db, loanData, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const loanRef = doc(db, "loans", loanData.id); 
    const activityLogRef = doc(db, "activityLogs", activityLogId);

    transaction.set(loanRef, { ...loanData, updatedAt: serverTimestamp() }); 
    transaction.delete(activityLogRef); 
  });
  await addActivityLog(db, { type: "loan_delete_undo", description: `Undid deletion of Loan ID ${loanData.id}` }, currentUser);
};

export const undoUpdateLoan = async (db, loanId, previousLoanData, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const loanRef = doc(db, "loans", loanId);
    const activityLogRef = doc(db, "activityLogs", activityLogId);

    // Restore the loan to its previous state
    transaction.set(loanRef, { ...previousLoanData, updatedAt: serverTimestamp() }); 
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "loan_update_undo", description: `Undid update of Loan ID ${loanId}` }, currentUser);
};
