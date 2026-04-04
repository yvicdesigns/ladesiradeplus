export const CustomerErrorTypes = {
  DUPLICATE_PHONE: 'duplicate_phone',
  DUPLICATE_USER_ID: 'duplicate_user_id',
  DUPLICATE_EMAIL: 'duplicate_email',
  INVALID_USER: 'invalid_user',
  UNKNOWN_CONSTRAINT: 'unknown_constraint',
  NETWORK_ERROR: 'network_error',
  UNKNOWN: 'unknown'
};

export const handleCustomerError = (error) => {
  if (!error) return { type: CustomerErrorTypes.UNKNOWN, message: "Une erreur inconnue est survenue." };

  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';

  // Handle Unique Constraint Violations
  if (code === '23505' || msg.includes('duplicate key value') || msg.includes('unique constraint')) {
    if (msg.includes('phone')) {
      return { 
        type: CustomerErrorTypes.DUPLICATE_PHONE, 
        message: "Un client avec ce numéro de téléphone existe déjà pour ce restaurant." 
      };
    }
    if (msg.includes('user_id') || msg.includes('customers_user_restaurant')) {
      return { 
        type: CustomerErrorTypes.DUPLICATE_USER_ID, 
        message: "Ce compte utilisateur est déjà associé à un client dans ce restaurant." 
      };
    }
    if (msg.includes('email')) {
      return { 
        type: CustomerErrorTypes.DUPLICATE_EMAIL, 
        message: "Un client avec cette adresse email existe déjà." 
      };
    }
    return {
      type: CustomerErrorTypes.UNKNOWN_CONSTRAINT,
      message: "Un client avec des informations identiques (téléphone, email ou identifiant) existe déjà."
    };
  }

  // Handle Foreign Key Violations
  if (code === '23503' || msg.includes('foreign key constraint')) {
    if (msg.includes('user_id')) {
      return {
        type: CustomerErrorTypes.INVALID_USER,
        message: "L'utilisateur associé à ce client n'existe pas. Veuillez créer un client sans le lier à un compte inexistant."
      };
    }
  }

  // Handle Network Errors
  if (msg.includes('network') || msg.includes('fetch')) {
    return {
      type: CustomerErrorTypes.NETWORK_ERROR,
      message: "Erreur de connexion au serveur. Veuillez vérifier votre internet."
    };
  }

  return {
    type: CustomerErrorTypes.UNKNOWN,
    message: error.message || "Une erreur inattendue est survenue lors de l'enregistrement."
  };
};