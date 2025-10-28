const functions = require("firebase-functions");
const admin = require("firebase-admin");
const webpush = require("web-push");

admin.initializeApp();

const db = admin.firestore();
const sendPushNotificationCallable = admin.app().functions().httpsCallable('sendPushNotification');

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

exports.checkLoanReminders = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  const loansRef = db.collection('loans');

  // 1. Check for overdue loans
  const overdueLoansSnapshot = await loansRef
    .where('dueDate', '<', now)
    .where('status', '==', 'Active') // Only consider active loans
    .get();

  const notificationsToSend = [];

  for (const loanDoc of overdueLoansSnapshot.docs) {
    const loan = loanDoc.data();
    const userId = loan.userId;

    // Fetch user's notification preferences
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.notificationPreferences && userData.notificationPreferences.overdue) {
        notificationsToSend.push({
          userId: userId,
          payload: {
            title: 'Overdue Loan Alert',
            body: `Loan for ${loan.borrowerName || 'a borrower'} is overdue! Amount: ${loan.totalRepayable - (loan.repaidAmount || 0)}`,
          },
        });
      }
    }
  }

  // Send all collected notifications
  for (const notification of notificationsToSend) {
    try {
      await sendPushNotificationCallable(notification);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  console.log('Overdue loan reminders checked and sent.');

  // 2. Check for upcoming payments
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowTimestamp = admin.firestore.Timestamp.fromDate(sevenDaysFromNow);

  const upcomingLoansSnapshot = await loansRef
    .where('dueDate', '>', now)
    .where('dueDate', '<=', sevenDaysFromNowTimestamp)
    .where('status', '==', 'Active')
    .get();

  for (const loanDoc of upcomingLoansSnapshot.docs) {
    const loan = loanDoc.data();
    const userId = loan.userId;

    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.notificationPreferences && userData.notificationPreferences.upcoming) {
        notificationsToSend.push({
          userId: userId,
          payload: {
            title: 'Upcoming Payment Reminder',
            body: `Your loan for ${loan.borrowerName || 'a borrower'} is due soon on ${loan.dueDate.toDate().toLocaleDateString()}.`,
          },
        });
      }
    }
  }

  // Send all collected notifications (including upcoming ones)
  for (const notification of notificationsToSend) {
    try {
      await sendPushNotificationCallable(notification);
    } catch (error) {
      console.error('Error sending upcoming payment notification:', error);
    }
  }

  console.log('Upcoming payment reminders checked and sent.');
  return null;
});
