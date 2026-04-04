import { supabase } from '@/lib/customSupabaseClient';

/**
 * Checks foreign key constraints referencing a table.
 */
export const checkTableReferences = async (tableName) => {
  try {
    console.log(`[FK Checker] Fetching references to table: ${tableName}`);
    const { data, error } = await supabase.rpc('get_table_references', { p_table_name: tableName });
    
    if (error) {
      console.error(`[FK Checker] Error fetching references:`, error);
      return { success: false, error: error.message, references: [] };
    }

    const blockingReferences = data.filter(ref => ref.delete_rule !== 'CASCADE');
    const cascadeReferences = data.filter(ref => ref.delete_rule === 'CASCADE');

    return {
      success: true,
      tableName,
      totalReferences: data.length,
      references: data,
      blockingReferences,
      cascadeReferences,
      hasBlockingReferences: blockingReferences.length > 0,
      warnings: blockingReferences.map(ref => 
        `La table "${ref.table_name}" référence "${tableName}" (colonne: ${ref.column_name}) sans CASCADE DELETE. La suppression sera bloquée s'il existe des enregistrements liés.`
      )
    };
  } catch (err) {
    console.error(`[FK Checker] Unexpected error:`, err);
    return { success: false, error: err.message, references: [] };
  }
};