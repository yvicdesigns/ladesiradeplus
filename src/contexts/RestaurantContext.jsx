import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAdminSettingsCached } from '@/lib/adminSettingsCache';
import { VALID_RESTAURANT_ID, getValidatedRestaurantId } from '@/lib/restaurantValidation';

const RestaurantContext = createContext({
  restaurantId: VALID_RESTAURANT_ID,
  activeRestaurantName: 'La Desirade Plus',
  settings: null,
  loading: false,
  error: null
});

export const RestaurantProvider = ({ children }) => {
  // Ensure we start with a valid fallback ID
  const [restaurantId] = useState(getValidatedRestaurantId(VALID_RESTAURANT_ID));
  const [activeRestaurantName, setActiveRestaurantName] = useState('La Desirade Plus');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchSettings = async () => {
      setLoading(true);
      console.log('[RestaurantContext] Initializing with Restaurant ID:', restaurantId);
      
      // Uses the new caching layer and fast RPC
      const cachedSettings = await getAdminSettingsCached(restaurantId);
      
      if (isMounted) {
        if (cachedSettings) {
          setSettings(cachedSettings);
          if (cachedSettings.restaurant_name) {
            setActiveRestaurantName(cachedSettings.restaurant_name);
          }
        } else {
           console.warn('[RestaurantContext] No settings found for restaurant:', restaurantId);
        }
        setLoading(false);
      }
    };

    fetchSettings();
    
    return () => { isMounted = false; };
  }, [restaurantId]);

  return (
    <RestaurantContext.Provider value={{ 
      restaurantId, 
      activeRestaurantName,
      settings,
      loading,
      error: null
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};