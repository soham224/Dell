import {Slide, toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


// Helper function to provide consistent toast options
function getToastOptions() {
  return {
    position: "top-right",
    autoClose: 2000,
    transition: Slide,
    closeButton: true,
    hideProgressBar: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored"
  };
}

/**
 * Displays a warning toast message.
 * @param {string} msg - The message to display.
 * @returns {number} The toast ID.
 */
export function warningToast(msg) {
  return toast.error(msg, getToastOptions());
}

/**
 * Displays a success toast message.
 * @param {string} msg - The message to display.
 * @returns {number} The toast ID.
 */
export function successToast(msg) {
  return toast.success(msg, getToastOptions());
}

/**
 * Displays an info toast message.
 * @param {string} msg - The message to display.
 * @returns {number} The toast ID.
 */
export function infoToast(msg) {
  return toast.info(msg, getToastOptions());
}

/**
 * Displays an alert toast message.
 * @param {string} msg - The message to display.
 * @returns {number} The toast ID.
 */
export function alertToast(msg) {
  return toast.warning(msg, getToastOptions());
}