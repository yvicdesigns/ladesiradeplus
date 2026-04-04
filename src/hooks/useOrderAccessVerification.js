import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const CACHE_KEY = 'admin_order_access_verification';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useOrderAccessVerification = () => {
  const [canAccess, setCanAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diagnosticData, setDiagnosticData] = useState(null);

  const verifyAccess = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setCanAccess(data.is_admin_or_staff_result);
            setDiagnosticData(data);
            setIsLoading(false);
            return data;
          }
        }
      }

      const { data, error: rpcError } = await supabase.rpc('diagnose_admin_order_access');
      
      if (rpcError) throw rpcError;

      setCanAccess(data?.is_admin_or_staff_result === true);
      setDiagnosticData(data);
      
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));

      return data;
    } catch (err) {
      console.error('[OrderAccessVerification] Error:', err);
      setError(err.message);
      setCanAccess(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyAccess();
  }, [verifyAccess]);

  return { canAccess, isLoading, error, diagnosticData, refetch: () => verifyAccess(true) };
};