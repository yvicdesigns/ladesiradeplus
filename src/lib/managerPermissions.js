/**
 * Utility functions for Manager Role Permissions
 * Defines what a manager can and cannot do in the system via the UI.
 * 
 * Note: Database RLS policies use is_admin_or_manager() or is_role_admin() 
 * to enforce these at the database level.
 */

// Entities that managers are generally allowed to manage
export const ENTITY_TYPES = {
  RESERVATION: 'reservation',
  ORDER: 'order',
  DELIVERY: 'delivery',
  MENU: 'menu',
  USER: 'user',
  CUSTOMER: 'customer',
  PAYMENT: 'payment',
  REFUND: 'refund',
  STOCK_MANAGEMENT: 'stock_management',
  INVENTORY: 'inventory',
  INGREDIENT: 'ingredient',
};

/**
 * Checks if a manager can delete a specific entity type
 */
export const canManagerDelete = (entityType) => {
  switch (entityType) {
    case ENTITY_TYPES.MENU:
    case ENTITY_TYPES.STOCK_MANAGEMENT:
    case ENTITY_TYPES.INVENTORY:
    case ENTITY_TYPES.INGREDIENT:
    case ENTITY_TYPES.ORDER:
    case ENTITY_TYPES.DELIVERY:
    case ENTITY_TYPES.RESERVATION:
    case ENTITY_TYPES.CUSTOMER:
      return true;
    case ENTITY_TYPES.USER:
    case ENTITY_TYPES.PAYMENT:
    case ENTITY_TYPES.REFUND:
      return false; // Admin uniquement
    default:
      return false;
  }
};

/**
 * Checks if a manager can cancel an entity (soft delete or status change)
 */
export const canManagerCancel = (entityType) => {
  switch (entityType) {
    case ENTITY_TYPES.ORDER:
    case ENTITY_TYPES.DELIVERY:
    case ENTITY_TYPES.RESERVATION:
      return true;
    default:
      return false;
  }
};

/**
 * Checks if a manager can update/edit an entity
 */
export const canManagerUpdate = (entityType) => {
  // Managers can update almost everything operational, including stock
  return true; 
};

/**
 * Checks if a manager can access a specific page/module
 */
export const canManagerAccess = (pageName) => {
  if (!pageName) return false;
  
  if (pageName.toLowerCase() === 'stock_management' || pageName.toLowerCase() === 'stock-health') {
    return true;
  }

  const restrictedPages = [
    'settings',
    'backups',
    'migration',
    'trash',
    'logs'
  ];
  
  if (restrictedPages.includes(pageName.toLowerCase())) {
    return false;
  }
  return true;
};