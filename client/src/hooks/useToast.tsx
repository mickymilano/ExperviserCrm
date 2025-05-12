import { v4 as uuidv4 } from 'uuid';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastData {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

export const useToast = () => {
  const toast = (options: ToastOptions) => {
    const { title, description, type = 'info', duration = 5000 } = options;
    
    const toastData: ToastData = {
      id: uuidv4(),
      title,
      description,
      type,
      duration,
    };

    const event = new CustomEvent('toast', { detail: toastData });
    window.dispatchEvent(event);
  };

  return {
    toast,
    success: (options: Omit<ToastOptions, 'type'>) => toast({ ...options, type: 'success' }),
    error: (options: Omit<ToastOptions, 'type'>) => toast({ ...options, type: 'error' }),
    warning: (options: Omit<ToastOptions, 'type'>) => toast({ ...options, type: 'warning' }),
    info: (options: Omit<ToastOptions, 'type'>) => toast({ ...options, type: 'info' }),
  };
};