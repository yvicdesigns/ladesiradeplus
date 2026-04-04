export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

export const DELIVERY_STATUSES = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  ON_THE_WAY: 'on_the_way',
  ARRIVED: 'arrived_at_customer',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const ORDER_TYPES = {
  DELIVERY: 'delivery',
  COUNTER: 'counter',
  DINE_IN: 'dine_in'
};

export const STATUS_COLORS = {
  [ORDER_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ORDER_STATUSES.CONFIRMED]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ORDER_STATUSES.PREPARING]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ORDER_STATUSES.READY]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [ORDER_STATUSES.SERVED]: 'bg-amber-100 text-amber-800 border-amber-200',
  [ORDER_STATUSES.IN_TRANSIT]: 'bg-amber-100 text-amber-800 border-amber-200',
  [ORDER_STATUSES.DELIVERED]: 'bg-green-600 text-white border-green-700',
  [ORDER_STATUSES.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
  [ORDER_STATUSES.REJECTED]: 'bg-gray-800 text-white border-gray-900',
};

export const VALIDATION_RULES = {
  MIN_ORDER_AMOUNT: 1000,
  MAX_ORDER_ITEMS: 50,
  CANCELLATION_WINDOW_MINUTES: 5,
};