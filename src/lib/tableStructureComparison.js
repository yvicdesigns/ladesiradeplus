import { databaseAuditUtils } from './databaseAuditUtils';

export const compareTables = async (tableA = 'delivery_orders', tableB = 'restaurant_orders') => {
  console.log(`[SCHEMA COMPARE] Comparing ${tableA} vs ${tableB}`);
  
  const schemaA = await databaseAuditUtils.auditTable(tableA);
  const schemaB = await databaseAuditUtils.auditTable(tableB);
  
  if (!schemaA || !schemaB) {
      return { error: "Failed to fetch schemas for comparison." };
  }

  const columnsA = schemaA.columns?.map(c => c.column_name) || [];
  const columnsB = schemaB.columns?.map(c => c.column_name) || [];

  const uniqueToA = columnsA.filter(c => !columnsB.includes(c));
  const uniqueToB = columnsB.filter(c => !columnsA.includes(c));
  const commonColumns = columnsA.filter(c => columnsB.includes(c));

  const fksA = schemaA.foreignKeys || [];
  const fksB = schemaB.foreignKeys || [];

  const report = {
      tableA: schemaA.tableName,
      tableB: schemaB.tableName,
      comparison: {
          commonColumns,
          uniqueToA,
          uniqueToB,
          foreignKeysA: fksA,
          foreignKeysB: fksB
      },
      analysis: generateAnalysis(tableA, tableB, uniqueToA, uniqueToB, fksA, fksB)
  };

  console.log(`[SCHEMA COMPARE] Final Report:`, report);
  return report;
};

const generateAnalysis = (tableA, tableB, uniqueA, uniqueB, fksA, fksB) => {
    let analysis = `Analysis comparing ${tableA} and ${tableB}:\n`;
    
    analysis += `- ${tableA} has unique columns: ${uniqueA.join(', ') || 'None'}\n`;
    analysis += `- ${tableB} has unique columns: ${uniqueB.join(', ') || 'None'}\n`;
    
    const parentFK_A = fksA.find(fk => fk.foreign_table_name === 'orders');
    const parentFK_B = fksB.find(fk => fk.foreign_table_name === 'orders');

    if (parentFK_A && parentFK_B) {
        analysis += `- Both tables reference 'orders' table via '${parentFK_A.column_name}'.\n`;
        analysis += `- Deletion Cascade Rule for ${tableA}: ${parentFK_A.delete_rule}\n`;
        analysis += `- Deletion Cascade Rule for ${tableB}: ${parentFK_B.delete_rule}\n`;
        
        if (parentFK_A.delete_rule !== parentFK_B.delete_rule) {
            analysis += `CRITICAL DIFFERENCE: Cascade rules differ! This explains why deletion behavior varies.\n`;
        }
    }

    analysis += `\nRecommended Deletion Approach based on strict constraints:\n`;
    analysis += `1. Identify the 'id' in ${tableA}.\n`;
    analysis += `2. Find the associated parent 'order_id' from the 'orders' table.\n`;
    analysis += `3. Delete dependent records (e.g., 'order_items') linking to the parent 'order_id'.\n`;
    analysis += `4. Delete the ${tableA} record directly.\n`;
    analysis += `5. Finally, delete the parent 'orders' record if no other tables depend on it.\n`;

    return analysis;
};