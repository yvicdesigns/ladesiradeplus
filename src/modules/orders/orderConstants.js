import { ORDER_STATUSES, ORDER_TRANSITIONS } from '@/constants/orderStatus';

export const ORDER_CONSTANTS = {
  STATUSES: ORDER_STATUSES,
  TRANSITIONS: ORDER_TRANSITIONS,
  TYPES: {
    DELIVERY: 'delivery',
    COUNTER: 'counter',
    DINE_IN: 'dine_in'
  }
};