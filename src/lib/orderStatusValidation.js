export const VALID_ORDER_STATUSES = [
  'pending', 
  'confirmed', 
  'preparing', 
  'ready', 
  'in_transit', 
  'arrived_at_customer', 
  'delivered', 
  'served', 
  'cancelled', 
  'rejected'
];

export const TERMINAL_STATUSES = ['delivered', 'served', 'cancelled', 'rejected'];

export const getStatusTransitionRules = () => {
  // Unified rules for all order types (online, dine-in, takeaway)
  return {
    pending: ['confirmed', 'cancelled', 'rejected'], // Must be accepted (confirmed) by staff before any work begins
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['in_transit', 'served', 'delivered', 'cancelled'],
    in_transit: ['arrived_at_customer', 'cancelled'],
    arrived_at_customer: ['delivered', 'cancelled'],
    delivered: [],
    served: [],
    cancelled: [],
    rejected: []
  };
};

export const getValidNextStatuses = (currentStatus) => {
  const rules = getStatusTransitionRules();
  return rules[currentStatus] || [];
};

/**
 * Returns valid status transitions based on the specific order method.
 * For 'counter' orders: Simplified flow - only allows pending -> served or cancelled.
 */
export const getValidStatusTransitionsForOrderMethod = (currentStatus, orderMethod) => {
  if (TERMINAL_STATUSES.includes(currentStatus)) return [];

  const isCounter = orderMethod === 'counter';

  if (isCounter) {
    // Simplified Counter flow: bypass 'preparing' and 'ready'. Direct to 'served'.
    if (currentStatus === 'pending') return ['served', 'cancelled'];
    return ['cancelled'];
  }

  // Normal rules for online, dine_in, takeaway
  const rules = getStatusTransitionRules();
  return rules[currentStatus] || [];
};

export const isValidStatusTransition = (currentStatus, newStatus, orderMethod = null) => {
  // Always allow changing from/to same status (no-op)
  if (currentStatus === newStatus) return true;
  
  // Terminal states cannot be changed
  if (TERMINAL_STATUSES.includes(currentStatus)) {
    return false;
  }
  
  // Any non-terminal state can be cancelled/rejected
  if (newStatus === 'cancelled' || newStatus === 'rejected') {
    return true;
  }

  if (orderMethod) {
    const validNext = getValidStatusTransitionsForOrderMethod(currentStatus, orderMethod);
    return validNext.includes(newStatus);
  }

  const validNext = getValidNextStatuses(currentStatus);
  return validNext.includes(newStatus);
};