import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { useQRCode } from '@/hooks/useQRCode';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { handleSingleQueryError } from '@/lib/supabaseErrorHandler';

export const TableEditModal = ({ open, onClose, table, onSuccess, restaurantId: propRestaurantId }) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { regenerateQRCode, loading: qrLoading } = useQRCode();
  const { restaurantId: contextRestaurantId } = useRestaurant();
  
  const restaurantId = propRestaurantId || contextRestaurantId;

  // Fetch the latest table data defensively when the modal opens
  useEffect(() => {
    const fetchTableData = async () => {
      if (open && table && restaurantId) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('tables')
            .select('*')
            .eq('table_number', table.table_number)
            .eq('restaurant_id', restaurantId)
            .maybeSingle();

          if (error) {
            const handled = handleSingleQueryError(error);
            if (handled) throw new Error(handled.message);
            throw error;
          }

          if (!data) {
            toast({
              title: "Table introuvable",
              description: "Cette table n'existe plus ou a été supprimée.",
              variant: "destructive"
            });
            onClose();
          } else {
            setValue('table_number', data.table_number);
            setValue('capacity', data.capacity);
            setValue('location', data.location);
            setValue('notes', data.notes || '');
          }
        } catch (err) {
          toast({
            title: "Erreur",
            description: "Impossible de charger les données de la table.",
            variant: "destructive"
          });
          onClose();
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTableData();
  }, [open, table, restaurantId, setValue, toast, onClose]);

  const onSubmit = async (data) => {
    if (!restaurantId) {
      toast({
        title: "Erreur de contexte",
        description: "L'identifiant du restaurant est manquant. Impossible de mettre à jour.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Check for duplicate table number if changed, using maybeSingle()
      if (data.table_number !== table.table_number) {
        const { data: existing, error: checkError } = await supabase
          .from('tables')
          .select('id')
          .eq('table_number', data.table_number)
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        if (checkError) {
          const handled = handleSingleQueryError(checkError);
          if (handled && handled.code !== 'PGRST116') throw checkError;
        }

        if (existing) {
          throw new Error('Ce numéro de table existe déjà pour ce restaurant.');
        }
      }

      const payload = {
        table_number: data.table_number,
        capacity: parseInt(data.capacity),
        location: data.location,
        notes: data.notes,
        restaurant_id: restaurantId
      };

      const { error } = await supabase
        .from('tables')
        .update(payload)
        .eq('id', table.id)
        .eq('restaurant_id', restaurantId);
      
      if (error) {
        if (error.code === '23503' && error.message.includes('restaurant_id')) {
           throw new Error("Violation de contrainte de clé étrangère sur le restaurant.");
        }
        throw error;
      }

      toast({
        title: "Succès",
        description: "Table mise à jour avec succès.",
        className: "bg-amber-500 text-white"
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la mise à jour de la table.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQR = async (e) => {
    e.preventDefault();
    if (!table) return;
    
    if (confirm("Êtes-vous sûr de vouloir régénérer le code QR ? L'ancien code cessera de fonctionner si la structure de l'URL change.")) {
       await regenerateQRCode(table.id, table.table_number);
       onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Modifier la Table</DialogTitle>
          <DialogDescription>Modifiez les détails de la table.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_table_number">Numéro de Table</Label>
              <Input
                id="edit_table_number"
                {...register('table_number', { required: 'Le numéro de table est requis' })}
                className="text-foreground"
                disabled={loading}
              />
              {errors.table_number && <span className="text-xs text-red-500">{errors.table_number.message}</span>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_capacity">Capacité (Places)</Label>
              <Input
                id="edit_capacity"
                type="number"
                min="1"
                {...register('capacity', { required: 'La capacité est requise', min: 1 })}
                className="text-foreground"
                disabled={loading}
              />
              {errors.capacity && <span className="text-xs text-red-500">{errors.capacity.message}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_location">Emplacement / Zone</Label>
            <Input
              id="edit_location"
              {...register('location', { required: "L'emplacement est requis" })}
              className="text-foreground"
              disabled={loading}
            />
            {errors.location && <span className="text-xs text-red-500">{errors.location.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_notes">Notes (Facultatif)</Label>
            <Textarea
              id="edit_notes"
              {...register('notes')}
              className="text-foreground"
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border">
             <div className="flex flex-col">
                <span className="text-sm font-medium">Code QR</span>
                <span className="text-xs text-muted-foreground">Régénérer si endommagé ou mis à jour</span>
             </div>
             <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRegenerateQR}
                disabled={qrLoading || loading}
                type="button"
             >
                <RefreshCw className={`h-3 w-3 mr-2 ${qrLoading ? 'animate-spin' : ''}`} />
                Régénérer
             </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};