import React, { createContext, useContext, useState, forwardRef } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const SnackbarContext = createContext(null);

const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export const SnackbarProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info'); // success, info, warning, error
  const [action, setAction] = useState(null);
  const [onCloseCallback, setOnCloseCallback] = useState(null);

  const showSnackbar = (msg, type = 'info', actionComponent = null, callback = null) => {
    setMessage(msg);
    setSeverity(type);
    setAction(actionComponent);
    setOnCloseCallback(() => callback);
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    if (onCloseCallback) {
      onCloseCallback();
    }
  };

  return (
    <SnackbarContext.Provider value={showSnackbar}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={5000} // Default duration for snackbars
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%', backgroundColor: 'rgba(0, 0, 0, 0.85)' }} action={action}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  return useContext(SnackbarContext);
};
