import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export const CustomerEditModal = ({ open, onClose, customer, onSuccess }) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (customer && open) {
      setValue('name', customer.name);
      setValue('email', customer.email);
      setValue('phone', customer.phone);
      setValue('address', customer.address);
      setValue('city', customer.city);
      setValue('postal_code', customer.postal_code);
      setValue('country', customer.country);
      setValue('notes', customer.notes);
    }
  }, [customer, open, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        country: data.country,
        notes: data.notes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('customers')
        .update(payload)
        .eq('id', customer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer profile updated.",
        className: "bg-amber-500 text-white"
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Update customer error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update customer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>Modify customer details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input id="edit-name" {...register('name', { required: 'Name is required' })} />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" {...register('email', { required: 'Email is required' })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" {...register('phone', { required: 'Phone is required' })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address">Address</Label>
            <Input id="edit-address" {...register('address', { required: 'Address is required' })} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-city">City</Label>
              <Input id="edit-city" {...register('city', { required: 'City is required' })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-postal">Postal Code</Label>
              <Input id="edit-postal" {...register('postal_code', { required: 'Postal Code is required' })} />
            </div>
            <div className="col-span-2 md:col-span-1 space-y-2">
              <Label htmlFor="edit-country">Country</Label>
              <Input id="edit-country" {...register('country', { required: 'Country is required' })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" {...register('notes')} className="min-h-[100px]" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
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