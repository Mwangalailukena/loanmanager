const functions = require("firebase-functions");
const admin = require("firebase-admin");
// const webpush = require("web-push"); // No longer needed for FCM
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

const db = admin.firestore();

// No longer needed as the client will directly call 'sendPushNotification'
// const sendPushNotificationCallable = admin.functions().httpsCallable('sendPushNotification');

// No longer needed for FCM, as FCM handles push subscription details
// const vapidKeys = require("./vapid-keys.json");
// webpush.setVapidDetails(
//   "mailto:ilukenamwangala@gmail.com", // Replace with your email
//   vapidKeys.publicKey,
//   vapidKeys.privateKey
// );

// NEW: Initialize Google Generative AI
// IMPORTANT: Replace 'YOUR_GEMINI_API_KEY' with your actual API key.
// For production, use Firebase Environment Configuration (functions.config().gemini.api_key)
// or Firebase Secret Manager (functions.runWith({secrets: ["GEMINI_API_KEY"]}).https.onCall)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY"; // Ensure this is set securely
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });


// HTTPS Callable function to send push notifications using FCM
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
  );
  }

  // Get all FCM tokens for the target userId from Firestore
  const fcmTokensSnapshot = await db
    .collection("fcmTokens")
    .where("userId", "==", userId)
    .get();

  const tokens = fcmTokensSnapshot.docs.map(doc => doc.id); // doc.id is the token itself

  if (tokens.length === 0) {
    console.log(`No FCM tokens found for user ${userId}.`);
    return { success: false, message: "No tokens found." };
  }

  // Construct the FCM message
  const message = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    webpush: {
      headers: {
        Urgency: 'high',
      },
      notification: {
        icon: payload.icon || '/logo192.png', // Fallback icon
      },
    },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log('Successfully sent message:', response);

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const tokensToRemove = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send message to token ${tokens[idx]}: ${resp.error}`);
          // Delete the token from Firestore if it's no longer valid
          if (resp.error && resp.error.code === 'messaging/invalid-registration-token' ||
              resp.error.code === 'messaging/registration-token-not-registered') {
            tokensToRemove.push(db.collection('fcmTokens').doc(tokens[idx]).delete());
          }
        }
      });
      await Promise.all(tokensToRemove);
      console.log(`Removed ${tokensToRemove.length} invalid FCM tokens.`);
    }

    return { success: true, response: response };
  } catch (error) {
    console.error("Error sending FCM message:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to send FCM message.",
      error.message
    );
  }
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
      // Use the new FCM-based sendPushNotification logic
      // Note: The sendPushNotification Callable is designed to be called from the client.
      // For server-to-server sending, directly use admin.messaging()
      const message = {
        notification: {
          title: notification.payload.title,
          body: notification.payload.body,
        },
        webpush: {
          headers: {
            Urgency: 'high',
          },
          notification: {
            icon: notification.payload.icon || '/logo192.png',
          },
        },
      };

      const fcmTokensSnapshot = await db
        .collection("fcmTokens")
        .where("userId", "==", notification.userId)
        .get();

      const tokens = fcmTokensSnapshot.docs.map(doc => doc.id);

      if (tokens.length > 0) {
        const response = await admin.messaging().sendEachForMulticast({ ...message, tokens: tokens });
        console.log(`Successfully sent message to user ${notification.userId}:`, response);

        if (response.failureCount > 0) {
          const tokensToRemove = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.error(`Failed to send message to token ${tokens[idx]}: ${resp.error}`);
              if (resp.error && resp.error.code === 'messaging/invalid-registration-token' ||
                  resp.error.code === 'messaging/registration-token-not-registered') {
                tokensToRemove.push(db.collection('fcmTokens').doc(tokens[idx]).delete());
              }
            }
          });
          await Promise.all(tokensToRemove);
          console.log(`Removed ${tokensToRemove.length} invalid FCM tokens for user ${notification.userId}.`);
        }
      } else {
        console.log(`No FCM tokens found for user ${notification.userId} for reminders.`);
      }

    } catch (error) {
      console.error('Error sending reminder notification:', error);
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
      const message = {
        notification: {
          title: notification.payload.title,
          body: notification.payload.body,
        },
        webpush: {
          headers: {
            Urgency: 'high',
          },
          notification: {
            icon: notification.payload.icon || '/logo192.png',
          },
        },
      };

      const fcmTokensSnapshot = await db
        .collection("fcmTokens")
        .where("userId", "==", notification.userId)
        .get();

      const tokens = fcmTokensSnapshot.docs.map(doc => doc.id);

      if (tokens.length > 0) {
        const response = await admin.messaging().sendEachForMulticast({ ...message, tokens: tokens });
        console.log(`Successfully sent message to user ${notification.userId}:`, response);

        if (response.failureCount > 0) {
          const tokensToRemove = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.error(`Failed to send message to token ${tokens[idx]}: ${resp.error}`);
              if (resp.error && resp.error.code === 'messaging/invalid-registration-token' ||
                  resp.error.code === 'messaging/registration-token-not-registered') {
                tokensToRemove.push(db.collection('fcmTokens').doc(tokens[idx]).delete());
              }
            }
          });
          await Promise.all(tokensToRemove);
          console.log(`Removed ${tokensToRemove.length} invalid FCM tokens for user ${notification.userId}.`);
        }
      } else {
        console.log(`No FCM tokens found for user ${notification.userId} for upcoming payment reminders.`);
      }
    } catch (error) {
      console.error('Error sending upcoming payment notification:', error);
    }
  }

  console.log('Upcoming payment reminders checked and sent.');
  return null;
});