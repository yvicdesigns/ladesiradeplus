/**
 * Constantes globales de l'application
 */

export const APP_CONFIG = {
  NAME: 'La Desirade Plus',
  SUPPORT_EMAIL: 'support@ladesiradeplus.com',
  DEFAULT_LANGUAGE: 'fr',
  DEFAULT_CURRENCY: 'XAF',
};

export const TIMEOUTS = {
  API_REQUEST: 10000, // 10 secondes
  TOAST_DURATION: 3000,
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  CUSTOMER: 'customer',
};