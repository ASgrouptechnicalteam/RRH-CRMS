import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      hideToast(id);
    }, 4000);
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Floating Toast Portal Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-slideInRight ${
                isSuccess
                  ? 'bg-navy-900/95 border-navy-700 text-navy-100'
                  : isError
                  ? 'bg-rose-900/95 border-rose-700 text-rose-100'
                  : isWarning
                  ? 'bg-amber-900/95 border-amber-700 text-amber-100'
                  : 'bg-slate-900/95 border-slate-700 text-slate-100'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />}
              {isError && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />}
              {isWarning && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 shrink-0 text-navy-400 mt-0.5" />}

              <div className="flex-1 leading-snug">{t.message}</div>

              <button
                onClick={() => hideToast(t.id)}
                className="text-slate-400 hover:text-white transition-colors p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
