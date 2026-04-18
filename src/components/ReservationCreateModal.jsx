import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { SoundButtonWrapper as Button } from '@/components/SoundButtonWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calendar, Clock, Users, User, Phone, Mail, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ReservationCreateModal = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // SOLUTION: Access restaurant context to get the valid restaurant_id
  const { restaurantId } = useRestaurant();

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Validation: Ensure restaurantId is available before attempting insert
      if (!restaurantId) {
        throw new Error("Erreur système: L'identifiant du restaurant est introuvable. Veuillez recharger la page.");
      }

      // Validate date is in future
      const reservationDateTime = new Date(`${data.date}T${data.time}`);
      if (reservationDateTime < new Date()) {
        throw new Error(t('admin.reservation_modal.error_future') || "La date doit être dans le futur.");
      }

      const payload = {
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        reservation_date: data.date,
        reservation_time: data.time,
        party_size: parseInt(data.guests_count),
        notes: data.special_requests,
        status: 'pending',
        user_id: (await supabase.auth.getUser()).data.user?.id,
        // SOLUTION: Explicitly include restaurant_id to satisfy NOT NULL foreign key constraint
        restaurant_id: restaurantId 
      };

      const { error } = await supabase
        .from('reservations')
        .insert([payload]);

      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }

      toast({
        title: t('admin.reservation_modal.success') || "Succès",
        description: t('admin.reservation_modal.success_msg') || "Réservation créée.",
        className: "bg-amber-500 text-white"
      });
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: t('admin.reservation_modal.error') || "Erreur",
        description: error.message || t('common.error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card text-foreground border-border max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('admin.reservation_modal.title') || "Nouvelle Réservation"}
          </DialogTitle>
          <DialogDescription>
            {t('admin.reservation_modal.desc') || "Créer manuellement une réservation."}
          </DialogDescription>
        </DialogHeader>

        {!restaurantId && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Attention: Le contexte du restaurant n'est pas chargé. La création échouera.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> {t('admin.reservation_modal.customer_name') || "Nom du client"}</Label>
              <Input
                {...register('customer_name', { required: t('common.required') || 'Requis' })}
                placeholder="Jean Dupont"
                className="text-foreground"
              />
              {errors.customer_name && <span className="text-xs text-red-500">{errors.customer_name.message}</span>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {t('admin.reservation_modal.phone') || "Téléphone"}</Label>
              <Input
                type="tel"
                {...register('customer_phone', {
                  required: t('common.required') || 'Requis',
                  validate: v => /^\d/.test(v.replace(/\D/g, '')) && v.replace(/\D/g, '').length >= 6 || 'Numéro invalide',
                  onChange: e => { e.target.value = e.target.value.replace(/[^\d\s+\-().]/g, ''); }
                })}
                placeholder="06 12 34 56 78"
                className="text-foreground"
              />
              {errors.customer_phone && <span className="text-xs text-red-500">{errors.customer_phone.message}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {t('admin.reservation_modal.email') || "Email"}</Label>
            <Input
              type="email"
              {...register('customer_email', { 
                required: t('common.required') || 'Requis',
                pattern: { value: /^\S+@\S+$/i, message: 'Email invalide' }
              })}
              placeholder="jean@exemple.com"
              className="text-foreground"
            />
            {errors.customer_email && <span className="text-xs text-red-500">{errors.customer_email.message}</span>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {t('admin.reservation_modal.date') || "Date"}</Label>
              <Input
                type="date"
                {...register('date', { required: t('common.required') || 'Requis' })}
                min={new Date().toISOString().split('T')[0]}
                className="text-foreground"
              />
              {errors.date && <span className="text-xs text-red-500">{errors.date.message}</span>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {t('admin.reservation_modal.time') || "Heure"}</Label>
              <Input
                type="time"
                {...register('time', { required: t('common.required') || 'Requis' })}
                className="text-foreground"
              />
              {errors.time && <span className="text-xs text-red-500">{errors.time.message}</span>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> {t('admin.reservation_modal.guests') || "Personnes"}</Label>
              <Input
                type="number"
                min="1"
                max="20"
                {...register('guests_count', { required: t('common.required') || 'Requis', min: 1 })}
                placeholder="2"
                className="text-foreground"
              />
              {errors.guests_count && <span className="text-xs text-red-500">{errors.guests_count.message}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('admin.reservation_modal.notes') || "Notes"}</Label>
            <Textarea
              {...register('special_requests')}
              placeholder={t('admin.reservation_modal.notes_placeholder') || "Demandes spéciales..."}
              className="min-h-[100px] text-foreground"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} soundType="click">
              {t('admin.reservation_modal.cancel') || "Annuler"}
            </Button>
            <Button type="submit" disabled={loading || !restaurantId} className="bg-primary text-primary-foreground" isLoading={loading} soundType="success">
              {t('admin.reservation_modal.create') || "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};