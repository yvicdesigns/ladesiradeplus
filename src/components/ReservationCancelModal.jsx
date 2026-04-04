import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, XCircle } from 'lucide-react';

export const ReservationCancelModal = ({ open, onClose, reservation }) => {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const handleCancel = async () => {
    try {
      setLoading(true);
      // We'll append reason to notes if provided
      const updatedNotes = reason ? `${reservation.notes || ''} [Cancelled: ${reason}]` : reservation.notes;

      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled', notes: updatedNotes })
        .eq('id', reservation.id);

      if (error) throw error;

      toast({
        title: "Cancelled",
        description: "Reservation has been cancelled.",
        className: "bg-red-500 text-white"
      });
      onClose();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel reservation.",
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
          <div className="flex items-center gap-2 text-destructive mb-2">
            <XCircle className="h-6 w-6" />
            <DialogTitle className="text-xl">Cancel Reservation</DialogTitle>
          </div>
          <DialogDescription className="text-foreground/80">
            Are you sure you want to cancel the reservation for <span className="font-bold">"{reservation.customer_name}"</span>?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
           <Textarea 
             placeholder="Reason for cancellation (optional)" 
             value={reason}
             onChange={(e) => setReason(e.target.value)}
             className="bg-background"
           />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Keep Reservation
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel} 
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Reservation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};