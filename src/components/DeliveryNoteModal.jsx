import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDeliveries } from '@/hooks/useDeliveries';
import { Loader2 } from 'lucide-react';

export const DeliveryNoteModal = ({ open, onClose, delivery }) => {
  const { addTrackingNote, loading } = useDeliveries();
  const [note, setNote] = useState('');

  const handleSubmit = async () => {
    if (!note.trim()) return;
    const success = await addTrackingNote(delivery.id, delivery.status, note);
    if (success) {
      setNote('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Tracking Note</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Note Content</Label>
            <Textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter details about current location or situation..."
              className="h-32"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !note.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};