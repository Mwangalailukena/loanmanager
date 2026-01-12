import { addDoc, collection, serverTimestamp, updateDoc, doc, runTransaction } from "firebase/firestore";
import { addActivityLog } from "./activityService";

export const addBorrower = async (db, borrower, currentUser) => {
  const docRef = await addDoc(collection(db, "borrowers"), {
    ...borrower,
    userId: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addActivityLog(db, { 
    type: "borrower_creation", 
    description: `Borrower created: ${borrower.name}`,
    relatedId: docRef.id,
    undoable: true 
  }, currentUser);
  return docRef;
};

export const updateBorrower = async (db, id, updates) => {
  await updateDoc(doc(db, "borrowers", id), { ...updates, updatedAt: serverTimestamp() });
};

export const undoBorrowerCreation = async (db, borrowerId, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const borrowerRef = doc(db, "borrowers", borrowerId);
    const activityLogRef = doc(db, "activityLogs", activityLogId);
    transaction.delete(borrowerRef);
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "borrower_creation_undo", description: `Undid creation of Borrower ID ${borrowerId}` }, currentUser);
};
