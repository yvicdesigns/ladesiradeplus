import { useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { handleTokenRefreshError } from '@/lib/tokenRefreshHandler';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export const useAuthTokenValidation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateToken = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        const { shouldRedirect, message } = await handleTokenRefreshError(error);
        if (shouldRedirect) {
          toast({
            variant: "destructive",
            title: "Session Expirée",
            description: message || "Veuillez vous reconnecter.",
          });
          navigate('/login?error=session_expired', { replace: true });
          return false;
        }
      }

      if (!session) {
        return false;
      }

      return true;
    } catch (err) {
      console.error("Token validation error:", err);
      return false;
    }
  }, [navigate, toast]);

  return { validateToken };
};