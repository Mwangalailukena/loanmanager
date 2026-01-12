import { addDoc, collection, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, runTransaction } from "firebase/firestore";
import { addActivityLog } from "./activityService";

export const addExpense = async (db, expense, currentUser) => {
  if (!currentUser) return;
  const docRef = await addDoc(collection(db, "expenses"), {
    ...expense,
    userId: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addActivityLog(db, { 
    type: "expense_creation", 
    description: `Expense added: ${expense.description}`,
    relatedId: docRef.id,
    undoable: true
  }, currentUser);
  return docRef.id;
};

export const updateExpense = async (db, id, updates, currentUser) => {
  if (!currentUser) return;
  await updateDoc(doc(db, "expenses", id), { ...updates, updatedAt: serverTimestamp() });
  await addActivityLog(db, { type: "expense_update", description: `Expense ID ${id} updated` }, currentUser);
};

export const deleteExpense = async (db, id, currentUser) => {
  if (!currentUser) return;
  const expenseRef = doc(db, "expenses", id);
  const expenseSnap = await getDoc(expenseRef);
  const expenseData = expenseSnap.exists() ? { id: expenseSnap.id, ...expenseSnap.data() } : null;

  await deleteDoc(expenseRef);
  await addActivityLog(db, { 
    type: "expense_deletion", 
    description: `Expense ID ${id} deleted`,
    relatedId: id,
    undoData: expenseData,
    undoable: !!expenseData
  }, currentUser);
};

export const undoExpenseCreation = async (db, expenseId, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const expenseRef = doc(db, "expenses", expenseId);
    const activityLogRef = doc(db, "activityLogs", activityLogId);
    transaction.delete(expenseRef);
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "expense_creation_undo", description: `Undid creation of Expense ID ${expenseId}` }, currentUser);
};

export const undoExpenseDeletion = async (db, expenseData, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const expenseRef = doc(db, "expenses", expenseData.id);
    const activityLogRef = doc(db, "activityLogs", activityLogId);
    transaction.set(expenseRef, { ...expenseData, updatedAt: serverTimestamp() });
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "expense_delete_undo", description: `Undid deletion of Expense ID ${expenseData.id}` }, currentUser);
};
