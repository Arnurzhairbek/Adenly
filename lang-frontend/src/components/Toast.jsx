import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

let toastId = 0;
const toasts = [];
const listeners = [];

export const toast = {
  success: (message) => addToast("success", message),
  error: (message) => addToast("error", message),
  info: (message) => addToast("info", message),
  warning: (message) => addToast("warning", message),
};

function addToast(type, message) {
  const id = toastId++;
  const newToast = { id, type, message };
  toasts.push(newToast);
  listeners.forEach((listener) => listener([...toasts]));
  
  setTimeout(() => {
    removeToast(id);
  }, 3000);
  
  return id;
}

function removeToast(id) {
  const index = toasts.findIndex((t) => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach((listener) => listener([...toasts]));
  }
}

export default function ToastContainer() {
  const [toastList, setToastList] = useState([]);

  useEffect(() => {
    listeners.push(setToastList);
    return () => {
      const index = listeners.indexOf(setToastList);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  const variants = {
    success: "bg-green-500/90 border-green-400",
    error: "bg-red-500/90 border-red-400",
    info: "bg-blue-500/90 border-blue-400",
    warning: "bg-yellow-500/90 border-yellow-400",
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toastList.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`
              ${variants[toast.type]}
              border rounded-lg px-4 py-3 shadow-xl
              backdrop-blur-sm text-white
              min-w-[300px] max-w-md
              flex items-center gap-3
            `}
            onClick={() => removeToast(toast.id)}
          >
            <span className="flex-shrink-0">{icons[toast.type]}</span>
            <p className="flex-1">{toast.message}</p>
            <button className="hover:opacity-70">×</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

