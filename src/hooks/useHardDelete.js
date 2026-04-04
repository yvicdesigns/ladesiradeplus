import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { getFriendlyErrorMessage } from '@/lib/supabaseErrorHandler';

export const useHardDelete = (defaultTableName = null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hardDelete = async (recordId, overrideTableName = null) => {
    const tableName = overrideTableName || defaultTableName;
    
    if (!tableName || !recordId) {
      console.error("[useHardDelete] tableName and recordId are required");
      return { success: false, error: "Table name and Record ID are required for hard deletion." };
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`[Audit] Attempting hard delete on ${tableName} for ID: ${recordId}`);
      
      // CRITICAL: Uses .delete() to permanently remove the record, NOT .update({ is_deleted: false })
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        console.error(`[useHardDelete] Supabase delete error:`, deleteError);
        throw deleteError;
      }

      console.log(`[Audit] Successfully executed hard delete command for record ${recordId} from ${tableName}`);
      return { success: true };
    } catch (err) {
      console.error(`[useHardDelete] Error deleting from ${tableName}:`, err);
      const friendlyMessage = getFriendlyErrorMessage(err, `hard delete in ${tableName}`);
      setError(friendlyMessage);
      return { success: false, error: friendlyMessage };
    } finally {
      setLoading(false);
    }
  };

  return { hardDelete, loading, error };
};