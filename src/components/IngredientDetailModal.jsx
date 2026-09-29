import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/customSupabaseClient';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { History, MapPin, User, Hash, PackagePlus, PackageMinus } from 'lucide-react';

const MOVEMENT_LABELS = {
  entry: 'Entrée', usage: 'Sortie (vente)', return: 'Retour', waste: 'Perte',
  breakage: 'Casse', expiry: 'Péremption', gift: 'Offert',
  internal_consumption: 'Conso. interne', other: 'Autre', adjustment: 'Ajustement',
  inventory_adjustment: 'Ajust. inventaire', order_cancelled: 'Commande annulée',
  transfer_in: 'Transfert entrant', transfer_out: 'Transfert sortant',
};

function StatusBadge({ status }) {
  if (status === 'RUPTURE') return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Rupture</Badge>;
  if (status === 'FAIBLE') return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">Stock faible</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">Normal</Badge>;
}

export const IngredientDetailModal = ({ ingredient, open, onClose, onRequestEntry, onRequestExit }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !ingredient?.id) return;
    setLoading(true);
    supabase
      .from('stock_movements')
      .select('*, profiles(full_name, email)')
      .eq('ingredient_id', ingredient.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMovements(data || []);
        setLoading(false);
      });
  }, [open, ingredient?.id]);

  // Running balance: movement quantities already carry their sign (+entry/-usage/...),
  // so replaying them in chronological order reconstructs stock-before/stock-after.
  const timeline = useMemo(() => {
    let running = 0;
    const withBalance = movements.map(m => {
      const before = running;
      running += Number(m.quantity);
      return { ...m, before, after: running };
    });
    return withBalance.reverse();
  }, [movements]);

  const lastEntry = movements.filter(m => m.movement_type === 'entry').slice(-1)[0];
  const lastExit = movements.filter(m => Number(m.quantity) < 0).slice(-1)[0];

  if (!ingredient) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900">{ingredient.name}</DialogTitle>
              <DialogDescription className="mt-1 text-slate-500">
                {ingredient.category || 'Sans catégorie'} · {ingredient.unit}
              </DialogDescription>
            </div>
            <StatusBadge status={ingredient.status} />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-500">Stock actuel</p>
                <p className="font-bold text-slate-900">{ingredient.current_stock} {ingredient.unit}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-500">Stock minimum</p>
                <p className="font-bold text-slate-900">{ingredient.min_stock ?? '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-500">Coût moyen</p>
                <p className="font-bold text-slate-900">{formatCurrency(ingredient.avgCost)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-500">Valeur du stock</p>
                <p className="font-bold text-slate-900">{formatCurrency(ingredient.value)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {ingredient.locationNames.length > 0 ? ingredient.locationNames.join(', ') : 'Aucun emplacement'}</span>
              {lastEntry && <span>Dernière entrée : {formatDateTime(lastEntry.created_at)}</span>}
              {lastExit && <span>Dernière sortie : {formatDateTime(lastExit.created_at)}</span>}
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2 mb-3">
                <History className="w-4 h-4 text-slate-500" /> Historique des mouvements
              </h3>

              {loading ? (
                <p className="text-sm text-slate-400 italic">Chargement...</p>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Aucun mouvement enregistré pour cet ingrédient.</p>
              ) : (
                <div className="space-y-3">
                  {timeline.map(m => (
                    <div key={m.id} className="flex justify-between items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={Number(m.quantity) < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                            {MOVEMENT_LABELS[m.movement_type] || m.movement_type}
                          </Badge>
                          <span className="text-xs text-slate-400">{formatDateTime(m.created_at)}</span>
                        </div>
                        {m.notes && <p className="text-xs text-slate-500 mt-1">{m.notes}</p>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          {m.profiles?.full_name && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {m.profiles.full_name}</span>}
                          {m.reference_id && <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {String(m.reference_id).slice(0, 8)}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold ${Number(m.quantity) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {Number(m.quantity) > 0 ? '+' : ''}{m.quantity} {ingredient.unit}
                        </p>
                        <p className="text-xs text-slate-400">{m.before} → {m.after}</p>
                        {m.unit_cost != null && <p className="text-xs text-slate-400">{formatCurrency(m.unit_cost)}/{ingredient.unit}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {(onRequestEntry || onRequestExit) && (
          <DialogFooter className="p-4 bg-slate-50 border-t flex-row justify-end gap-2">
            {onRequestExit && (
              <Button variant="outline" onClick={() => onRequestExit(ingredient)} className="gap-2 border-red-200 text-red-700 hover:bg-red-50">
                <PackageMinus className="h-4 w-4" /> Sortie
              </Button>
            )}
            {onRequestEntry && (
              <Button onClick={() => onRequestEntry(ingredient)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <PackagePlus className="h-4 w-4" /> Entrée
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
