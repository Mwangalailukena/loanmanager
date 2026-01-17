const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
const db = admin.firestore();

// Securely initialize Generative AI with Secret Manager
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });


/**
 * Sends a push notification to all devices registered to a specific user.
 * This function is callable from a client application.
 *
 * @param {object} data - The data passed to the function.
 * @param {string} data.userId - The ID of the user to send the notification to.
 * @param {object} data.notification - The notification payload.
 * @param {string} data.notification.title - The title of the notification.
 * @param {string} data.notification.body - The body of the notification.
 * @param {string} data.url - The URL to open when the notification is clicked.
 * @param {object} context - The context of the function call.
 * @returns {Promise<object>} A promise that resolves with the result of the send operation.
 */
exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { userId, notification, url } = data;

  if (!userId || !notification || !notification.title || !notification.body) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with 'userId', 'notification.title', and 'notification.body'."
    );
  }

  // Get all FCM tokens for the target userId
  const tokensSnapshot = await db
    .collection("fcmTokens")
    .where("userId", "==", userId)
    .get();

  if (tokensSnapshot.empty) {
    console.log(`No FCM tokens found for user ${userId}.`);
    return { success: false, error: "No tokens found for user." };
  }

  const tokens = tokensSnapshot.docs.map(doc => doc.id);

  // Construct the FCM message payload
  const payload = {
    notification: {
      title: notification.title,
      body: notification.body,
      icon: '/logo192.png',
    },
    data: {
      url: url || '/', // Default to the root URL if not provided
    }
  };

  try {
    // Use sendToDevice for robust delivery and response handling
    const response = await admin.messaging().sendToDevice(tokens, payload);
    console.log(`Successfully sent message to ${response.successCount} devices.`);

    // --- Clean up invalid or unregistered tokens ---
    const tokensToRemove = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error(`Failure sending notification to ${tokens[index]}`, error);
        // Cleanup tokens that are no longer registered with FCM
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          tokensToRemove.push(db.collection('fcmTokens').doc(tokens[index]).delete());
        }
      }
    });

    if (tokensToRemove.length > 0) {
      await Promise.all(tokensToRemove);
      console.log(`Removed ${tokensToRemove.length} invalid FCM tokens.`);
    }

    return { success: true, successCount: response.successCount, failureCount: response.failureCount };

  } catch (error) {
    console.error("Error sending FCM message:", error);
    throw new functions.https.HttpsError("internal", "Failed to send notification.", error.message);
  }
});


