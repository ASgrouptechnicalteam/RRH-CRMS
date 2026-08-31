import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  nextStep?: string;
  durationMs?: number;
}

export interface ToastOptions {
  message: string;
  title?: string;
  nextStep?: string;
  type?: ToastType;
  durationMs?: number;
}

interface ToastContextType {
  showToast: (messageOrOptions: string | ToastOptions, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((messageOrOptions: string | ToastOptions, fallbackType: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let newItem: ToastItem;
    if (typeof messageOrOptions === 'string') {
      const type = fallbackType;
      newItem = {
        id,
        message: messageOrOptions,
        type,
        durationMs: type === 'error' ? 10000 : 4000
      };
    } else {
      const type = messageOrOptions.type || fallbackType;
      newItem = {
        id,
        message: messageOrOptions.message,
        title: messageOrOptions.title,
        nextStep: messageOrOptions.nextStep,
        type,
        durationMs: messageOrOptions.durationMs || (type === 'error' ? 10000 : 4000)
      };
    }

    setToasts((prev) => [...prev, newItem]);

    // Auto dismiss
    if (newItem.durationMs && newItem.durationMs > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newItem.durationMs);
    }
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
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border text-sm font-semibold backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-slideInRight ${
                isSuccess
                  ? 'bg-navy-900/95 border-navy-700 text-navy-100'
                  : isError
                  ? 'bg-rose-900/95 border-rose-700 text-rose-100'
                  : isWarning
                  ? 'bg-amber-900/95 border-amber-700 text-amber-100'
                  : 'bg-slate-900/95 border-slate-700 text-slate-100'
              }`}
            >
              <div className="pt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 shrink-0 text-navy-400" />}
              </div>

              <div className="flex-1 leading-snug space-y-1.5">
                {t.title && <h5 className="font-bold text-white">{t.title}</h5>}
                <div>{t.message}</div>
                {t.nextStep && (
                  <div className="text-xs opacity-90 pt-1 mt-1 border-t border-white/10">
                    <span className="font-bold">Next:</span> {t.nextStep}
                  </div>
                )}
              </div>

              <button
                onClick={() => hideToast(t.id)}
                className="text-white/60 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
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
