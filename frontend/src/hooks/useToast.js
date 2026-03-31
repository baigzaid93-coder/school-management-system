import { useToast } from '../components/Toast';

const useToastHook = () => {
  const toast = useToast();
  
  return {
    success: (message) => toast.showToast(message, 'success'),
    error: (message) => toast.showToast(message, 'error'),
    warning: (message) => toast.showToast(message, 'warning'),
    info: (message) => toast.showToast(message, 'info'),
    showToast: toast.showToast
  };
};

export default useToastHook;
