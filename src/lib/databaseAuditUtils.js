import { supabase } from '@/lib/customSupabaseClient';

export const databaseAuditUtils = {
  /**
   * Fetches schema information (columns, types, nullability) for a given table.
   */
  async getTableSchema(tableName) {
    try {
      console.log(`[DB AUDIT] Fetching schema for table: ${tableName}`);
      const { data, error } = await supabase.rpc('get_schema_info');
      
      if (error) {
        console.error(`[DB AUDIT] Error fetching schema info:`, error);
        return null;
      }
      
      const tableSchema = data.filter(col => col.table_name === tableName);
      console.log(`[DB AUDIT] Schema for ${tableName}:`, tableSchema);
      return tableSchema;
    } catch (err) {
      console.error(`[DB AUDIT] Exception in getTableSchema:`, err);
      return null;
    }
  },

  /**
   * Fetches foreign key constraints for a given table.
   */
  async getTableForeignKeys(tableName) {
    try {
      console.log(`[DB AUDIT] Fetching FKs for table: ${tableName}`);
      const { data, error } = await supabase.rpc('get_table_fks', { p_table_name: tableName });
      
      if (error) {
         console.warn(`[DB AUDIT] Could not fetch FKs for ${tableName} (RPC might be missing or permissions issue):`, error.message);
         // Fallback or empty array if RPC fails
         return [];
      }
      
      console.log(`[DB AUDIT] FKs for ${tableName}:`, data);
      return data || [];
    } catch (err) {
      console.error(`[DB AUDIT] Exception in getTableForeignKeys:`, err);
      return [];
    }
  },

  /**
   * Fetches tables that reference the given table (reverse FKs).
   */
  async getTableReferences(tableName) {
    try {
      console.log(`[DB AUDIT] Fetching references to table: ${tableName}`);
      const { data, error } = await supabase.rpc('get_table_references', { p_table_name: tableName });
      
      if (error) {
         console.warn(`[DB AUDIT] Could not fetch references for ${tableName}:`, error.message);
         return [];
      }
      
      console.log(`[DB AUDIT] References to ${tableName}:`, data);
      return data || [];
    } catch (err) {
      console.error(`[DB AUDIT] Exception in getTableReferences:`, err);
      return [];
    }
  },

  /**
   * Comprehensive audit of a specific table
   */
  async auditTable(tableName) {
    console.log(`\n--- STARTING COMPREHENSIVE AUDIT FOR: ${tableName} ---`);
    const schema = await this.getTableSchema(tableName);
    const foreignKeys = await this.getTableForeignKeys(tableName);
    const references = await this.getTableReferences(tableName);
    
    const report = {
      tableName,
      columns: schema,
      primaryKeys: schema?.filter(c => c.column_name === 'id') || [], // Simplifying PK detection
      foreignKeys,
      referencedBy: references,
      timestamp: new Date().toISOString()
    };
    
    console.log(`--- AUDIT REPORT FOR ${tableName} ---`);
    console.log(JSON.stringify(report, null, 2));
    console.log(`--- END AUDIT FOR ${tableName} ---\n`);
    
    return report;
  }
};