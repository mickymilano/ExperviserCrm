// Questo file è un wrapper di compatibilità che reindirizza al sistema toast standard
// Abbiamo rimosso l'implementazione separata per evitare notifiche duplicate

import { toast as shadcnToast } from './use-toast';

// Reindirizzamento al sistema toast standard per garantire compatibilità con codice esistente
export const useToast = () => {
  const toast = (options: any) => {
    const { title, description, type = 'info', duration = 5000 } = options;
    
    // Mappa i tipi vecchi ai varianti del nuovo sistema
    const variantMap: Record<string, 'default' | 'destructive'> = {
      'success': 'default',
      'error': 'destructive',
      'info': 'default',
      'warning': 'default'
    };
    
    // Applica classi specifiche in base al tipo
    let className = '';
    if (type === 'success') {
      className = 'bg-green-600 text-white border-green-700';
    } else if (type === 'error') {
      className = 'bg-red-600 text-white border-red-700';
    } else if (type === 'warning') {
      className = 'bg-amber-600 text-white border-amber-700';
    }

    // Chiama il sistema toast standard
    shadcnToast({
      title,
      description,
      variant: variantMap[type],
      className,
      duration,
    });
  };

  return {
    toast,
    success: (options: any) => toast({ ...options, type: 'success' }),
    error: (options: any) => toast({ ...options, type: 'error' }),
    warning: (options: any) => toast({ ...options, type: 'warning' }),
    info: (options: any) => toast({ ...options, type: 'info' }),
  };
};