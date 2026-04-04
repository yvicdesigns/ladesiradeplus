import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ThumbsDown } from 'lucide-react';

export const ReviewRejectModal = ({ open, onClose, review, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReject = async () => {
    try {
      setLoading(true);
      
      const updateData = { 
        status: 'rejected'
      };
      
      // If a reason is provided, we can store it as an internal note in the response field.
      if (reason.trim()) {
        updateData.response = `REJECTION REASON: ${reason}`;
        updateData.response_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', review.id);

      if (error) throw error;

      toast({
        title: "Review Rejected",
        description: "The review has been rejected.",
        className: "bg-red-500 text-white"
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Reject error:', error);
      toast({
        title: "Error",
        description: "Failed to reject review.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <ThumbsDown className="h-6 w-6" />
            <DialogTitle className="text-xl">Reject Review?</DialogTitle>
          </div>
          <DialogDescription>
            Rejecting this review will hide it from the public.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-2">
          <Label>Reason for rejection (Internal)</Label>
          <Textarea 
            placeholder="e.g. Spam content, inappropriate language..." 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            disabled={loading}
            variant="destructive"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reject Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};