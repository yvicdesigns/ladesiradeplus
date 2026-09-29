import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { MapPin, Plus, Loader2 } from 'lucide-react';

export const StockLocationsModal = ({ open, onClose, onChange }) => {
  const { toast } = useToast();
  const { role } = useAuth();
  const canManage = role === 'admin' || role === 'manager';
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('stock_locations').select('*').or('is_deleted.eq.false,is_deleted.is.null').order('is_default', { ascending: false }).order('name');
    setLocations(data || []);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const { error } = await supabase.from('stock_locations').insert({ name: newName.trim() });
    setCreating(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      return;
    }
    setNewName('');
    await load();
    onChange?.();
  };

  const handleDelete = async (loc) => {
    if (loc.is_default) return;
    if (!window.confirm(`Supprimer l'emplacement "${loc.name}" ?`)) return;
    await supabase.from('stock_locations').update({ is_deleted: true }).eq('id', loc.id);
    await load();
    onChange?.();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-amber-600" /> Emplacements de stock</DialogTitle>
          <DialogDescription>Magasin, cuisine, bar, chambre froide...</DialogDescription>
        </DialogHeader>

        {canManage && (
          <div className="flex gap-2">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nouvel emplacement" onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shrink-0">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        )}

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-400 italic">Chargement...</p>
          ) : locations.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun emplacement.</p>
          ) : locations.map(loc => (
            <div key={loc.id} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800">{loc.name}</span>
                {loc.is_default && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Par défaut</Badge>}
              </div>
              {!loc.is_default && canManage && (
                <button onClick={() => handleDelete(loc)} className="text-xs text-red-500 hover:text-red-700">Supprimer</button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
