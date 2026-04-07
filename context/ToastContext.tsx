'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => setMessage(null), 300);
    }, 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div
          className="fixed top-4 left-1/2 z-50 max-w-mobile w-full px-4"
          style={{ transform: 'translateX(-50%)' }}
        >
          <div
            className={`bg-primary text-white rounded-xl px-4 py-3 text-sm font-medium shadow-lg flex items-center gap-2 transition-all duration-300 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          >
            <span>✅</span>
            <span>{message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
