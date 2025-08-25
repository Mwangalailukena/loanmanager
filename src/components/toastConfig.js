// src/toastConfig.js

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/toastStyles.css"; // Ensure this path is correct

export const showSnackbar = (message, type = "default") => {
  toast(message, {
    type,
    position: "top-center",
    autoClose: 5000,        // Increased duration for snackbar-like behavior
    hideProgressBar: true,
    closeOnClick: false,    // Click does not cancel autoClose
    pauseOnHover: false,    // Hover does not pause
    pauseOnFocusLoss: false,// Focus loss does not pause
    draggable: false,
    closeButton: false,     // Disable the close button
    
    // Additional custom styling can be applied through the `style` prop
    // This is optional and can be used to override CSS
    // style: { 
    //   backgroundColor: '#333',
    //   color: '#fff',
    // },
  });
};
