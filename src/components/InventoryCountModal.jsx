import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { formatCurrency } from '@/lib/formatters';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useInventoryCountItems } from '@/hooks/useSuperStock';
import { ClipboardCheck, Loader2, CheckCircle2 } from 'lucide-react';

export const InventoryCountModal = ({ count, open, onClose, onValidated }) => {
  const { role } = useAuth();
  const { toast } = useToast();
  const canValidate = role === 'admin' || role === 'manager';
  const { items, loading, refetch } = useInventoryCountItems(count?.id);
  const [localCounts, setLocalCounts] = useState({});
  const [validating, setValidating] = useState(false);

  const isValidated = count?.status === 'validated';

  const getCounted = (item) => {
    if (item.id in localCounts) return localCounts[item.id];
    return item.counted_qty ?? '';
  };

  const handleBlur = async (item, value) => {
    if (value === '' || value === null) return;
    const num = Number(value);
    if (Number.isNaN(num)) return;
    if (num === item.counted_qty) return;
    await supabase.from('inventory_count_items').update({ counted_qty: num, updated_at: new Date().toISOString() }).eq('id', item.id);
    refetch();
  };

  const handleValidate = async () => {
    setValidating(true);
    const { error } = await supabase.rpc('validate_inventory_count', { p_inventory_count_id: count.id });
    setValidating(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
      return;
    }
    toast({ title: 'Inventaire validé', description: 'Les écarts ont été enregistrés comme mouvements de stock.' });
    onValidated?.();
    onClose();
  };

  if (!count) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-600" /> Inventaire
              </DialogTitle>
              <DialogDescription className="mt-1">{count.notes || 'Aucune observation'}</DialogDescription>
            </div>
            {isValidated ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1"><CheckCircle2 className="w-3 h-3" /> Validé</Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">En cours</Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrédient</TableHead>
                  <TableHead className="text-right">Théorique</TableHead>
                  <TableHead className="text-right w-32">Compté</TableHead>
                  <TableHead className="text-right">Écart</TableHead>
                  <TableHead className="text-right">Valeur écart</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">Chargement...</TableCell></TableRow>
                ) : items.map(item => {
                  const counted = getCounted(item);
                  const variance = counted !== '' ? Number(counted) - Number(item.theoretical_qty) : null;
                  const varianceValue = variance !== null ? variance * Number(item.unit_cost_at_count || 0) : null;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-slate-900">{item.ingredients?.name || 'Ingrédient'} <span className="text-slate-400 font-normal">({item.ingredients?.unit})</span></TableCell>
                      <TableCell className="text-right tabular-nums">{item.theoretical_qty}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="any"
                          disabled={isValidated}
                          value={counted}
                          onChange={e => setLocalCounts(s => ({ ...s, [item.id]: e.target.value }))}
                          onBlur={e => handleBlur(item, e.target.value)}
                          className="text-right h-9"
                        />
                      </TableCell>
                      <TableCell className={`text-right font-bold tabular-nums ${variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {variance === null ? '—' : (variance > 0 ? '+' : '') + variance}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-slate-500">
                        {varianceValue === null ? '—' : formatCurrency(varianceValue)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 bg-slate-50 border-t flex-row justify-between items-center">
          <p className="text-xs text-slate-400">
            {canValidate ? 'La validation génère les mouvements d\'ajustement correspondant aux écarts.' : 'Seul un manager ou admin peut valider cet inventaire.'}
          </p>
          {!isValidated && canValidate && (
            <Button onClick={handleValidate} disabled={validating} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
              {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Valider l'inventaire
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
