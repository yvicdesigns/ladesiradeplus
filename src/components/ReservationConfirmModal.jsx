import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';

export const ReservationConfirmModal = ({ open, onClose, reservation }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', reservation.id);

      if (error) throw error;

      toast({
        title: "Confirmed",
        description: "Reservation has been confirmed.",
        className: "bg-amber-500 text-white"
      });
      onClose();
    } catch (error) {
      console.error('Error confirming reservation:', error);
      toast({
        title: "Error",
        description: "Failed to confirm reservation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-2">
            <CheckCircle className="h-6 w-6" />
            <DialogTitle className="text-xl">Confirm Reservation</DialogTitle>
          </div>
          <DialogDescription className="text-foreground/80">
            Are you sure you want to confirm the reservation for <span className="font-bold">"{reservation.customer_name}"</span> on <span className="font-bold">{reservation.reservation_date}</span> at <span className="font-bold">{reservation.reservation_time}</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Reservation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};