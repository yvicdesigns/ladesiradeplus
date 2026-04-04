import { supabase } from './customSupabaseClient';
import { executeWithResilience } from './supabaseErrorHandler';

/**
 * Diagnostic utility to verify admin permissions directly from the database.
 * Used to troubleshoot deletion/access issues.
 */
export const verifyAdminPermissions = async () => {
  try {
    const data = await executeWithResilience(
      async () => {
        const { data, error } = await supabase.rpc('verify_admin_status');
        if (error) throw error;
        return data;
      },
      { context: 'Verify Admin Permissions', maxRetries: 2 }
    );
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error("Diagnostic verification failed:", error);
    return {
      success: false,
      error: error.message || "Impossible de vérifier les permissions"
    };
  }
};