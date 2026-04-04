import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, MapPin, Users, Clock, FileText, Hash, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { handleSingleQueryError } from '@/lib/supabaseErrorHandler';

export const TableDetailModal = ({ open, onClose, table, onEdit, onDelete }) => {
  const [localTable, setLocalTable] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && table && table.restaurant_id) {
      const fetchTableDetails = async () => {
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
            setLocalTable(null); // Table not found
          } else {
            setLocalTable(data);
          }
        } catch (err) {
          console.error("Failed to fetch table details", err);
          setLocalTable(null);
        } finally {
          setLoading(false);
        }
      };
      
      fetchTableDetails();
    } else {
      setLocalTable(null);
    }
  }, [open, table]);

  if (!open) return null;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px] flex justify-center items-center h-48">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </DialogContent>
      </Dialog>
    );
  }

  if (!localTable) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
               <AlertCircle className="h-5 w-5" />
               <DialogTitle>Table introuvable</DialogTitle>
            </div>
            <DialogDescription className="mt-2">
              Cette table n'existe plus ou a été supprimée. Vous ne pouvez plus afficher ses détails.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-amber-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-blue-500';
      case 'maintenance': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const DetailRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center text-muted-foreground">
        <Icon className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value || 'N/A'}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Détails de la table</DialogTitle>
            <Badge className={`${getStatusColor(localTable.status)} text-white border-0 capitalize`}>
              {localTable.status}
            </Badge>
          </div>
          <DialogDescription>Informations pour la Table {localTable.table_number}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-1">
          <DetailRow icon={Hash} label="Numéro de table" value={localTable.table_number} />
          <DetailRow icon={Users} label="Capacité" value={`${localTable.capacity} Places`} />
          <DetailRow icon={MapPin} label="Emplacement" value={localTable.location} />
          <DetailRow 
            icon={Clock} 
            label="Créée le" 
            value={localTable.created_at ? format(new Date(localTable.created_at), 'PPP') : 'N/A'} 
          />
          
          <div className="pt-4">
             <div className="flex items-center text-muted-foreground mb-1">
                <FileText className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Notes</span>
             </div>
             <div className="bg-muted p-3 rounded-md text-sm">
                {localTable.notes || 'Aucune note disponible.'}
             </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={onClose}>
            Fermer
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="secondary" onClick={() => onEdit(localTable)} className="flex-1 sm:flex-none">
              <Edit className="h-4 w-4 mr-2" /> Éditer
            </Button>
            <Button variant="destructive" onClick={() => onDelete(localTable)} className="flex-1 sm:flex-none">
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};