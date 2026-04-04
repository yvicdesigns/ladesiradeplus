import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calendar, Clock, Users, User, Phone, Mail } from 'lucide-react';

export const ReservationEditModal = ({ open, onClose, reservation }) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (reservation) {
      setValue('customer_name', reservation.customer_name || '');
      setValue('customer_email', reservation.customer_email || '');
      setValue('customer_phone', reservation.customer_phone || '');
      setValue('date', reservation.reservation_date);
      setValue('time', reservation.reservation_time);
      setValue('guests_count', reservation.party_size);
      setValue('special_requests', reservation.notes || '');
    }
  }, [reservation, setValue, open]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        reservation_date: data.date,
        reservation_time: data.time,
        party_size: parseInt(data.guests_count),
        notes: data.special_requests,
      };

      const { error } = await supabase
        .from('reservations')
        .update(payload)
        .eq('id', reservation.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reservation updated successfully.",
        className: "bg-amber-500 text-white"
      });
      onClose();
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update reservation.",
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
            Edit Reservation
          </DialogTitle>
          <DialogDescription>
            Modify details for Reservation #{reservation?.id?.slice(0,6)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Customer Name</Label>
              <Input
                {...register('customer_name', { required: 'Name is required' })}
              />
              {errors.customer_name && <span className="text-xs text-red-500">{errors.customer_name.message}</span>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> Phone</Label>
              <Input
                {...register('customer_phone', { required: 'Phone is required' })}
              />
              {errors.customer_phone && <span className="text-xs text-red-500">{errors.customer_phone.message}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Email</Label>
            <Input
              type="email"
              {...register('customer_email', { 
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
              })}
            />
            {errors.customer_email && <span className="text-xs text-red-500">{errors.customer_email.message}</span>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Date</Label>
              <Input
                type="date"
                {...register('date', { required: 'Date is required' })}
              />
              {errors.date && <span className="text-xs text-red-500">{errors.date.message}</span>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Time</Label>
              <Input
                type="time"
                {...register('time', { required: 'Time is required' })}
              />
              {errors.time && <span className="text-xs text-red-500">{errors.time.message}</span>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Guests</Label>
              <Input
                type="number"
                min="1"
                {...register('guests_count', { required: 'Required', min: 1 })}
              />
              {errors.guests_count && <span className="text-xs text-red-500">{errors.guests_count.message}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Special Requests / Notes</Label>
            <Textarea
              {...register('special_requests')}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};