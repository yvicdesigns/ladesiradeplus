import { supabase } from '@/lib/customSupabaseClient';

/**
 * Task 8: Comprehensive test/verification function
 * Validates the database state for foreign keys and required default structures.
 */
export const verifyAdminSettingsIntegrity = async () => {
  try {
    const { data: diagnostic, error: diagnosticError } = await supabase.rpc('diagnose_admin_settings_fk_issue');
    
    if (diagnosticError) {
      throw new Error(`RPC Diagnostic Error: ${diagnosticError.message}`);
    }

    const report = {
      isHealthy: true,
      issues: [],
      diagnosticData: diagnostic,
    };

    // Check restaurants table
    if (!diagnostic.restaurants_table_exists) {
      report.isHealthy = false;
      report.issues.push("Restaurants table does not exist.");
    } else if (diagnostic.restaurants_count === 0) {
      report.isHealthy = false;
      report.issues.push("Restaurants table is empty. Default restaurant is missing.");
    }

    // Check FK configuration
    if (diagnostic.fk_constraint_status === 'missing') {
      report.isHealthy = false;
      report.issues.push("Foreign key constraint 'admin_settings_restaurant_id_fkey' is missing.");
    }

    // Check for orphaned records
    if (diagnostic.orphaned_admin_settings && diagnostic.orphaned_admin_settings.length > 0) {
      report.isHealthy = false;
      report.issues.push(`${diagnostic.orphaned_admin_settings.length} orphaned admin_settings records found referencing non-existent restaurant_ids.`);
    }

    // Verify admin_users (Additional requirement)
    try {
      const { data: adminUsers, error: usersErr } = await supabase
        .from('admin_users')
        .select('id, restaurant_id');
        
      if (!usersErr && adminUsers) {
        const invalidUsers = adminUsers.filter(u => !diagnostic.restaurant_ids?.includes(u.restaurant_id));
        if (invalidUsers.length > 0) {
          report.isHealthy = false;
          report.issues.push(`${invalidUsers.length} admin_users records reference invalid restaurant_ids.`);
        }
      }
    } catch (e) {
      console.warn("Could not verify admin_users FK integrity:", e.message);
    }

    return { success: true, report };
  } catch (error) {
    console.error("Integrity Verification Failed:", error);
    return { success: false, error: error.message };
  }
};