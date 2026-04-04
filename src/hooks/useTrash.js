import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export function useTrash() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const restoreMultiple = async (items) => {
    setLoading(true);
    let success = true;
    try {
      for (const item of items) {
         const table = item.source_table || 'orders';
         const { error } = await supabase.from(table).update({ is_deleted: false, deleted_at: null }).eq('id', item.id);
         if (error) throw error;
      }
      toast({ title: "Restauration réussie", className: "bg-green-600 text-white" });
    } catch (error) {
      success = false;
      toast({ title: "Erreur de restauration", description: error.message, variant: "destructive" });
    }
    setLoading(false);
    return success;
  };

  const deleteMultiplePermanently = async (items) => {
    setLoading(true);
    let success = true;
    try {
      for (const item of items) {
         const table = item.source_table || 'orders';
         
         // Hard delete dependencies first if dealing with base orders to avoid FK errors
         if (table === 'orders') {
             await supabase.from('order_items').delete().eq('order_id', item.id);
             await supabase.from('delivery_orders').delete().eq('order_id', item.id);
             await supabase.from('restaurant_orders').delete().eq('order_id', item.id);
             await supabase.from('payments').delete().eq('order_id', item.id);
         }
         
         const { error } = await supabase.from(table).delete().eq('id', item.id);
         if (error) throw error;
      }
      toast({ title: "Suppression définitive réussie", className: "bg-green-600 text-white" });
    } catch (error) {
      success = false;
      toast({ title: "Erreur de suppression", description: error.message, variant: "destructive" });
    }
    setLoading(false);
    return success;
  };

  return { restoreMultiple, deleteMultiplePermanently, loading };
}