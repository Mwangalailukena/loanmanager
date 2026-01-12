import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { addActivityLog } from "./activityService";

export const updateUser = async (db, updates, currentUser) => { 
  if (!currentUser) return;
  const userRef = doc(db, "users", currentUser.uid); 
  await updateDoc(userRef, { ...updates, updatedAt: serverTimestamp() });
  await addActivityLog(db, { type: "user_profile_update", description: `User profile updated for ${currentUser.email}` }, currentUser);
};
