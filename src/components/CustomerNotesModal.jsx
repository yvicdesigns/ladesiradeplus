import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export const CustomerNotesModal = ({ open, onClose, customer, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (customer && open) {
      setNotes(customer.notes || '');
    }
  }, [customer, open]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('customers')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', customer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notes updated successfully.",
        className: "bg-amber-500 text-white"
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Update notes error:', error);
      toast({
        title: "Error",
        description: "Failed to update notes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Customer Notes: {customer.name}</DialogTitle>
          <DialogDescription>Add or edit private notes for this customer.</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="min-h-[200px]"
            placeholder="Enter notes here..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-primary text-primary-foreground">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};