import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ThumbsUp } from 'lucide-react';

export const ReviewApproveModal = ({ open, onClose, review, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('reviews')
        .update({ 
          status: 'approved'
        })
        .eq('id', review.id);

      if (error) throw error;

      toast({
        title: "Review Approved",
        description: "The review is now visible to the public.",
        className: "bg-amber-500 text-white"
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Approve error:', error);
      toast({
        title: "Error",
        description: "Failed to approve review.",
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
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <ThumbsUp className="h-6 w-6" />
            <DialogTitle className="text-xl">Approve Review?</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to approve the review by <strong>{review.customer_name}</strong>? It will become publicly visible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};