import { db } from '../firebase';
import { collection, addDoc } from "firebase/firestore";

function urlBase64ToUint8Array(base64String) {
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

async function subscribeToPushNotifications() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('BI_whRaaTbUsVYKtk7i7uepn-9xfNiUs0XcfgKdcS607ExUxMcle_CMreOK2I0zx-AHx2i7F2jCDuRcRH0NcCLU'),
    });

    // TODO: Send the subscription object to your server
    console.log('Push subscription:', subscription);
    const subscriptionObject = JSON.parse(JSON.stringify(subscription));
    try {
      const docRef = await addDoc(collection(db, "subscriptions"), subscriptionObject);
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
}

export async function requestNotificationPermission() {
  const permission = await window.Notification.requestPermission();
  if (permission === 'granted') {
    await subscribeToPushNotifications();
  }
}
