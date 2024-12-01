import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div
        className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          type === 'error' 
            ? 'bg-red-50 text-red-600 border border-red-100' 
            : 'bg-green-50 text-green-600 border border-green-100'
        }`}
      >
        {type === 'error' ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          <CheckCircle className="w-5 h-5" />
        )}
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className={`p-1 rounded-full transition-colors duration-200 ${
            type === 'error' 
              ? 'hover:bg-red-100' 
              : 'hover:bg-green-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}