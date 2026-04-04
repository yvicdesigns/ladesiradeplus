import { supabase } from '@/lib/customSupabaseClient';
import { TABLES_TO_RESET } from '@/lib/resetTestData';

export const verifyDataReset = async () => {
  const report = {
    success: true,
    empty_tables: [],
    tables_with_data: {},
    total_remaining: 0,
    errors: []
  };

  const tablesToCheck = [...TABLES_TO_RESET, 'audit_logs'];
  console.log('[Verification] Starting data reset verification for tables:', tablesToCheck);

  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error && error.code !== '42P01') { // Ignore "relation does not exist"
        throw error;
      }

      const rowCount = count || 0;
      
      // Allow 1 audit log entry (the reset action itself)
      const allowedCount = (table === 'audit_logs') ? 1 : 0;

      if (rowCount > allowedCount) {
        report.success = false;
        report.tables_with_data[table] = rowCount;
        report.total_remaining += (rowCount - allowedCount);
        console.warn(`[Verification] WARNING: Table ${table} still has ${rowCount} records!`);
      } else {
        report.empty_tables.push(table);
      }

    } catch (e) {
      console.error(`[Verification] Error checking table ${table}:`, e);
      report.success = false;
      report.errors.push(`Failed to check ${table}: ${e.message}`);
    }
  }

  console.log('[Verification] Verification complete.', report);
  return report;
};