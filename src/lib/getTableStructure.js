import { supabase } from '@/lib/customSupabaseClient';

export const getTableStructure = async (tableName) => {
  console.log(`📋 Fetching table structure for: ${tableName}`);
  const result = {
    tableName,
    columns: [],
    foreignKeys: [],
    policies: [],
    error: null
  };

  try {
    // 1. Get Schema Info (Columns)
    const { data: schemaData, error: schemaError } = await supabase.rpc('get_schema_info');
    if (schemaError) throw schemaError;
    
    if (schemaData) {
      result.columns = schemaData.filter(col => col.table_name === tableName);
    }

    // 2. Try to get Foreign Keys
    const { data: fkData, error: fkError } = await supabase.rpc('get_table_fks', { p_table_name: tableName });
    if (!fkError && fkData) {
      result.foreignKeys = fkData;
    } else {
      // Fallback
      const { data: refData, error: refError } = await supabase.rpc('get_table_references', { p_table_name: tableName });
      if (!refError && refData) {
        result.foreignKeys = refData;
      }
    }

    // 3. Try to get Policies
    const { data: polData, error: polError } = await supabase.rpc('get_table_policies', { p_table_name: tableName });
    if (!polError && polData) {
      result.policies = polData;
    }

    console.log(`✅ Structure retrieved for ${tableName}:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Error fetching table structure for ${tableName}:`, error);
    result.error = error.message;
    return result;
  }
};