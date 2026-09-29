import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeftRight } from 'lucide-react';

export const StockTransferModal = ({ open, onClose, ingredients, locations, ingredient, onSuccess }) => {
  const { toast } = useToast();
  const [ingredientId, setIngredientId] = useState(ingredient?.id || '');
  const [qty, setQty] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setIngredientId(ingredient?.id || '');
      setQty('');
      setFromLocation('');
      setToLocation('');
      setNotes('');
    }
  }, [open, ingredient?.id]);

  const handleSubmit = async () => {
    if (!ingredientId || !qty || Number(qty) <= 0 || !fromLocation || !toLocation) {
      toast({ variant: 'destructive', title: 'Champs invalides', description: 'Ingrédient, quantité et emplacements sont requis.' });
      return;
    }
    if (fromLocation === toLocation) {
      toast({ variant: 'destructive', title: 'Emplacements identiques', description: "L'origine et la destination doivent être différentes." });
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc('record_stock_transfer', {
      p_ingredient_id: ingredientId,
      p_qty: Number(qty),
      p_from_location_id: fromLocation,
      p_to_location_id: toLocation,
      p_notes: notes || null,
    });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      return;
    }
    toast({ title: 'Transfert enregistré' });
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5 text-blue-600" /> Transfert entre emplacements</DialogTitle>
          <DialogDescription>Ne change pas le stock total, juste sa répartition.</DialogDescription>
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
              <Label>De</Label>
              <Select value={fromLocation} onValueChange={setFromLocation}>
                <SelectTrigger><SelectValue placeholder="Origine" /></SelectTrigger>
                <SelectContent>
                  {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vers</Label>
              <Select value={toLocation} onValueChange={setToLocation}>
                <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                <SelectContent>
                  {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Quantité</Label>
            <Input type="number" min="0" step="any" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" />
          </div>

          <div className="space-y-1.5">
            <Label>Observation (facultatif)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer le transfert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
