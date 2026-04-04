/**
 * @fileoverview Type definitions for the Orders Module.
 * Note: Written in JSDoc standard JavaScript to comply with strict system constraints 
 * forbidding TypeScript (.ts) files.
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id
 * @property {string} order_id
 * @property {string} menu_item_id
 * @property {number} quantity
 * @property {number} price
 * @property {string} [notes]
 * @property {string} status
 */

/**
 * @typedef {Object} DeliveryOrder
 * @property {string} id
 * @property {string} order_id
 * @property {string} customer_id
 * @property {string} status
 * @property {string} payment_method
 * @property {string} payment_status
 * @property {number} [delivery_fee]
 * @property {string} [driver_id]
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} user_id
 * @property {string} restaurant_id
 * @property {string} customer_name
 * @property {string} customer_phone
 * @property {string} [customer_email]
 * @property {string} [delivery_address]
 * @property {string} type
 * @property {string} order_type
 * @property {number} total
 * @property {string} status
 * @property {string} created_at
 * @property {OrderItem[]} [order_items]
 * @property {DeliveryOrder[]} [delivery_orders]
 */

/**
 * @typedef {Object} OrderFilter
 * @property {string} [status]
 * @property {string} [type]
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {number} [limit]
 * @property {number} [offset]
 */

/**
 * @typedef {Object} OrderCreatePayload
 * @property {string} customer_name
 * @property {string} customer_phone
 * @property {string} [customer_email]
 * @property {string} [delivery_address]
 * @property {string} order_type - 'delivery' | 'counter' | 'dine_in'
 * @property {string} order_method
 * @property {string} [table_id]
 * @property {Array<{menu_item_id: string, quantity: number, price: number, notes?: string}>} items
 * @property {number} total
 * @property {Object} [delivery_data]
 */

// Export an empty object so the file is treated as a valid module 
// without causing "empty export" warnings in strict JS environments.
export const OrderTypes = {};