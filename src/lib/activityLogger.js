import { supabase } from '@/lib/customSupabaseClient';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

/**
 * Journalise une activité système dans la table audit_logs
 */
export const logActivity = async (action, tableName, recordId, oldData = {}, reason = 'Activité système automatique') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Validate action against allowed constants
    const validAction = Object.values(AUDIT_ACTIONS).includes(action) ? action : AUDIT_ACTIONS.UPDATE;

    const { error } = await supabase.from('audit_logs').insert([{
      user_id: user?.id || null,
      action: validAction,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData,
      reason: reason
    }]);
    
    if (error) throw error;
  } catch (e) {
    console.error("Échec de la journalisation de l'activité:", e);
  }
};