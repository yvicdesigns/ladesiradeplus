import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const OLD_ID = 'b6d4409c-d3bb-43b1-a27f-e63c64cbfa65';
const NEW_ID = '7eedf081-0268-4867-af38-61fa5932420a';

export function useRestaurantConsolidation() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [logs, setLogs] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const { toast } = useToast();

  const verifyData = useCallback(async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.rpc('verify_restaurant_consolidation', {
        old_id: OLD_ID,
        new_id: NEW_ID
      });

      if (error) throw error;
      
      if (data.success) {
        setVerificationData(data);
        return data;
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur de vérification',
        description: err.message
      });
      return null;
    } finally {
      setVerifying(false);
    }
  }, [toast]);

  const executeConsolidation = useCallback(async () => {
    setLoading(true);
    setLogs(null);
    try {
      const { data, error } = await supabase.rpc('consolidate_restaurant_ids', {
        old_id: OLD_ID,
        new_id: NEW_ID
      });

      if (error) throw error;

      if (data.success) {
        setLogs(data.logs);
        toast({
          title: 'Consolidation Réussie',
          description: 'Toutes les tables ont été mises à jour avec le nouveau restaurant ID.',
        });
        await verifyData();
      } else {
        throw new Error(data.message || 'Consolidation failed');
      }
    } catch (err) {
      console.error('Consolidation error:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur de consolidation',
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  }, [toast, verifyData]);

  return {
    loading,
    verifying,
    logs,
    verificationData,
    executeConsolidation,
    verifyData,
    OLD_ID,
    NEW_ID
  };
}