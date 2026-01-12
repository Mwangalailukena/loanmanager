import { addDoc, collection, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, runTransaction } from "firebase/firestore";
import { addActivityLog } from "./activityService";

export const addGuarantor = async (db, guarantor, currentUser) => {
  if (!currentUser) return;
  const docRef = await addDoc(collection(db, "guarantors"), {
    ...guarantor,
    userId: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addActivityLog(db, { 
    type: "guarantor_creation", 
    description: `Guarantor added: ${guarantor.name}`,
    relatedId: docRef.id,
    undoable: true
  }, currentUser);
  return docRef.id;
};

export const updateGuarantor = async (db, id, updates, currentUser) => {
  if (!currentUser) return;
  await updateDoc(doc(db, "guarantors", id), { ...updates, updatedAt: serverTimestamp() });
  await addActivityLog(db, { type: "guarantor_update", description: `Guarantor ID ${id} updated` }, currentUser);
};

export const deleteGuarantor = async (db, id, currentUser) => {
  if (!currentUser) return;
  const guarantorRef = doc(db, "guarantors", id);
  const guarantorSnap = await getDoc(guarantorRef);
  const guarantorData = guarantorSnap.exists() ? { id: guarantorSnap.id, ...guarantorSnap.data() } : null;

  await deleteDoc(guarantorRef);
  await addActivityLog(db, { 
    type: "guarantor_deletion", 
    description: `Guarantor ID ${id} deleted`,
    relatedId: id,
    undoData: guarantorData,
    undoable: !!guarantorData
  }, currentUser);
};

export const undoGuarantorCreation = async (db, guarantorId, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const guarantorRef = doc(db, "guarantors", guarantorId);
    const activityLogRef = doc(db, "activityLogs", activityLogId);
    transaction.delete(guarantorRef);
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "guarantor_creation_undo", description: `Undid creation of Guarantor ID ${guarantorId}` }, currentUser);
};

export const undoGuarantorDeletion = async (db, guarantorData, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const guarantorRef = doc(db, "guarantors", guarantorData.id);
    const activityLogRef = doc(db, "activityLogs", activityLogId);
    transaction.set(guarantorRef, { ...guarantorData, updatedAt: serverTimestamp() });
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "guarantor_delete_undo", description: `Undid deletion of Guarantor ID ${guarantorData.id}` }, currentUser);
};
