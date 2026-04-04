/**
 * Foreign Key Dependency Map for Data Reset
 * 
 * This document outlines the parent-child relationships that dictate the required
 * deletion order during a full data reset. Attempting to delete a parent record
 * before its children will result in a Foreign Key Constraint Violation (Error 23503)
 * unless ON DELETE CASCADE is explicitly configured in the database.
 * 
 * ============================================================================
 * CORE ENTITIES & DEPENDENCIES
 * ============================================================================
 * 
 * 1. CUSTOMERS (Parent)
 *    - Child: orders (customer_id)
 *    - Child: restaurant_orders (customer_id)
 *    - Child: delivery_orders (customer_id)
 *    - Child: reservations (user_id/customer_id)
 *    - Child: reviews (user_id)
 *    - Child: customer_feedback (customer_id)
 *    -> REQUIREMENT: Must delete all associated orders, reservations, and reviews 
 *       before deleting the customer.
 * 
 * 2. ORDERS (Parent)
 *    - Child: order_items (order_id)
 *    - Child: delivery_orders (order_id)
 *    - Child: restaurant_orders (order_id)
 *    - Child: payments (order_id)
 *    - Child: item_stock_movements (order_id)
 *    -> REQUIREMENT: Must delete all items, delivery records, payment records, 
 *       and stock movements before deleting the order.
 * 
 * 3. DELIVERIES (Parent)
 *    - Child: delivery_tracking (delivery_id)
 *    -> REQUIREMENT: Must delete tracking history before deleting the delivery.
 * 
 * ============================================================================
 * PROPER DELETION SEQUENCE
 * ============================================================================
 * To safely bypass FK constraint errors, the following sequence must be strictly adhered to:
 * 
 * LEVEL 1 (Deepest Children - Safe to delete first)
 * - order_items
 * - item_stock_movements
 * - delivery_tracking
 * - refunds
 * 
 * LEVEL 2 (Intermediate Children)
 * - delivery_orders
 * - restaurant_orders
 * - payments
 * 
 * LEVEL 3 (Core Transactions)
 * - orders
 * - reservations
 * - reviews
 * 
 * LEVEL 4 (Top Level Entities)
 * - customers
 * 
 * LEVEL 5 (System Logs)
 * - audit_logs
 * - activity_logs
 */

export const DEPENDENCY_MAP = {
  order_items: { parent: 'orders', cascade: false },
  delivery_orders: { parent: 'orders', cascade: false },
  restaurant_orders: { parent: 'orders', cascade: false },
  delivery_tracking: { parent: 'deliveries', cascade: false },
  orders: { parent: 'customers', cascade: false },
  reviews: { parent: 'customers', cascade: false },
  reservations: { parent: 'customers', cascade: false }
};