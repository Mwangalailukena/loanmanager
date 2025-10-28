const webpush = require('web-push');
const admin = require('firebase-admin');
const serviceAccount = require('./ilukenas-loan-management-firebase-adminsdk-4c23k-6a8d82e2d1.json'); // You need to download this file from your Firebase project settings

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ilukenas-loan-management.firebaseio.com'
});

const vapidKeys = require('./vapid-keys.json');

webpush.setVapidDetails(
  'mailto:ilukenamwangala@gmail.com', // Replace with your email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const db = admin.firestore();

async function sendNotificationToUser(userId, payload) {
  const subscriptions = await db.collection('subscriptions').where('userId', '==', userId).get();
  subscriptions.forEach(subscription => {
    const pushSubscription = subscription.data();
    webpush.sendNotification(pushSubscription, JSON.stringify(payload)).catch(error => {
      console.error(error.stack);
    });
  });
}

async function sendPushNotifications() {
  const subscriptions = await db.collection('subscriptions').get();
  subscriptions.forEach(subscription => {
    const pushSubscription = subscription.data();
    const payload = JSON.stringify({
      title: 'New Loan Added',
      body: 'A new loan has been added to your account.'
    });
    webpush.sendNotification(pushSubscription, payload).catch(error => {
      console.error(error.stack);
    });
  });
}

// We will not call this function directly anymore, but we'll keep it for reference
// sendPushNotifications();

module.exports = {
  sendNotificationToUser
};
