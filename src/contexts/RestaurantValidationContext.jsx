import React, { createContext, useContext } from 'react';

// Neutralized shell context since validation is now universally true
const RestaurantValidationContext = createContext({
  isValidating: false,
  isValid: true,
  error: null,
  restaurantId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  revalidate: async () => {}
});

export const RestaurantValidationProvider = ({ children }) => {
  return (
    <RestaurantValidationContext.Provider value={{ 
      isValidating: false, 
      isValid: true, 
      error: null, 
      restaurantId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 
      revalidate: async () => {} 
    }}>
      {children}
    </RestaurantValidationContext.Provider>
  );
};

export const useRestaurantValidation = () => useContext(RestaurantValidationContext);