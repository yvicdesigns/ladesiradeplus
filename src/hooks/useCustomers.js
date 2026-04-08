import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { executeWithResilience } from '@/lib/supabaseErrorHandler';
import { handleCustomerError } from '@/lib/customerErrorHandler';

export const useCustomers = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const fetchClients = useCallback(async ({ page = 1, limit = 50, search = '' } = {}) => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      
      setClients(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('[useCustomers] Fetch error:', err);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les clients.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const checkCustomerExists = async (phone) => {
    if (!phone) return null;
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('[useCustomers] Error checking phone existence:', err);
      return null;
    }
  };

  const checkCustomerByUserId = async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('[useCustomers] Error checking user_id existence:', err);
      return null;
    }
  };

  const createClient = async (clientData) => {
    try {
      if (clientData.phone) {
        const existing = await checkCustomerExists(clientData.phone);
        if (existing) {
          return { success: false, isDuplicate: true, existingCustomer: existing, message: "Ce numéro de téléphone est déjà utilisé." };
        }
      }
      
      let targetUserId = clientData.user_id || null;

      if (targetUserId) {
         const existingUser = await checkCustomerByUserId(targetUserId);
         if (existingUser) {
           return { success: false, isDuplicate: true, existingCustomer: existingUser, message: "Cet utilisateur a déjà un profil client." };
         }
      }

      const payload = {
        ...clientData,
        user_id: targetUserId,
      };

      const result = await executeWithResilience(async () => {
        const { data, error } = await supabase.from('customers').insert(payload).select().single();
        if (error) throw error;
        return data;
      });

      toast({ title: 'Succès', description: 'Client créé avec succès.' });
      return { success: true, data: result };
      
    } catch (err) {
      const parsedError = handleCustomerError(err);
      console.error('[useCustomers] Error in createClient:', err);
      toast({ variant: 'destructive', title: 'Erreur', description: parsedError.message });
      return { success: false, error: parsedError.message };
    }
  };

  const updateClient = async (id, updateData) => {
    try {
      const { source_client, restaurant_id, ...dataToUpdate } = updateData;
      const { data, error } = await supabase
        .from('customers')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .maybeSingle();
        
      if (error) throw error;
      toast({ title: 'Succès', description: 'Client mis à jour avec succès.' });
      return { success: true, data };
    } catch (err) {
      const parsedError = handleCustomerError(err);
      toast({ variant: 'destructive', title: 'Erreur', description: parsedError.message });
      return { success: false, error: parsedError.message };
    }
  };

  const deleteClient = async (id) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);
        
      if (error) throw error;
      toast({ title: 'Succès', description: 'Client supprimé.' });
      return true;
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
      return false;
    }
  };

  return {
    clients,
    customers: clients,
    loading,
    totalCount,
    fetchClients,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
    checkCustomerExists,
    checkCustomerByUserId
  };
};