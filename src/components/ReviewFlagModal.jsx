import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Flag } from 'lucide-react';

export const ReviewFlagModal = ({ open, onClose, review, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFlag = async () => {
    if (!reason.trim()) {
      toast({
        title: "Required",
        description: "Please provide a reason for flagging.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('reviews')
        .update({ 
          status: 'flagged',
          response: `FLAGGED: ${reason}` // Storing flag reason in response field for admin visibility
        })
        .eq('id', review.id);

      if (error) throw error;

      toast({
        title: "Review Flagged",
        description: "Review has been marked for attention.",
        className: "bg-amber-500 text-white"
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Flag error:', error);
      toast({
        title: "Error",
        description: "Failed to flag review.",
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
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Flag className="h-6 w-6" />
            <DialogTitle className="text-xl">Flag Review</DialogTitle>
          </div>
          <DialogDescription>
            Flag this review for further investigation. It will be hidden pending review.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2 py-2">
          <Label>Reason for flagging <span className="text-red-500">*</span></Label>
          <Textarea 
            placeholder="e.g. Fake review, competitor spam..." 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleFlag} 
            disabled={loading}
            className="bg-amber-500 hover:bg-green-600 text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Flag Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};