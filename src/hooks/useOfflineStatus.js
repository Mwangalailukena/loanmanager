// src/hooks/useOfflineStatus.js
import { useState, useEffect, useRef } from 'react'; // Import useRef for the timeout ID

export default function useOfflineStatus(debounceTime = 1000) { // Added debounceTime parameter with a default of 1000ms (1 second)
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [debouncedIsOnline, setDebouncedIsOnline] = useState(navigator.onLine); // New state for the debounced value
  const timeoutRef = useRef(null); // Ref to store the timeout ID

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners when component unmounts
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // This effect debounces the 'isOnline' state
  useEffect(() => {
    // Clear any existing timeout to restart the debounce timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedIsOnline(isOnline); // Update the debounced state after the debounceTime
    }, debounceTime);

    // Cleanup function: clear the timeout if the component unmounts or if 'isOnline' changes again
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOnline, debounceTime]); // This effect re-runs whenever 'isOnline' or 'debounceTime' changes

  return debouncedIsOnline; // Return the debounced value, which will be more stable
}
