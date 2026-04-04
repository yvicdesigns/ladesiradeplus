import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { executeWithResilience } from '@/lib/supabaseErrorHandler';

export const softDeleteEventEmitter = {
  listeners: [],
  subscribe(callback) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(l => l !== callback); };
  },
  emit(eventData) {
    this.listeners.forEach(l => l(eventData));
  }
};

export const useSoftDelete = (tableName) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const deleteRecord = async (recordId, reason = null) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Vous devez être connecté pour effectuer cette action.");

      const depsData = await executeWithResilience(async () => {
        const { data, error } = await supabase.rpc('get_dependencies', {
          p_table_name: tableName,
          p_record_id: recordId
        });
        if (error) throw error;
        return data;
      }, { context: `Check dependencies for ${tableName}` });

      const deps = depsData || [];
      
      if (deps.length > 0) {
        setLoading(false);
        return new Promise((resolve) => {
          softDeleteEventEmitter.emit({
            open: true,
            dependencies: deps,
            onClose: () => resolve({ data: null, error: new Error('Cancelled'), success: false }),
            onDeleteAnyway: async () => {
              setLoading(true);
              const res = await executeDelete(tableName, recordId, user?.id, reason, false);
              setLoading(false);
              resolve(res);
            },
            onCascadeDelete: async () => {
              setLoading(true);
              const res = await executeDelete(tableName, recordId, user?.id, reason, true);
              setLoading(false);
              resolve(res);
            }
          });
        });
      }

      const result = await executeDelete(tableName, recordId, user?.id, reason, false);
      return result;

    } catch (error) {
      console.error(`[useSoftDelete] Delete failed for ${tableName}:${recordId}`, error);
      toast({ variant: 'destructive', title: 'Erreur de suppression', description: error.message });
      setLoading(false);
      return { data: null, error, success: false };
    }
  };

  const executeDelete = async (table, id, userId, reason, isCascade) => {
    try {
      if (isCascade) {
        const data = await executeWithResilience(async () => {
          const { data: resData, error } = await supabase.rpc('delete_with_cascade', {
            p_table_name: table,
            p_record_id: id,
            p_user_id: userId,
            p_cascade: true
          });
          if (error) throw error;
          return resData;
        }, { context: `Cascade delete ${table}` });
        
        if (!data?.success) throw new Error(data?.message || 'Échec de la suppression en cascade');
        
        toast({ title: 'Supprimé en cascade', description: `L'enregistrement et ses ${data.deleted_count - 1} dépendances ont été supprimés.`, className: 'bg-green-600 text-white' });
        return { data, error: null, success: true };
      } else {
        const data = await executeWithResilience(async () => {
          const { data: resData, error } = await supabase.rpc('delete_record_with_audit', {
            table_name: table,
            record_id: id,
            user_id: userId,
            reason: reason
          });
          if (error) throw error;
          return resData;
        }, { context: `Soft delete ${table}` });
        
        if (!data?.success) {
          throw new Error(data?.message || "Échec de la suppression. Veuillez vérifier vos permissions d'administrateur.");
        }
        
        toast({ title: 'Supprimé', description: 'L\'enregistrement a été supprimé avec succès.', className: 'bg-green-600 text-white' });
        return { data, error: null, success: true };
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Échec de la suppression', description: error.message });
      return { data: null, error, success: false };
    }
  };

  const restoreRecord = async (recordId, reason = null) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const data = await executeWithResilience(async () => {
        const { data: resData, error } = await supabase.rpc('restore_record_with_audit', {
          table_name: tableName,
          record_id: recordId,
          user_id: user?.id,
          reason: reason
        });
        if (error) throw error;
        return resData;
      }, { context: `Restore ${tableName}` });

      if (!data?.success) throw new Error(data?.message || 'Échec de la restauration');

      toast({ title: 'Restauré', description: 'L\'enregistrement a été restauré.', className: 'bg-green-600 text-white' });
      return { data, error: null, success: true };
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      return { data: null, error, success: false };
    } finally {
      setLoading(false);
    }
  };

  return { deleteRecord, restoreRecord, loading };
};