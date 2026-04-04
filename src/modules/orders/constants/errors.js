export const ORDER_ERRORS = {
  NOT_FOUND: { code: 'ORDER_001', message: 'La commande n\'a pas pu être trouvée.' },
  CREATION_FAILED: { code: 'ORDER_002', message: 'Échec de la création de la commande. Veuillez réessayer.' },
  UPDATE_FAILED: { code: 'ORDER_003', message: 'Impossible de mettre à jour le statut de la commande.' },
  CANCEL_REJECTED: { code: 'ORDER_004', message: 'Cette commande ne peut plus être annulée car elle est déjà en cours de traitement.' },
  STOCK_INSUFFICIENT: { code: 'ORDER_005', message: 'Stock insuffisant pour certains articles de votre commande.' },
  VALIDATION_ERROR: { code: 'ORDER_006', message: 'Les données de la commande sont invalides.' },
  UNAUTHORIZED: { code: 'ORDER_007', message: 'Vous n\'êtes pas autorisé à effectuer cette action.' },
};

export class OrderError extends Error {
  constructor(errorType, details = null) {
    super(errorType.message);
    this.name = 'OrderError';
    this.code = errorType.code;
    this.details = details;
  }
}