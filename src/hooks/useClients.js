import { RESTAURANT_ID } from '@/lib/adminSettingsUtils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/logger';
import { withTimeout, retryWithExponentialBackoff } from '@/lib/networkResilience';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';

const DEFAULT_RESTAURANT_ID = RESTAURANT_ID;

export function useClients(filters = {}, page = 1, limit = 50) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

  const isMounted = useRef(true);

  const fetchClients = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      // Fetch manual customers (admin-added)
      let customersQuery = supabase
        .from('customers')
        .select('*')
        .or('is_deleted.eq.false,is_deleted.is.null');

      // Fetch real app users (profiles with role=customer)
      let profilesQuery = supabase
        .from('profiles')
        .select('id, user_id, full_name, email, phone, created_at, photo_url')
        .eq('role', 'customer');

      if (filters?.search) {
        const s = filters.search;
        customersQuery = customersQuery.or(`name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
        profilesQuery = profilesQuery.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
      }

      const [customersRes, profilesRes] = await Promise.all([
        customersQuery.order('created_at', { ascending: false }).limit(500),
        profilesQuery.order('created_at', { ascending: false }).limit(500),
      ]);

      if (customersRes.error) throw customersRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const manualCustomers = (customersRes.data || []);

      // Convert profiles to same shape as customers, skip those already in customers (matched by user_id)
      const manualUserIds = new Set(manualCustomers.map(c => c.user_id).filter(Boolean));
      const profileCustomers = (profilesRes.data || [])
        .filter(p => !manualUserIds.has(p.user_id))
        .map(p => ({
          id: p.id,
          user_id: p.user_id,
          name: p.full_name || p.email || 'Client',
          email: p.email,
          phone: p.phone,
          photo_url: p.photo_url,
          created_at: p.created_at,
          source_client: 'app',
          is_deleted: false,
        }));

      const merged = [...manualCustomers, ...profileCustomers]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (isMounted.current) {
        setClients(merged);
        setTotalCount(merged.length);
        setError(null);
      }
    } catch (err) {
      logger.error('Error fetching clients:', err);
      if (isMounted.current) {
        setError(err);
        setClients([]);
        setTotalCount(0);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [filters?.search, page, limit]);

  useEffect(() => {
    isMounted.current = true;
    fetchClients();
    return () => { isMounted.current = false; };
  }, [fetchClients]);

  const createClient = async (clientData) => {
    try {
      const dataToInsert = { ...clientData, restaurant_id: DEFAULT_RESTAURANT_ID };
      const { data, error } = await supabase.from('customers').insert([dataToInsert]).select().single();
      if (error) throw error;
      await fetchClients();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const updateClient = async (id, clientData) => {
    try {
      const { data, error } = await supabase.from('customers').update(clientData).eq('id', id).select().single();
      if (error) throw error;
      await fetchClients();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const deleteClient = async (id) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);
        
      if (error) throw error;
      await fetchClients();
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  return {
    clients, loading, error, totalCount, refresh: fetchClients, createClient, updateClient, deleteClient
  };
}