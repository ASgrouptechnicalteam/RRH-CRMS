import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { toUserFacingError } from '../utils/userFacingError';

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
  showError: (messageOrOptions: string | Omit<ToastOptions, 'type' | 'durationMs'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [errorModal, setErrorModal] = useState<Omit<ToastOptions, 'type' | 'durationMs'> | null>(null);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const hideErrorModal = useCallback(() => {
    setErrorModal(null);
  }, []);

  const showToast = useCallback((messageOrOptions: string | ToastOptions, fallbackType: ToastType = 'info') => {
    if (fallbackType === 'error' || (typeof messageOrOptions !== 'string' && messageOrOptions.type === 'error')) {
      if (typeof messageOrOptions === 'string') {
        setErrorModal({ title: 'Error', message: messageOrOptions });
      } else {
        setErrorModal(messageOrOptions);
      }
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let newItem: ToastItem;
    if (typeof messageOrOptions === 'string') {
      newItem = { id, message: messageOrOptions, type: fallbackType, durationMs: 4000 };
    } else {
      newItem = {
        id,
        message: messageOrOptions.message,
        title: messageOrOptions.title,
        nextStep: messageOrOptions.nextStep,
        type: messageOrOptions.type || fallbackType,
        durationMs: messageOrOptions.durationMs || 4000
      };
    }

    setToasts((prev) => [...prev, newItem]);
    if (newItem.durationMs && newItem.durationMs > 0) {
      setTimeout(() => hideToast(id), newItem.durationMs);
    }
  }, [hideToast]);

  const showError = useCallback((messageOrOptions: string | Omit<ToastOptions, 'type' | 'durationMs'>) => {
    if (typeof messageOrOptions === 'string') {
      setErrorModal({ title: 'Error', message: messageOrOptions });
    } else {
      setErrorModal(messageOrOptions);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showError, hideToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border text-sm font-semibold backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-slideInRight ${
                isSuccess
                  ? 'bg-navy-900/95 border-navy-700 text-navy-100'
                  : isWarning
                  ? 'bg-amber-900/95 border-amber-700 text-amber-100'
                  : 'bg-slate-900/95 border-slate-700 text-slate-100'
              }`}
            >
              <div className="pt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />}
                {!isSuccess && !isWarning && <Info className="w-5 h-5 shrink-0 text-navy-400" />}
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

      {errorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-rose-50 px-6 py-4 flex items-center gap-3 border-b border-rose-100">
              <div className="bg-rose-100 p-2 rounded-full">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h2 className="text-xl font-bold text-rose-900 leading-tight">
                {errorModal.title || 'Error'}
              </h2>
              <button 
                onClick={hideErrorModal} 
                className="ml-auto p-2 text-rose-400 hover:text-rose-600 rounded-full hover:bg-rose-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-700 text-base mb-4 leading-relaxed">
                {errorModal.message}
              </p>
              {errorModal.nextStep && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-2">
                  <p className="text-sm font-semibold text-slate-800 mb-1">What to do next:</p>
                  <p className="text-sm text-slate-600">{errorModal.nextStep}</p>
                </div>
              )}
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={hideErrorModal}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
