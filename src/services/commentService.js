import { addDoc, collection, serverTimestamp, doc, deleteDoc, getDoc, runTransaction } from "firebase/firestore";
import { addActivityLog } from "./activityService";

export const addComment = async (db, comment, currentUser) => {
  if (!currentUser) return;
  const docRef = await addDoc(collection(db, "comments"), {
    ...comment,
    userId: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addActivityLog(db, { 
    type: "comment_creation", 
    description: `Comment added by ${currentUser?.displayName || currentUser?.email}`,
    relatedId: docRef.id,
    undoable: true
  }, currentUser);
  return docRef.id;
};

export const deleteComment = async (db, id, currentUser) => {
  if (!currentUser) return;
  const commentRef = doc(db, "comments", id);
  const commentSnap = await getDoc(commentRef);
  const commentData = commentSnap.exists() ? { id: commentSnap.id, ...commentSnap.data() } : null;

  await deleteDoc(commentRef);
  await addActivityLog(db, { 
    type: "comment_deletion", 
    description: `Comment ID ${id} deleted`,
    relatedId: id,
    undoData: commentData,
    undoable: !!commentData
  }, currentUser);
};

export const undoCommentCreation = async (db, commentId, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const commentRef = doc(db, "comments", commentId);
    const activityLogRef = doc(db, "activityLogs", activityLogId);
    transaction.delete(commentRef);
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "comment_creation_undo", description: `Undid creation of Comment ID ${commentId}` }, currentUser);
};

export const undoCommentDeletion = async (db, commentData, activityLogId, currentUser) => {
  if (!currentUser) return;
  await runTransaction(db, async (transaction) => {
    const commentRef = doc(db, "comments", commentData.id);
    const activityLogRef = doc(db, "activityLogs", activityLogId);
    transaction.set(commentRef, { ...commentData, updatedAt: serverTimestamp() });
    transaction.delete(activityLogRef);
  });
  await addActivityLog(db, { type: "comment_delete_undo", description: `Undid deletion of Comment ID ${commentData.id}` }, currentUser);
};
