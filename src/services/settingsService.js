import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { addActivityLog } from "./activityService";

export const updateSettings = async (db, newSettings, currentUser) => {
  if (!currentUser) return;
  await updateDoc(doc(db, "settings", "config"), {
    ...newSettings,
    updatedAt: serverTimestamp(),
    userId: currentUser.uid,
  });
  await addActivityLog(db, { type: "settings_update", description: "Application settings updated" }, currentUser);
};
