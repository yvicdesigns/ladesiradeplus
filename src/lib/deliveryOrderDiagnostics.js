import { supabase } from '@/lib/customSupabaseClient';

export const deliveryOrderDiagnostics = {
  /**
   * Fetches the table structure from information_schema
   */
  async getTableStructure(tableName) {
    try {
      const { data, error } = await supabase.rpc('get_schema_info');
      if (error) throw error;
      return data.filter(col => col.table_name === tableName);
    } catch (err) {
      console.error(`[Diagnostics] Error fetching structure for ${tableName}:`, err);
      return null;
    }
  },

  /**
   * Fetches foreign keys for a table
   */
  async getTableForeignKeys(tableName) {
    try {
      const { data, error } = await supabase.rpc('get_table_fks', { p_table_name: tableName });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`[Diagnostics] Error fetching FKs for ${tableName}:`, err);
      return [];
    }
  },

  /**
   * Compares two table structures
   */
  async compareTableStructures(table1, table2) {
    const schema1 = await this.getTableStructure(table1);
    const schema2 = await this.getTableStructure(table2);

    if (!schema1 || !schema2) return null;

    const cols1 = schema1.map(c => c.column_name);
    const cols2 = schema2.map(c => c.column_name);

    return {
      table1,
      table2,
      uniqueToTable1: cols1.filter(c => !cols2.includes(c)),
      uniqueToTable2: cols2.filter(c => !cols1.includes(c)),
      commonColumns: cols1.filter(c => cols2.includes(c))
    };
  },

  /**
   * Fetches all related records for a specific delivery order
   */
  async getRelatedRecords(deliveryOrderId) {
    const records = {
      deliveryOrder: null,
      parentOrder: null,
      orderItems: []
    };

    try {
      // 1. Get delivery order
      const { data: doData, error: doError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', deliveryOrderId)
        .single();

      if (doError) throw doError;
      records.deliveryOrder = doData;

      if (doData.order_id) {
        // 2. Get parent order
        const { data: oData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', doData.order_id)
          .single();
        records.parentOrder = oData;

        // 3. Get order items
        const { data: oiData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', doData.order_id);
        records.orderItems = oiData || [];
      }

      return records;
    } catch (err) {
      console.error('[Diagnostics] Error fetching related records:', err);
      throw err;
    }
  },

  /**
   * Generates a string representation of the deletion query
   */
  generateDeletionQuery(deliveryOrderId, relatedRecords) {
    let query = `// Deletion Sequence for Delivery Order ${deliveryOrderId}\n\n`;
    
    query += `// 1. Attempt to delete delivery_order directly (working pattern)\n`;
    query += `const { error } = await supabase\n`;
    query += `  .from('delivery_orders')\n`;
    query += `  .delete()\n`;
    query += `  .eq('id', '${deliveryOrderId}');\n\n`;

    query += `// NOTE: If cascading is not configured correctly on the database level,\n`;
    query += `// you would need to manually delete dependencies first:\n`;
    
    if (relatedRecords?.parentOrder) {
      const orderId = relatedRecords.parentOrder.id;
      query += `// - Delete order_items where order_id = '${orderId}'\n`;
      query += `// - Delete parent order where id = '${orderId}'\n`;
    }

    return query;
  },

  /**
   * Creates a step-by-step deletion plan
   */
  getDeletionPlan(deliveryOrderId, relatedRecords) {
    const plan = [];
    const parentOrderId = relatedRecords?.parentOrder?.id;

    if (parentOrderId) {
      plan.push({
        step: 1,
        table: 'order_items',
        action: 'DELETE',
        condition: `order_id = ${parentOrderId}`,
        count: relatedRecords.orderItems.length,
        description: 'Remove associated menu items'
      });
    }

    plan.push({
      step: parentOrderId ? 2 : 1,
      table: 'delivery_orders',
      action: 'DELETE',
      condition: `id = ${deliveryOrderId}`,
      count: 1,
      description: 'Remove the specific delivery order record'
    });

    if (parentOrderId) {
      plan.push({
        step: 3,
        table: 'orders',
        action: 'DELETE',
        condition: `id = ${parentOrderId}`,
        count: 1,
        description: 'Remove the parent order record (if no other references)'
      });
    }

    return plan;
  }
};