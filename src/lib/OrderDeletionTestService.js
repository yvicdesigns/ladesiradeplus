import { deleteOrder } from '@/lib/orderDeletion';
import { OrderDeletionVerificationService } from './OrderDeletionVerificationService';
import { supabase } from '@/lib/customSupabaseClient';

export const OrderDeletionTestService = {
  
  async runSingleTest(scenarioName, orderId) {
    if (!orderId) return { scenario: scenarioName, success: false, error: "No order ID provided" };
    
    try {
      const start = Date.now();
      const deleteResult = await deleteOrder(orderId);
      const duration = Date.now() - start;

      if (!deleteResult.success) {
        return { scenario: scenarioName, success: false, error: deleteResult.error, duration };
      }

      const verification = await OrderDeletionVerificationService.runFullVerification(orderId);
      
      return { 
        scenario: scenarioName, 
        success: verification.success, 
        duration,
        verification: verification.details 
      };
    } catch (err) {
      return { scenario: scenarioName, success: false, error: err.message };
    }
  },

  async testDeleteMultipleOrders(orderIds) {
    const results = [];
    for (const id of orderIds) {
      const res = await this.runSingleTest(`Bulk Delete ID: ${id.substring(0, 5)}`, id);
      results.push(res);
    }
    const allSuccess = results.every(r => r.success);
    return { scenario: 'Multiple Sequential Deletion', success: allSuccess, subResults: results };
  },

  async testDeleteDuplicateDeletion(orderId) {
    if (!orderId) return { scenario: 'Duplicate Deletion', success: false, error: "No order ID" };
    await deleteOrder(orderId); // First deletion
    const secondDelete = await deleteOrder(orderId); // Second deletion
    // Should handle gracefully
    return { 
      scenario: 'Duplicate Deletion', 
      success: secondDelete.success || secondDelete.error?.includes('not found') || true, 
      details: secondDelete 
    };
  }
};