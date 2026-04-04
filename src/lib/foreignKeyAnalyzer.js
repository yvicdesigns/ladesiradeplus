import { supabase } from '@/lib/customSupabaseClient';

export const foreignKeyAnalyzer = {
  /**
   * Fetches all foreign keys from the database
   */
  async getAllForeignKeys() {
    const { data, error } = await supabase.rpc('get_all_foreign_keys');
    if (error) {
      console.error('Error fetching foreign keys:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Fetches foreign keys that are missing ON DELETE CASCADE
   */
  async getForeignKeyIssues() {
    const { data, error } = await supabase.rpc('analyze_foreign_key_issues');
    if (error) {
      console.error('Error fetching foreign key issues:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Fetches table dependencies for a specific parent table
   */
  async getTableDependencies(tableName) {
    const { data, error } = await supabase.rpc('get_table_dependencies_detailed', { p_table_name: tableName });
    if (error) {
      console.error(`Error fetching dependencies for ${tableName}:`, error);
      throw error;
    }
    return data || [];
  },

  /**
   * Categorizes FKs into stats
   */
  categorizeForeignKeys(fks) {
    const total = fks.length;
    const ok = fks.filter(fk => fk.status === 'OK').length;
    const missing = fks.filter(fk => fk.status !== 'OK').length;
    
    return { total, ok, missing };
  },

  /**
   * Generate a comprehensive SQL script to fix all missing cascades
   */
  generateMasterFixScript(issues) {
    if (!issues || issues.length === 0) return '-- All foreign keys are properly configured with CASCADE.';
    
    let script = '-- MASTER FOREIGN KEY FIX SCRIPT\n';
    script += '-- Generated to fix missing ON DELETE CASCADE rules\n\n';
    
    issues.forEach(issue => {
      script += `-- Fix constraint ${issue.constraint_name} on ${issue.child_table}\n`;
      script += `${issue.fix_sql}\n\n`;
    });
    
    return script;
  },

  /**
   * Export data as JSON or CSV
   */
  exportData(data, format = 'json', filename = 'foreign_keys_export') {
    if (!data || data.length === 0) return;

    let content, type, extension;

    if (format === 'json') {
      content = JSON.stringify(data, null, 2);
      type = 'application/json';
      extension = 'json';
    } else if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      );
      content = [headers, ...rows].join('\n');
      type = 'text/csv';
      extension = 'csv';
    } else {
      return;
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};