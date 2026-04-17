import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Loader2 } from 'lucide-react';

export const EditProfileModal = ({ isOpen, onClose, profileData, customerData, onProfileUpdate }) => {
  const { user } = useAuth();
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: profileData?.full_name || '',
        phone: profileData?.phone || '',
        address: customerData?.address || '',
        city: customerData?.city || ''
      });
      setErrors({});
    }
  }, [profileData, customerData, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (formData.full_name.length < 2) newErrors.full_name = "Le nom est trop court.";
    if (formData.address && formData.address.length < 5) newErrors.address = "L'adresse doit contenir au moins 5 caractères.";
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // 1. Update profile — if no row exists yet (e.g. Google user), insert one
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        if (profileError) throw profileError;
      } else {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: formData.full_name,
            phone: formData.phone,
            role: 'customer',
          });
        if (profileError) throw profileError;
      }

      // 2. Update customers table only if a record already exists (restaurant_id is NOT NULL so we can't insert without it)
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingCustomer) {
        const { error: customerError } = await supabase
          .from('customers')
          .update({
            name: formData.full_name,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (customerError) throw customerError;
      } else if (restaurantId) {
        // Create customer record for the first time (requires restaurant_id)
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            user_id: user.id,
            email: user.email,
            name: formData.full_name,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            restaurant_id: restaurantId,
            registration_date: new Date().toISOString(),
          });

        if (customerError) throw customerError;
      }

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès.",
        className: "bg-green-600 text-white"
      });
      
      if (onProfileUpdate) onProfileUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la mise à jour. Veuillez réessayer.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
          <DialogDescription>
            Mettez à jour vos informations personnelles et de livraison.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Votre nom"
              className={errors.full_name ? "border-red-500" : ""}
            />
            {errors.full_name && <span className="text-xs text-red-500">{errors.full_name}</span>}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+242..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Adresse de livraison</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Votre adresse (Quartier, Rue...)"
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && <span className="text-xs text-red-500">{errors.address}</span>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Brazzaville, Pointe-Noire..."
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#D97706] hover:bg-[#d94e0b] text-white">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};