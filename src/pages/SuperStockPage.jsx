import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { useSuperStock, useSuperStockMovements } from '@/hooks/useSuperStock';
import { IngredientDetailModal } from '@/components/IngredientDetailModal';
import { StockEntryModal } from '@/components/StockEntryModal';
import { StockExitModal } from '@/components/StockExitModal';
import {
  Warehouse, Search, RefreshCw, AlertTriangle, PackageX, CheckCircle2,
  TrendingDown, TrendingUp, History, Wallet, Boxes, PackagePlus, PackageMinus
} from 'lucide-react';

const MOVEMENT_LABELS = {
  entry: 'Entrée', usage: 'Sortie (vente)', return: 'Retour', waste: 'Perte',
  breakage: 'Casse', expiry: 'Péremption', gift: 'Offert',
  internal_consumption: 'Conso. interne', other: 'Autre', adjustment: 'Ajustement',
  inventory_adjustment: 'Ajust. inventaire', order_cancelled: 'Commande annulée',
  transfer_in: 'Transfert entrant', transfer_out: 'Transfert sortant',
};

const PERIODS = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
];

function getPeriodRange(period) {
  const now = new Date();
  let from;
  if (period === 'today') {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    from = new Date(now);
    from.setDate(now.getDate() - 7);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { fromISO: from.toISOString(), toISO: now.toISOString() };
}

// Enriches each ingredient with FIFO-derived valuation (weighted avg cost across
// remaining lots), the locations currently holding stock, and an alert status.
function useIngredientStats(ingredients, lots, locations) {
  return useMemo(() => {
    const locationsById = {};
    locations.forEach(l => { locationsById[l.id] = l; });

    const lotsByIngredient = {};
    lots.forEach(lot => {
      if (!lotsByIngredient[lot.ingredient_id]) lotsByIngredient[lot.ingredient_id] = [];
      lotsByIngredient[lot.ingredient_id].push(lot);
    });

    return ingredients.map(ing => {
      const ingLots = lotsByIngredient[ing.id] || [];
      const lotQty = ingLots.reduce((s, l) => s + Number(l.quantity_remaining), 0);
      const lotValue = ingLots.reduce((s, l) => s + Number(l.quantity_remaining) * Number(l.unit_cost), 0);
      const avgCost = lotQty > 0 ? lotValue / lotQty : Number(ing.unit_cost) || 0;
      const value = lotQty > 0 ? lotValue : Number(ing.current_stock || 0) * (Number(ing.unit_cost) || 0);
      const locationNames = [...new Set(ingLots.map(l => locationsById[l.location_id]?.name).filter(Boolean))];

      const stock = Number(ing.current_stock || 0);
      let status = 'NORMAL';
      if (stock <= 0) status = 'RUPTURE';
      else if (ing.min_stock != null && stock < Number(ing.min_stock)) status = 'FAIBLE';

      return { ...ing, avgCost, value, locationNames, status };
    });
  }, [ingredients, lots, locations]);
}

function StatusBadge({ status }) {
  if (status === 'RUPTURE') return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Rupture</Badge>;
  if (status === 'FAIBLE') return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">Stock faible</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">Normal</Badge>;
}

function DashboardTab({ ingredientsWithStats, loading, onRefresh }) {
  const [period, setPeriod] = useState('today');
  const { fromISO, toISO } = useMemo(() => getPeriodRange(period), [period]);
  const { movements: periodMovements, loading: movementsLoading } = useSuperStockMovements(fromISO, toISO);

  const totalValue = ingredientsWithStats.reduce((s, i) => s + i.value, 0);
  const totalRefs = ingredientsWithStats.length;
  const outOfStock = ingredientsWithStats.filter(i => i.status === 'RUPTURE').length;
  const belowMin = ingredientsWithStats.filter(i => i.status === 'FAIBLE').length;

  const sumByTypes = (types) => periodMovements
    .filter(m => types.includes(m.movement_type))
    .reduce((s, m) => s + Math.abs(Number(m.quantity)), 0);
  const valueByTypes = (types) => periodMovements
    .filter(m => types.includes(m.movement_type))
    .reduce((s, m) => s + Math.abs(Number(m.value) || 0), 0);

  const entries = sumByTypes(['entry']);
  const exits = sumByTypes(['usage', 'internal_consumption', 'other']);
  const losses = sumByTypes(['waste', 'breakage', 'expiry']);
  const lossValue = valueByTypes(['waste', 'breakage', 'expiry']);
  const gifts = sumByTypes(['gift']);

  const topConsumed = useMemo(() => {
    const byIngredient = {};
    periodMovements.filter(m => Number(m.quantity) < 0).forEach(m => {
      const key = m.ingredient_id;
      if (!byIngredient[key]) byIngredient[key] = { name: m.ingredients?.name || 'Ingrédient', unit: m.ingredients?.unit, qty: 0 };
      byIngredient[key].qty += Math.abs(Number(m.quantity));
    });
    return Object.values(byIngredient).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [periodMovements]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${period === p.key ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2 self-start sm:self-auto"><RefreshCw className="h-4 w-4" /> Actualiser</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-emerald-50 rounded-lg"><Wallet className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-xs text-slate-500">Valeur du stock</p><p className="text-xl font-bold text-slate-800">{formatCurrency(totalValue)}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-blue-50 rounded-lg"><Boxes className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-xs text-slate-500">Références</p><p className="text-2xl font-bold text-slate-800">{totalRefs}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-yellow-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div>
          <div><p className="text-xs text-slate-500">Sous stock minimum</p><p className="text-2xl font-bold text-yellow-600">{belowMin}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-red-50 rounded-lg"><PackageX className="h-5 w-5 text-red-600" /></div>
          <div><p className="text-xs text-slate-500">Ruptures</p><p className="text-2xl font-bold text-red-600">{outOfStock}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Entrées</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{movementsLoading ? '…' : entries}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-slate-500" /> Sorties</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{movementsLoading ? '…' : exits}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Pertes (qté)</p>
          <p className="text-xl font-bold text-red-600 mt-1">{movementsLoading ? '…' : losses}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Valeur des pertes</p>
          <p className="text-xl font-bold text-red-600 mt-1">{movementsLoading ? '…' : formatCurrency(lossValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 text-sm">Produits les plus consommés</h3>
          {topConsumed.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun mouvement sur cette période.</p>
          ) : (
            <div className="space-y-2">
              {topConsumed.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="font-bold text-slate-900">{item.qty} {item.unit || ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2"><History className="h-4 w-4" /> Derniers mouvements</h3>
          {loading || movementsLoading ? (
            <p className="text-sm text-slate-400 italic">Chargement...</p>
          ) : periodMovements.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Aucun mouvement sur cette période.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {periodMovements.slice(0, 8).map(m => (
                <div key={m.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                  <div>
                    <p className="text-slate-700 font-medium">{m.ingredients?.name || 'Ingrédient'}</p>
                    <p className="text-xs text-slate-400">{MOVEMENT_LABELS[m.movement_type] || m.movement_type} · {formatDateTime(m.created_at)}</p>
                  </div>
                  <span className={`font-bold ${Number(m.quantity) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {Number(m.quantity) > 0 ? '+' : ''}{m.quantity} {m.ingredients?.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {gifts > 0 && (
        <p className="text-xs text-slate-400">Offerts sur la période : {gifts}</p>
      )}
    </div>
  );
}

function CurrentStockTab({ ingredientsWithStats, loading, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filterAlert, setFilterAlert] = useState(false);
  const [detailIngredient, setDetailIngredient] = useState(null);
  const [entryModal, setEntryModal] = useState({ open: false, ingredient: null });
  const [exitModal, setExitModal] = useState({ open: false, ingredient: null });

  const filtered = useMemo(() => {
    let r = ingredientsWithStats;
    if (search) r = r.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.category || '').toLowerCase().includes(search.toLowerCase()));
    if (filterAlert) r = r.filter(i => i.status !== 'NORMAL');
    return r;
  }, [ingredientsWithStats, search, filterAlert]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Rechercher un ingrédient ou une catégorie..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <button
          onClick={() => setFilterAlert(v => !v)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${filterAlert ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <AlertTriangle className="h-4 w-4" /> {filterAlert ? 'Voir tout' : 'Alertes uniquement'}
        </button>
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2"><RefreshCw className="h-4 w-4" /></Button>
        <Button size="sm" onClick={() => setEntryModal({ open: true, ingredient: null })} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"><PackagePlus className="h-4 w-4" /> Entrée</Button>
        <Button size="sm" onClick={() => setExitModal({ open: true, ingredient: null })} className="gap-2 bg-red-600 hover:bg-red-700 text-white"><PackageMinus className="h-4 w-4" /> Sortie</Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrédient</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Emplacement</TableHead>
              <TableHead className="text-right">Stock disponible</TableHead>
              <TableHead className="text-right">Stock minimum</TableHead>
              <TableHead className="text-right">Coût moyen</TableHead>
              <TableHead className="text-right">Valeur du stock</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">Chargement...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-400">Aucun ingrédient trouvé.</TableCell></TableRow>
            ) : filtered.map(ing => (
              <TableRow key={ing.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setDetailIngredient(ing)}>
                <TableCell className="font-medium text-slate-900">{ing.name}</TableCell>
                <TableCell className="text-slate-500">{ing.category || '—'}</TableCell>
                <TableCell className="text-slate-500">{ing.locationNames.length > 0 ? ing.locationNames.join(', ') : '—'}</TableCell>
                <TableCell className="text-right font-bold tabular-nums">{ing.current_stock} {ing.unit}</TableCell>
                <TableCell className="text-right text-slate-500 tabular-nums">{ing.min_stock ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(ing.avgCost)}</TableCell>
                <TableCell className="text-right font-bold tabular-nums">{formatCurrency(ing.value)}</TableCell>
                <TableCell><StatusBadge status={ing.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <IngredientDetailModal
        ingredient={detailIngredient}
        open={!!detailIngredient}
        onClose={() => setDetailIngredient(null)}
        onRequestEntry={(ing) => { setDetailIngredient(null); setEntryModal({ open: true, ingredient: ing }); }}
        onRequestExit={(ing) => { setDetailIngredient(null); setExitModal({ open: true, ingredient: ing }); }}
      />
      <StockEntryModal
        open={entryModal.open}
        ingredient={entryModal.ingredient}
        ingredients={ingredientsWithStats}
        onClose={() => setEntryModal({ open: false, ingredient: null })}
        onSuccess={onRefresh}
      />
      <StockExitModal
        open={exitModal.open}
        ingredient={exitModal.ingredient}
        ingredients={ingredientsWithStats}
        onClose={() => setExitModal({ open: false, ingredient: null })}
        onSuccess={onRefresh}
      />
    </div>
  );
}

export const SuperStockPage = () => {
  const [tab, setTab] = useState('dashboard');
  const { ingredients, lots, locations, loading, refetch } = useSuperStock();
  const ingredientsWithStats = useIngredientStats(ingredients, lots, locations);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Warehouse className="h-8 w-8 text-amber-600" /> Super Stock
          </h1>
          <p className="text-slate-500 mt-1">Centre de contrôle des matières premières — valorisation FIFO, mouvements tracés.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl gap-1">
            <TabsTrigger value="dashboard" className="gap-2 font-medium px-5 py-2 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Boxes className="h-4 w-4" /> Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="current" className="gap-2 font-medium px-5 py-2 rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <CheckCircle2 className="h-4 w-4" /> Stock actuel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-5">
            <DashboardTab ingredientsWithStats={ingredientsWithStats} loading={loading} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="current" className="mt-5">
            <CurrentStockTab ingredientsWithStats={ingredientsWithStats} loading={loading} onRefresh={refetch} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SuperStockPage;