// HTTPS Callable function for AI-powered monthly projection (Preserved)
exports.getMonthlyProjectionAI = functions.runWith({ secrets: ["GEMINI_API_KEY"] }).https.onCall(async (data, context) => {
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

    const prompt = `You are an AI assistant specialized in financial projections for micro-lending.
    Given the following historical monthly data, project the 'projectedRevenue', 'projectedPayments', and 'projectedNewLoans' for the month of ${targetMonth}/${targetYear}.
    Focus on plausible and realistic projections based on the trends and patterns in the provided data.
    
    Historical Data (last 24 months, month-wise):
    ${JSON.stringify(historicalData, null, 2)}
    
    Provide your projection in a JSON object format with the keys 'projectedRevenue', 'projectedPayments', and 'projectedNewLoans'.
    Example: { "projectedRevenue": 123456.78, "projectedPayments": 98765.43, "projectedNewLoans": 50000.00 }
    Do not include any other text, explanation, or markdown like \`\`\`json ... \`\`\` outside the JSON object. Just the raw JSON.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();
        console.log("Raw AI Response from Gemini:", rawText); // Log for debugging

        // Robustly find and parse the JSON part of the response
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No valid JSON object found in the AI's response.");
        }

        const jsonString = jsonMatch[0];
        const projection = JSON.parse(jsonString);

        if (
            typeof projection.projectedRevenue !== 'number' ||
            typeof projection.projectedPayments !== 'number' ||
            typeof projection.projectedNewLoans !== 'number'
        ) {
            throw new Error("AI response JSON is missing required numeric fields.");
        }

        return projection;
    } catch (error) {
        console.error("Error processing AI projection:", error);
        // Provide a generic but informative error to the client
        throw new functions.https.HttpsError("internal", "Failed to get projection from AI. Check function logs for details.");
    }
});

// Scheduled function to check for loan reminders (Runs every morning at 8:00 AM)
exports.checkLoanReminders = functions.pubsub.schedule('0 8 * * *').onRun(async (context) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // "YYYY-MM-DD"
  
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split('T')[0];

  const loansRef = db.collection('loans');
  const notificationPromises = [];

  // 1. Overdue loans check (dueDate < todayStr)
  const overdueLoansSnapshot = await loansRef
    .where('status', '==', 'Active')
    .where('dueDate', '<', todayStr)
    .get();

  overdueLoansSnapshot.forEach(doc => {
    const loan = doc.data();
    const outstanding = (loan.totalRepayable || 0) - (loan.repaidAmount || 0);
    
    if (outstanding > 0) {
      const payload = {
        notification: {
          title: '🚨 Overdue Loan Alert',
          body: `Loan for ${loan.borrower || 'a borrower'} is overdue! Balance: ZMW ${outstanding.toLocaleString()}`,
        },
        data: { 
          url: `/borrowers/${loan.borrowerId}`,
          loanId: doc.id 
        }
      };
      notificationPromises.push(sendNotificationToUser(loan.userId, payload, 'overdue'));
    }
  });
  
  // 2. Upcoming payments check (todayStr <= dueDate <= sevenDaysFromNowStr)
  const upcomingLoansSnapshot = await loansRef
    .where('status', '==', 'Active')
    .where('dueDate', '>=', todayStr)
    .where('dueDate', '<=', sevenDaysFromNowStr)
    .get();

  upcomingLoansSnapshot.forEach(doc => {
    const loan = doc.data();
    const outstanding = (loan.totalRepayable || 0) - (loan.repaidAmount || 0);

    if (outstanding > 0) {
      const payload = {
        notification: {
          title: '📅 Upcoming Payment Reminder',
          body: `Loan for ${loan.borrower || 'a borrower'} is due on ${loan.dueDate}. Balance: ZMW ${outstanding.toLocaleString()}`,
        },
        data: { 
          url: `/borrowers/${loan.borrowerId}`,
          loanId: doc.id 
        }
      };
      notificationPromises.push(sendNotificationToUser(loan.userId, payload, 'upcoming'));
    }
  });

  await Promise.all(notificationPromises);
  console.log(`Loan reminder check complete. Processed ${notificationPromises.length} notifications.`);
  return null;
});

async function sendNotificationToUser(userId, payload, type) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const prefs = userData.notificationPreferences || { overdue: true, upcoming: true };
    
    // Check if user has disabled this specific type of notification
    if (type === 'overdue' && prefs.overdue === false) return;
    if (type === 'upcoming' && prefs.upcoming === false) return;

    const tokensSnapshot = await db.collection("fcmTokens").where("userId", "==", userId).get();
    if (tokensSnapshot.empty) {
      console.log(`No FCM tokens for user ${userId}`);
      return;
    }

    const tokens = tokensSnapshot.docs.map(doc => doc.id);
    
    // Using sendToDevice (Legacy but robust for multiple tokens) 
    // or admin.messaging().sendEachForMulticast(message) for V1
    const response = await admin.messaging().sendToDevice(tokens, payload);

    // Clean up invalid tokens
    const tokensToRemove = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error && (
        error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered'
      )) {
        tokensToRemove.push(db.collection('fcmTokens').doc(tokens[index]).delete());
      }
    });
    
    if (tokensToRemove.length > 0) {
      await Promise.all(tokensToRemove);
    }
  } catch (err) {
    console.error(`Error sending notification to user ${userId}:`, err);
  }
}