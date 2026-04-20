import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAdminSettingsCached, clearAdminSettingsCache } from '@/lib/adminSettingsCache';
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

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    if (forceRefresh) clearAdminSettingsCache();
    const cachedSettings = await getAdminSettingsCached(restaurantId, forceRefresh);
    if (cachedSettings) {
      setSettings(cachedSettings);
      if (cachedSettings.restaurant_name) setActiveRestaurantName(cachedSettings.restaurant_name);
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <RestaurantContext.Provider value={{
      restaurantId,
      activeRestaurantName,
      settings,
      loading,
      error: null,
      refreshSettings: () => fetchSettings(true),
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