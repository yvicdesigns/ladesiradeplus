import { z } from 'zod';
import { DELIVERY_STATUSES } from '@/constants/deliveryStatus';

export const deliveryOrderSchema = z.object({
  order_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  status: z.nativeEnum(DELIVERY_STATUSES).default(DELIVERY_STATUSES.PENDING),
  delivery_fee: z.number().nonnegative(),
  zone_id: z.string().uuid().optional(),
  distance_km: z.number().nonnegative().optional()
});