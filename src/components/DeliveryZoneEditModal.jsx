import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export const DeliveryZoneEditModal = ({ open, onClose, zone, onSave, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: '',
    delivery_fee: '',
    estimated_time: '',
    polygon_coordinates: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (zone && open) {
      setFormData({
        name: zone.name || '',
        delivery_fee: zone.delivery_fee !== null && zone.delivery_fee !== undefined ? String(zone.delivery_fee) : '',
        estimated_time: zone.estimated_time || '',
        polygon_coordinates: zone.polygon_coordinates 
          ? JSON.stringify(zone.polygon_coordinates, null, 2) 
          : ''
      });
      setErrors({});
    }
  }, [zone, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Le nom de la zone est requis';
    if (formData.delivery_fee === '' || isNaN(formData.delivery_fee) || Number(formData.delivery_fee) < 0) {
      newErrors.delivery_fee = 'Un frais de livraison valide est requis';
    }
    
    if (formData.polygon_coordinates.trim()) {
      try {
        JSON.parse(formData.polygon_coordinates);
      } catch (e) {
        newErrors.polygon_coordinates = 'Format JSON invalide pour les coordonnées';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const dataToSave = {
        name: formData.name.trim(),
        delivery_fee: parseFloat(formData.delivery_fee),
        estimated_time: formData.estimated_time.trim() || null,
        polygon_coordinates: formData.polygon_coordinates.trim() ? JSON.parse(formData.polygon_coordinates.trim()) : null
      };
      onSave(dataToSave);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        // Fix: Only trigger onClose if isOpen is false (dialog is closing) and not currently submitting
        if (!isOpen && !isSubmitting) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier la zone de livraison</DialogTitle>
          <DialogDescription>
            Ajustez les détails de la zone {zone?.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la zone *</Label>
            <Input 
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="ex: Centre-ville"
              className={errors.name ? "border-destructive" : ""}
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
                step="0.01"
                value={formData.delivery_fee}
                onChange={handleChange}
                placeholder="ex: 1000"
                className={errors.delivery_fee ? "border-destructive" : ""}
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

          <div className="space-y-2">
            <Label htmlFor="polygon_coordinates">Coordonnées (JSON) - Optionnel</Label>
            <Textarea 
              id="polygon_coordinates"
              name="polygon_coordinates"
              value={formData.polygon_coordinates}
              onChange={handleChange}
              placeholder='[{"lat": -4.269, "lng": 15.283}, ...]'
              rows={4}
              className={`font-mono text-xs ${errors.polygon_coordinates ? "border-destructive" : ""}`}
            />
            {errors.polygon_coordinates && <p className="text-xs text-destructive">{errors.polygon_coordinates}</p>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};