const functions = require("firebase-functions");
const admin = require("firebase-admin");
const webpush = require("web-push");

admin.initializeApp();

const db = admin.firestore();

// It's recommended to store VAPID keys as environment variables
// For this example, we'll require them from a file
const vapidKeys = require("./vapid-keys.json");

webpush.setVapidDetails(
  "mailto:ilukenamwangala@gmail.com", // Replace with your email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  const { userId, payload } = data;

  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  if (!userId || !payload) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with two arguments, 'userId' and 'payload'."
    );
  }

  const subscriptions = await db
    .collection("subscriptions")
    .where("userId", "==", userId)
    .get();

  const promises = [];
  subscriptions.forEach(subscription => {
    const pushSubscription = subscription.data();
    promises.push(
      webpush
        .sendNotification(pushSubscription, JSON.stringify(payload))
        .catch(error => {
          console.error("Error sending notification:", error);
          // Optional: Remove invalid subscription from the database
          if (error.statusCode === 410 || error.statusCode === 404) {
            return subscription.ref.delete();
          }
        })
    );
  });

  await Promise.all(promises);

  return { success: true };
});
