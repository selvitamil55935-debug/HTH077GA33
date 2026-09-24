import React, { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ToastNotification } from '../types';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  ArrowRight,
  Upload,
} from 'lucide-react';

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast.duration ?? 6000;

  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 50;
    const decrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast.id, duration, isPaused, onDismiss]);

  // Icons and visual themes per toast type
  const getTheme = () => {
    switch (toast.type) {
      case 'ai':
        return {
          icon: <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />,
          bgColor: 'bg-white dark:bg-slate-900',
          borderColor: 'border-indigo-500/40 dark:border-indigo-500/50',
          progressColor: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500',
          badgeText: 'AI Intelligence',
          badgeStyle: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          bgColor: 'bg-white dark:bg-slate-900',
          borderColor: 'border-emerald-500/40 dark:border-emerald-500/50',
          progressColor: 'bg-emerald-500',
          badgeText: 'Success',
          badgeStyle: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          bgColor: 'bg-white dark:bg-slate-900',
          borderColor: 'border-amber-500/40 dark:border-amber-500/50',
          progressColor: 'bg-amber-500',
          badgeText: 'Alert',
          badgeStyle: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
          bgColor: 'bg-white dark:bg-slate-900',
          borderColor: 'border-rose-500/40 dark:border-rose-500/50',
          progressColor: 'bg-rose-500',
          badgeText: 'Error',
          badgeStyle: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          bgColor: 'bg-white dark:bg-slate-900',
          borderColor: 'border-blue-500/40 dark:border-blue-500/50',
          progressColor: 'bg-blue-500',
          badgeText: 'Update',
          badgeStyle: 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border shadow-xl transition-all duration-200 ${theme.bgColor} ${theme.borderColor} animate-in slide-in-from-bottom-4 sm:slide-in-from-right-4 fade-in`}
    >
      <div className="p-4 flex items-start gap-3.5">
        <div className="flex-shrink-0 mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
          {theme.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${theme.badgeStyle}`}>
              {theme.badgeText}
            </span>
            <span className="text-[10px] text-slate-400">Just now</span>
          </div>

          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
            {toast.title}
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-normal">
            {toast.message}
          </p>

          {/* Interactive Action Button */}
          {toast.action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{toast.action.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown Progress Bar */}
      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${theme.progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useFinance();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};
