import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRestaurant } from '@/contexts/RestaurantContext';

export const DeliveryZoneCreateModal = ({ open, onClose, onSuccess }) => {
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', delivery_fee: '', estimated_time: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom de la zone est requis';
    if (formData.delivery_fee === '' || isNaN(formData.delivery_fee) || Number(formData.delivery_fee) < 0) {
      newErrors.delivery_fee = 'Un frais de livraison valide est requis';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('delivery_zones').insert({
        name: formData.name.trim(),
        delivery_fee: parseFloat(formData.delivery_fee),
        estimated_time: formData.estimated_time.trim() || null,
        restaurant_id: restaurantId,
      });
      if (error) throw error;
      toast({ title: 'Zone créée', description: `La zone "${formData.name}" a été ajoutée.`, className: 'bg-green-600 text-white' });
      setFormData({ name: '', delivery_fee: '', estimated_time: '' });
      setErrors({});
      onSuccess?.();
      onClose();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message || 'Impossible de créer la zone.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setFormData({ name: '', delivery_fee: '', estimated_time: '' });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Nouvelle Zone de Livraison
          </DialogTitle>
          <DialogDescription>
            Définissez le nom, les frais et le temps estimé de livraison.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la zone *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="ex: Centre-ville, Quartier Nord..."
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_fee">Frais de livraison (FCFA) *</Label>
              <Input
                id="delivery_fee"
                name="delivery_fee"
                type="number"
                min="0"
                value={formData.delivery_fee}
                onChange={handleChange}
                placeholder="ex: 1500"
                className={errors.delivery_fee ? 'border-destructive' : ''}
              />
              {errors.delivery_fee && <p className="text-xs text-destructive">{errors.delivery_fee}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_time">Temps estimé</Label>
              <Input
                id="estimated_time"
                name="estimated_time"
                value={formData.estimated_time}
                onChange={handleChange}
                placeholder="ex: 30-45 min"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer la zone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
