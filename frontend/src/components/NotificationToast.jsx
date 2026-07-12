import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationToastContainer = () => {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto w-full glass-panel rounded-xl shadow-lg border border-slate-200/60 dark:border-slate-800/60 overflow-hidden flex items-start p-4 gap-3"
          >
            {/* Toast Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'Success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {toast.type === 'Warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {toast.type === 'Error' && <XCircle className="w-5 h-5 text-rose-500" />}
              {toast.type === 'Info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>

            {/* Toast Text */}
            <div className="flex-grow min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {toast.title}
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                {toast.message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
