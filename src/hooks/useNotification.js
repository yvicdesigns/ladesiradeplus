import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook utilitaire simplifiant l'usage des notifications (toasts)
 */
export const useNotification = () => {
  const { toast } = useToast();

  const notifySuccess = useCallback((title, description = '') => {
    toast({
      title,
      description,
      variant: 'default',
      className: 'bg-amber-50 border-amber-200 text-amber-800',
    });
  }, [toast]);

  const notifyError = useCallback((title, description = '') => {
    toast({
      title: title || 'Une erreur est survenue',
      description,
      variant: 'destructive',
    });
  }, [toast]);

  const notifyInfo = useCallback((title, description = '') => {
    toast({
      title,
      description,
      variant: 'default',
    });
  }, [toast]);

  const notifyNotImplemented = useCallback(() => {
    toast({
      title: "Action requise",
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      variant: 'default',
    });
  }, [toast]);

  return {
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyNotImplemented,
  };
};

export default useNotification;