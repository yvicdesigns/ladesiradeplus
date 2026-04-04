import { ordersService } from '@/modules/orders/ordersService';
import { StockService } from './StockService';
import { ORDER_STATUSES } from '@/constants/orderStatus';
import { logAudit } from '@/lib/auditLogUtils';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

export const OrderService = {
  async orchestrateOrderCreation(orderData) {
    // 1. Validate stock
    const stockValidation = await StockService.validateStockAvailability(orderData.items);
    if (!stockValidation.isValid) {
      throw new Error(`Stock insuffisant pour l'article ${stockValidation.failedItem}`);
    }

    // 2. Create order via RPC
    const { data, error } = await ordersService.createOrder(orderData);
    if (error) throw new Error(error.message);

    // 3. Log audit action explicitly
    if (data?.order_id) {
       await logAudit(AUDIT_ACTIONS.INSERT, 'orders', data.order_id, data.order, 'Commande créée via orchestration');
    }

    return data;
  },

  async handleOrderStatusChange(orderId, currentStatus, newStatus) {
    if (!ordersService.validateOrderTransition(currentStatus, newStatus)) {
      throw new Error(`Transition invalide de ${currentStatus} vers ${newStatus}`);
    }

    const result = await ordersService.updateOrderStatus(orderId, newStatus);
    
    if (result.data) {
       await logAudit(AUDIT_ACTIONS.UPDATE, 'orders', orderId, { status: currentStatus }, `Status changé vers ${newStatus}`);
    }
    
    return result;
  },

  validateOrderWorkflow(order) {
    return order && order.id && order.status;
  }
};