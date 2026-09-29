import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Truck, Plus, Loader2, Phone, Mail } from 'lucide-react';

export const SuppliersModal = ({ open, onClose, onChange }) => {
  const { toast } = useToast();
  const { role } = useAuth();
  const canManage = role === 'admin' || role === 'manager';
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('suppliers').select('*').or('is_deleted.eq.false,is_deleted.is.null').order('name');
    setSuppliers(data || []);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    const { error } = await supabase.from('suppliers').insert({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      is_active: true,
    });
    setCreating(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      return;
    }
    setForm({ name: '', phone: '', email: '' });
    await load();
    onChange?.();
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(`Supprimer le fournisseur "${supplier.name}" ?`)) return;
    await supabase.from('suppliers').update({ is_deleted: true }).eq('id', supplier.id);
    await load();
    onChange?.();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-amber-600" /> Fournisseurs</DialogTitle>
          <DialogDescription>Utilisés pour tracer l'origine et le prix de chaque entrée de stock.</DialogDescription>
        </DialogHeader>

        {canManage && (
          <div className="space-y-2 border border-slate-100 bg-slate-50 rounded-lg p-3">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom du fournisseur" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Téléphone" />
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" />
            </div>
            <Button onClick={handleCreate} disabled={creating || !form.name.trim()} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ajouter
            </Button>
          </div>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-400 italic">Chargement...</p>
          ) : suppliers.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun fournisseur.</p>
          ) : suppliers.map(s => (
            <div key={s.id} className="flex justify-between items-center bg-white border border-slate-100 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{s.name}</p>
                <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                  {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</span>}
                  {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</span>}
                </div>
              </div>
              {canManage && (
                <button onClick={() => handleDelete(s)} className="text-xs text-red-500 hover:text-red-700 shrink-0">Supprimer</button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
