import { z } from 'zod';
import { ROLES } from '@/constants/roles';

export const userProfileSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  role: z.nativeEnum(ROLES).default(ROLES.CUSTOMER)
});