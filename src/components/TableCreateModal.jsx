import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { generateQRCode } from '@/lib/qrCodeUtils';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { handleSingleQueryError } from '@/lib/supabaseErrorHandler';

export const TableCreateModal = ({ open, onClose, onSuccess, restaurantId: propRestaurantId }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { restaurantId: contextRestaurantId } = useRestaurant();
  
  const restaurantId = propRestaurantId || contextRestaurantId;

  const onSubmit = async (data) => {
    if (!restaurantId) {
      toast({
        title: "Erreur de contexte",
        description: "L'identifiant du restaurant est manquant. Impossible de créer la table.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Check for duplicate table number within the same restaurant using maybeSingle to avoid errors
      const { data: existing, error: checkError } = await supabase
        .from('tables')
        .select('id')
        .eq('table_number', data.table_number)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (checkError) {
        const handledError = handleSingleQueryError(checkError);
        if (!handledError?.error || handledError.code !== 'PGRST116') {
          throw checkError;
        }
      }

      if (existing) {
        throw new Error('Ce numéro de table existe déjà pour ce restaurant.');
      }
      
      const payload = {
        table_number: data.table_number,
        capacity: parseInt(data.capacity),
        location: data.location,
        notes: data.notes,
        status: 'available',
        restaurant_id: restaurantId
      };

      const { data: newTable, error: insertError } = await supabase
        .from('tables')
        .insert([payload])
        .select()
        .maybeSingle();
      
      if (insertError) {
        if (insertError.code === '23503' && insertError.message.includes('restaurant_id')) {
           throw new Error("L'identifiant du restaurant n'est pas valide ou n'existe pas.");
        }
        throw insertError;
      }

      if (newTable) {
        // Generate QR Code now that we have an ID
        try {
          const { qrCodeDataUrl, url } = await generateQRCode(newTable.id);
          
          await supabase
            .from('tables')
            .update({
              qr_code: qrCodeDataUrl,
              qr_code_url: url,
              qr_generated_at: new Date().toISOString()
            })
            .eq('id', newTable.id);
            
        } catch (qrError) {
          console.error("QR Generation failed on create", qrError);
          toast({
            title: "Avertissement",
            description: "La table a été créée mais la génération du QR code a échoué.",
            variant: "warning"
          });
        }
      }

      toast({
        title: "Succès",
        description: "Table créée avec succès avec son code QR.",
        className: "bg-amber-500 text-white"
      });
      
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Create error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la création de la table.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Ajouter une Nouvelle Table</DialogTitle>
          <DialogDescription>Créez une nouvelle table. Un code QR sera automatiquement généré.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="table_number">Numéro de Table</Label>
              <Input
                id="table_number"
                placeholder="ex: T-12"
                {...register('table_number', { required: 'Le numéro de table est requis' })}
                className="text-foreground"
              />
              {errors.table_number && <span className="text-xs text-red-500">{errors.table_number.message}</span>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacité (Places)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="4"
                {...register('capacity', { required: 'La capacité est requise', min: 1 })}
                className="text-foreground"
              />
              {errors.capacity && <span className="text-xs text-red-500">{errors.capacity.message}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Emplacement / Zone</Label>
            <Input
              id="location"
              placeholder="ex: Salle Principale, Terrasse"
              {...register('location', { required: "L'emplacement est requis" })}
              className="text-foreground"
            />
            {errors.location && <span className="text-xs text-red-500">{errors.location.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Facultatif)</Label>
            <Textarea
              id="notes"
              placeholder="ex: Près de la fenêtre"
              {...register('notes')}
              className="text-foreground"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Création..." : "Créer la Table"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};