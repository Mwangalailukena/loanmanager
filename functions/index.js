const functions = require("firebase-functions");
const admin = require("firebase-admin");
const webpush = require("web-push");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

const db = admin.firestore();

// Use admin.functions() for Callable functions with updated SDK
const sendPushNotificationCallable = admin.functions().httpsCallable('sendPushNotification');

// It's recommended to store VAPID keys as environment variables
const vapidKeys = require("./vapid-keys.json");

webpush.setVapidDetails(
  "mailto:ilukenamwangala@gmail.com", // Replace with your email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// NEW: Initialize Google Generative AI
// IMPORTANT: Replace 'YOUR_GEMINI_API_KEY' with your actual API key.
// For production, use Firebase Environment Configuration (functions.config().gemini.api_key)
// or Firebase Secret Manager (functions.runWith({secrets: ["GEMINI_API_KEY"]}).https.onCall)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY"; // Ensure this is set securely
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });


// HTTPS Callable function to send push notifications
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

// HTTPS Callable function for AI-powered monthly projection
exports.getMonthlyProjectionAI = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const { historicalData, targetMonth, targetYear } = data;

    if (!historicalData || !targetMonth || !targetYear) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Missing historicalData, targetMonth, or targetYear."
        );
    }

    // Construct a prompt for the AI model
    const prompt = `You are an AI assistant specialized in financial projections for micro-lending.
    Given the following historical monthly data, project the 'projectedRevenue', 'projectedPayments', and 'projectedNewLoans' for the month of ${targetMonth}/${targetYear}.
    Focus on plausible and realistic projections based on the trends and patterns in the provided data.
    
    Historical Data (last 24 months, month-wise):
    ${JSON.stringify(historicalData, null, 2)}
    
    Provide your projection in a JSON object format with the keys 'projectedRevenue', 'projectedPayments', and 'projectedNewLoans'.
    Example: { "projectedRevenue": 123456.78, "projectedPayments": 98765.43, "projectedNewLoans": 50000.00 }
    Do not include any other text or explanation outside the JSON object.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Attempt to parse the JSON response
        const projection = JSON.parse(text);

        // Basic validation of the AI's response structure
        if (
            typeof projection.projectedRevenue !== 'number' ||
            typeof projection.projectedPayments !== 'number' ||
            typeof projection.projectedNewLoans !== 'number'
        ) {
            throw new functions.https.HttpsError(
                "internal",
                "AI response did not contain expected number formats for projections."
            );
        }

        return projection;
    } catch (error) {
        console.error("Error calling Gemini API for projection:", error);
        if (error instanceof SyntaxError) {
            console.error("AI response was not valid JSON:", error.message, "Raw AI Text:", text);
        }
        throw new functions.https.HttpsError(
            "internal",
            "Failed to get projection from AI.",
            error.message
        );
    }
});

// Scheduled function to check for loan reminders
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
      const subscriptions = await db
        .collection("subscriptions")
        .where("userId", "==", notification.userId)
        .get();

      const pushPromises = [];
      subscriptions.forEach(subscription => {
        const pushSubscription = subscription.data();
        pushPromises.push(
          webpush
            .sendNotification(pushSubscription, JSON.stringify(notification.payload))
            .catch(error => {
              console.error("Error sending notification:", error);
              if (error.statusCode === 410 || error.statusCode === 404) {
                return subscription.ref.delete();
              }
            })
        );
      });
      await Promise.all(pushPromises);
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
      const subscriptions = await db
        .collection("subscriptions")
        .where("userId", "==", notification.userId)
        .get();

      const pushPromises = [];
      subscriptions.forEach(subscription => {
        const pushSubscription = subscription.data();
        pushPromises.push(
          webpush
            .sendNotification(pushSubscription, JSON.stringify(notification.payload))
            .catch(error => {
              console.error("Error sending notification:", error);
              if (error.statusCode === 410 || error.statusCode === 404) {
                return subscription.ref.delete();
              }
            })
        );
      });
      await Promise.all(pushPromises);
    } catch (error) {
      console.error('Error sending upcoming payment notification:', error);
    }
  }

  console.log('Upcoming payment reminders checked and sent.');
  return null;
});