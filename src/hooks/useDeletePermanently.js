import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { ToastService } from '@/lib/ToastService';

export const useDeletePermanently = (tableName) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deletePermanently = async (recordId, reason = "Suppression définitive") => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch old data for audit log
      const { data: oldData } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', recordId)
        .single();

      // Perform permanent deletion
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      // Log to audit_logs
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'PERMANENT_DELETE',
        table_name: tableName,
        record_id: recordId,
        old_data: oldData,
        reason: reason
      });

      ToastService.success("✓ Supprimé définitivement avec succès");
      return { success: true };
    } catch (error) {
      console.error(`[useDeletePermanently] Error deleting ${recordId} from ${tableName}:`, error);
      ToastService.error("✗ Erreur lors de la suppression définitive");
      return { success: false, error };
    } finally {
      setIsDeleting(false);
    }
  };

  return { deletePermanently, isDeleting };
};