const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const functions = require("firebase-functions"); // Keep for legacy if needed, but we'll migrate triggers
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
const db = admin.firestore();

// Securely initialize Generative AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;


/**
 * Sends a push notification to all devices registered to a specific user.
 */
exports.sendPushNotification = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { userId, notification, url } = request.data;

  if (!userId || !notification || !notification.title || !notification.body) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields."
    );
  }

  // Get all FCM tokens for the target userId
  const tokensSnapshot = await db
    .collection("fcmTokens")
    .where("userId", "==", userId)
    .get();

  if (tokensSnapshot.empty) {
    return { success: false, error: "No tokens found for user." };
  }

  const tokens = tokensSnapshot.docs.map(doc => doc.id);

  const payload = {
    notification: {
      title: notification.title,
      body: notification.body,
      icon: '/logo192.png',
    },
    data: {
      url: url || '/',
    }
  };

  try {
    const response = await admin.messaging().sendToDevice(tokens, payload);
    
    const tokensToRemove = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error && (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered')) {
        tokensToRemove.push(db.collection('fcmTokens').doc(tokens[index]).delete());
      }
    });

    if (tokensToRemove.length > 0) {
      await Promise.all(tokensToRemove);
    }

    return { success: true, successCount: response.successCount };
  } catch (error) {
    console.error("Error sending FCM message:", error);
    throw new HttpsError("internal", "Failed to send notification.");
  }
});


// HTTPS Callable function for AI-powered monthly projection
exports.getMonthlyProjectionAI = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const { historicalData, targetMonth, targetYear } = request.data;

    if (!historicalData || !targetMonth || !targetYear) {
        throw new HttpsError("invalid-argument", "Missing required data.");
    }

    if (!model) {
        throw new HttpsError("failed-precondition", "AI model not initialized. Check GEMINI_API_KEY.");
    }

    const prompt = `You are an AI assistant specialized in financial projections for micro-lending.
    Given the following historical monthly data, project the 'projectedRevenue', 'projectedPayments', and 'projectedNewLoans' for the month of ${targetMonth}/${targetYear}.
    
    Historical Data:
    ${JSON.stringify(historicalData, null, 2)}
    
    Provide your projection in a JSON object format with the keys 'projectedRevenue', 'projectedPayments', and 'projectedNewLoans'.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No valid JSON found.");
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("Error processing AI projection:", error);
        throw new HttpsError("internal", "AI projection failed.");
    }
});

// Scheduled function to check for loan reminders (Runs every morning at 8:00 AM)
exports.checkLoanReminders = onSchedule('0 8 * * *', async (event) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; 
  
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split('T')[0];

  const loansRef = db.collection('loans');
  const notificationPromises = [];

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
});

async function sendNotificationToUser(userId, payload, type) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const prefs = userData.notificationPreferences || { overdue: true, upcoming: true };
    
    if (type === 'overdue' && prefs.overdue === false) return;
    if (type === 'upcoming' && prefs.upcoming === false) return;

    const tokensSnapshot = await db.collection("fcmTokens").where("userId", "==", userId).get();
    if (tokensSnapshot.empty) return;

    const tokens = tokensSnapshot.docs.map(doc => doc.id);
    const response = await admin.messaging().sendToDevice(tokens, payload);

    const tokensToRemove = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error && (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered')) {
        tokensToRemove.push(db.collection('fcmTokens').doc(tokens[index]).delete());
      }
    });
    
    if (tokensToRemove.length > 0) await Promise.all(tokensToRemove);
  } catch (err) {
    console.error(`Error sending notification to user ${userId}:`, err);
  }
}

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