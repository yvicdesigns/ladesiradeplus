import { supabase } from '@/lib/customSupabaseClient';

/**
 * Utility to verify if a record has been truly deleted from the database.
 * Returns true if the record does NOT exist, false if it still exists.
 */
export const verifyHardDelete = async (tableName, recordId) => {
  if (!tableName || !recordId) {
    console.error('[verifyHardDelete] Missing required parameters');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('id', recordId)
      .maybeSingle();

    // If no data is found (null) and no error, or if error is PGRST116 (No rows found), 
    // it means the record is successfully deleted.
    if (!data || (error && error.code === 'PGRST116')) {
      console.log(`[Audit] Verification successful: Record ${recordId} no longer exists in ${tableName}`);
      return true;
    }

    if (data) {
      console.warn(`[Audit] Verification failed: Record ${recordId} STILL EXISTS in ${tableName}`);
      return false; 
    }

    // On other errors, we can't be sure, assume false to be safe
    console.error(`[Audit] Verification error for ${tableName}:`, error);
    return false;
  } catch (err) {
    console.error(`[Audit] Exception during verification for ${tableName}:`, err);
    return false;
  }
};