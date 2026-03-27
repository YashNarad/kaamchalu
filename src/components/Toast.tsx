import { useEffect } from "react";

type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto close after 4 seconds

    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  const typeStyles = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    warning: 'bg-yellow-600 border-yellow-500',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div className={`px-6 py-3 rounded-lg border shadow-xl text-white font-medium flex items-center space-x-3 ${typeStyles[type]}`}>
        <span>{message}</span>
        <button 
          onClick={onClose} 
          className="ml-4 text-white opacity-75 hover:opacity-100 transition-opacity font-bold px-2 py-1 rounded"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
