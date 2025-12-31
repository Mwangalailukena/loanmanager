import React from 'react';
import useServiceWorker from '../hooks/useServiceWorker'; // Adjust path if needed

const UpdateToast = () => {
  const { showUpdatePrompt, handleUpdate } = useServiceWorker();

  if (!showUpdatePrompt) return null;

  return (
    <div style={toastStyle}>
      <p style={{ margin: 0 }}>A new version of the app is available!</p>
      <button onClick={handleUpdate} style={buttonStyle}>
        Refresh Now
      </button>
    </div>
  );
};

// Simple styles to make it float at the bottom
const toastStyle = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  backgroundColor: '#333',
  color: '#fff',
  padding: '15px 20px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  zIndex: 1000,
};

const buttonStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

export default UpdateToast;
