import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MessageSquare } from 'lucide-react';

export const ReviewResponseModal = ({ open, onClose, review, onSuccess }) => {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (review && open) {
      // If there's a previous response that starts with "REJECTION REASON:" or "FLAGGED:", don't prefill it for editing as a public response
      const existingResponse = review.response || '';
      if (existingResponse.startsWith('REJECTION REASON:') || existingResponse.startsWith('FLAGGED:')) {
        setResponse('');
      } else {
        setResponse(existingResponse);
      }
    }
  }, [review, open]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('reviews')
        .update({ 
          response: response,
          response_date: new Date().toISOString()
        })
        .eq('id', review.id);

      if (error) throw error;

      toast({
        title: "Response Submitted",
        description: "Your response has been saved.",
        className: "bg-primary text-primary-foreground"
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Response error:', error);
      toast({
        title: "Error",
        description: "Failed to submit response.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!review) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-2">
            <MessageSquare className="h-6 w-6" />
            <DialogTitle className="text-xl">Respond to Review</DialogTitle>
          </div>
          <DialogDescription>
            Write a public response to {review.customer_name}'s review.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground border border-border italic">
            "{review.content.length > 150 ? review.content.substring(0, 150) + '...' : review.content}"
          </div>

          <div className="space-y-2">
            <Label>Your Response</Label>
            <Textarea 
              placeholder="Thank you for your feedback..." 
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading}
            className="bg-primary text-primary-foreground"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};