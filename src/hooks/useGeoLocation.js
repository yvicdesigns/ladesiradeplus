import { useState, useCallback } from 'react';

export const useGeoLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    setLocation(null);

    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoading(false);
      },
      (err) => {
        let errorMessage = "Erreur inconnue";
        switch(err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Permission GPS refusée";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "GPS non disponible";
            break;
          case err.TIMEOUT:
            errorMessage = "Délai d'attente dépassé";
            break;
          default:
            errorMessage = "Erreur de localisation";
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, []);

  return { location, error, loading, requestLocation };
};