import { db } from '../firebase';
import { collection, addDoc } from "firebase/firestore";

const applicationServerPublicKey = 'BGoMcbksB6mlFLTR_lYlUr8vtAH4LdC024cLaDXpzu1Ogsec_iLoR8CEzpEhp8XtlL5-HQW-YtelKYcoLfX8ZTQ';

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function saveSubscription(subscription) {
  const subscriptionObject = JSON.parse(JSON.stringify(subscription));
  try {
    const docRef = await addDoc(collection(db, "subscriptions"), subscriptionObject);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export async function subscribeUserToPushNotifications() {
  const permission = await window.Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Permission was not granted.');
    return;
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.pushManager) {
        console.log('Push manager unavailable.');
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (subscription === null) {
        console.log('No subscription detected, make a new one.');
        subscription = await registration.pushManager.subscribe({
          applicationServerKey: urlB64ToUint8Array(applicationServerPublicKey),
          userVisibleOnly: true,
        });
        console.log('New subscription added.', subscription);
        await saveSubscription(subscription);
      } else {
        console.log('Existed subscription detected.', subscription);
      }
    } catch (e) {
      console.error('An error occurred during the subscription process.', e);
    }
  }
}