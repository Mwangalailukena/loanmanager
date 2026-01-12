import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";

export const addActivityLog = async (db, logEntry, currentUser) => {
  if (!currentUser) return;
  await addDoc(collection(db, "activityLogs"), {
    ...logEntry,
    userId: currentUser.uid,
    user: currentUser?.displayName || currentUser?.email || "System",
    createdAt: serverTimestamp(),
  });
};

export const updateActivityLog = async (db, id, updates, currentUser) => {
  if (!currentUser) return;
  await updateDoc(doc(db, "activityLogs", id), { ...updates, updatedAt: serverTimestamp() });
};
