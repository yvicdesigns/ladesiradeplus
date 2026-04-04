import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const SINGLE_RESTAURANT_ID = '7eedf081-0268-4867-af38-61fa5932420a';

export const useDeliveryZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchZones = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('restaurant_id', SINGLE_RESTAURANT_ID)
        .order('name');

      if (error) throw error;
      setZones(data || []);
    } catch (err) {
      console.error('Error fetching delivery zones:', err);
      setError(err);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Impossible de charger les zones de livraison" 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const findZoneByAddress = (address, city) => {
    if (!zones.length || (!address && !city)) return null;
    
    const normalize = (str) => str ? str.toLowerCase().trim() : '';
    const normCity = normalize(city);
    const normAddress = normalize(address);

    let matchedZone = zones.find(z => normalize(z.name) === normCity);

    if (!matchedZone) {
      matchedZone = zones.find(z => normalize(z.name).includes(normCity) || normCity.includes(normalize(z.name)));
    }

    if (!matchedZone && normAddress) {
      matchedZone = zones.find(z => normAddress.includes(normalize(z.name)));
    }

    return matchedZone || null;
  };

  const getZoneDetails = (zoneId) => {
    return zones.find(z => z.id === zoneId) || null;
  };

  return {
    zones,
    loading,
    error,
    findZoneByAddress,
    getZoneDetails,
    refresh: fetchZones
  };
};