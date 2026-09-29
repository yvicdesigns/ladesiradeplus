import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PackagePlus } from 'lucide-react';

export const StockEntryModal = ({ open, onClose, ingredients, ingredient, onSuccess }) => {
  const { toast } = useToast();
  const [ingredientId, setIngredientId] = useState(ingredient?.id || '');
  const [qty, setQty] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setIngredientId(ingredient?.id || '');
      setQty('');
      setUnitCost('');
      setNotes('');
    }
  }, [open, ingredient?.id]);

  const handleSubmit = async () => {
    if (!ingredientId || !qty || Number(qty) <= 0 || unitCost === '' || Number(unitCost) < 0) {
      toast({ variant: 'destructive', title: 'Champs invalides', description: 'Ingrédient, quantité et prix d\'achat sont requis.' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc('record_stock_entry', {
      p_ingredient_id: ingredientId,
      p_qty: Number(qty),
      p_unit_cost: Number(unitCost),
      p_notes: notes || null,
    });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      return;
    }
    toast({ title: 'Entrée enregistrée', description: `+${qty} ajouté au stock.` });
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5 text-emerald-600" /> Nouvelle entrée de stock</DialogTitle>
          <DialogDescription>Crée un nouveau lot FIFO pour cet ingrédient.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Ingrédient</Label>
            {ingredient ? (
              <p className="text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">{ingredient.name}</p>
            ) : (
              <Select value={ingredientId} onValueChange={setIngredientId}>
                <SelectTrigger><SelectValue placeholder="Choisir un ingrédient" /></SelectTrigger>
                <SelectContent>
                  {ingredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantité</Label>
              <Input type="number" min="0" step="any" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Prix d'achat (unitaire)</Label>
              <Input type="number" min="0" step="any" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observation (facultatif)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Fournisseur, numéro de facture..." rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer l\'entrée'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
