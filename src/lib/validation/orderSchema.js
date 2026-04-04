import { z } from 'zod';
import { ORDER_STATUSES } from '@/constants/orderStatus';

export const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  notes: z.string().optional()
});

export const createOrderSchema = z.object({
  user_id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  customer_name: z.string().min(2),
  customer_phone: z.string().min(8),
  customer_email: z.string().email().optional().nullable(),
  delivery_address: z.string().optional().nullable(),
  order_type: z.enum(['delivery', 'counter', 'dine_in']),
  table_id: z.string().uuid().optional().nullable(),
  order_method: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  total: z.number().nonnegative(),
  delivery_data: z.any().optional(),
  restaurant_data: z.any().optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(ORDER_STATUSES)
});