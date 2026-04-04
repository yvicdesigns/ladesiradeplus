import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { handleSingleQueryError } from '@/lib/supabaseErrorHandler';

export const TableStatusModal = ({ open, onClose, table, onSuccess }) => {
  const [status, setStatus] = useState(table?.status || 'available');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLatestStatus = async () => {
      if (open && table && table.restaurant_id) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('tables')
            .select('*')
            .eq('table_number', table.table_number)
            .eq('restaurant_id', table.restaurant_id)
            .maybeSingle();

          if (error) {
            const handled = handleSingleQueryError(error);
            if (handled) throw new Error(handled.message);
            throw error;
          }

          if (!data) {
            toast({
              title: "Table introuvable",
              description: "Cette table n'existe plus ou a été supprimée.",
              variant: "destructive"
            });
            onClose();
          } else {
            setStatus(data.status);
          }
        } catch (err) {
          console.error("Error fetching status:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchLatestStatus();
  }, [open, table, toast, onClose]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tables')
        .update({ status })
        .eq('id', table.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Table ${table.table_number} is now ${status}.`,
        className: "bg-amber-500 text-white"
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Status update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change Table Status</DialogTitle>
          <DialogDescription>Update the current status for Table {table?.table_number}.</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading} className="bg-primary text-primary-foreground">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};