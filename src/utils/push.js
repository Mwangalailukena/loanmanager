const applicationServerPublicKey = 'BObdjJvy5MmBnkfFv-_XbyWlI0mB12FnYJkBB4xuEx0Hpf\naNVulq2goHxGqiea2yAYLssoKQC3qjeqi9IqJ0SS4';

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

export function subscribeUser(updateUser) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(function(registration) {
      if (!registration.pushManager) {
        console.log('Push manager unavailable.');
        return;
      }

      registration.pushManager.getSubscription().then(function(existedSubscription) {
        if (existedSubscription === null) {
          console.log('No subscription detected, make a new one.');
          registration.pushManager.subscribe({
            applicationServerKey: urlB64ToUint8Array(applicationServerPublicKey),
            userVisibleOnly: true,
          }).then(function(newSubscription) {
            console.log('New subscription added.', newSubscription);
            updateUser({ pushSubscription: newSubscription });
          }).catch(function(e) {
            if (Notification.permission !== 'granted') {
              console.log('Permission was not granted.');
            } else {
              console.error('An error ocurred during the subscription process.', e);
            }
          });
        } else {
          console.log('Existed subscription detected.', existedSubscription);
        }
      });
    })
    .catch(function(e) {
      console.error('An error ocurred during Service Worker registration.', e);
    });
  }
}
