import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef({});

  const removeToast = useCallback((id) => {
    // Clear the timeout if it exists
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
    
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    // DISABLED: Custom toasts disabled to prevent notification flood
    return;
    
    const id = Date.now().toString();
    const newToast = { id, message, type, duration, visible: true };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration + animation time
    const timeoutId = setTimeout(() => {
      removeToast(id);
    }, duration + 500);
    
    // Store timeout reference using plain object instead of Map
    timeoutsRef.current[id] = timeoutId;
  }, [removeToast]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutsRef.current = {};
    };
  }, []);

  const showSuccess = useCallback((message, duration) => showToast(message, 'success', duration), [showToast]);
  const showError = useCallback((message, duration) => showToast(message, 'error', duration), [showToast]);
  const showInfo = useCallback((message, duration) => showToast(message, 'info', duration), [showToast]);
  const showWarning = useCallback((message, duration) => showToast(message, 'warning', duration), [showToast]);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
    >
      {children}
      {/* Render toasts safely */}
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onHide={() => removeToast(toast.id)}
          style={{ top: 60 + (index * 80) }}
        />
      ))}
    </ToastContext.Provider>
  );
};
