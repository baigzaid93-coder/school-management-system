import { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-md px-4">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ message, type, onClose }) => {
  const styles = {
    success: {
      bg: 'bg-green-50 border-green-500',
      icon: <CheckCircle className="text-green-500" size={20} />,
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50 border-red-500',
      icon: <XCircle className="text-red-500" size={20} />,
      text: 'text-red-800'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-500',
      icon: <AlertCircle className="text-yellow-500" size={20} />,
      text: 'text-yellow-800'
    },
    info: {
      bg: 'bg-blue-50 border-blue-500',
      icon: <Info className="text-blue-500" size={20} />,
      text: 'text-blue-800'
    }
  };

  const style = styles[type] || styles.info;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg ${style.bg} ${style.text} animate-slide-down`}>
      {style.icon}
      <p className="flex-1 font-medium">{message}</p>
      <button onClick={onClose} className="hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  );
};

export default ToastProvider;
