import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StockMovementHistoryPanel } from '@/components/StockMovementHistoryPanel';
import { QuickEditMenuItemStockModal } from '@/components/QuickEditMenuItemStockModal';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Package, History, FlaskConical, Search, Edit2, AlertTriangle,
  PackageX, CheckCircle2, RefreshCw, TrendingDown, Utensils,
  GlassWater, ChevronDown, ChevronRight, Plus, Trash2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CRITICAL = 5;
const LOW = 10;

function StockBar({ value, max }) {
  if (value === null || max === null || max === 0) return <span className="text-xs text-slate-400">∞</span>;
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = value < CRITICAL ? 'bg-red-500' : value < LOW ? 'bg-yellow-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-2 min-w-[60px]">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums ${value < CRITICAL ? 'text-red-600' : value < LOW ? 'text-yellow-600' : 'text-emerald-700'}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ value }) {
  if (value === null) return <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-xs">Illimité</Badge>;
  if (value === 0) return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Épuisé</Badge>;
  if (value < CRITICAL) return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Critique</Badge>;
  if (value < LOW) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">Faible</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">Normal</Badge>;
}

// ──────────────────────────────────────────────
// TAB 1 — Plats (menu item stock)
// ──────────────────────────────────────────────
function PlatStockTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAlert, setFilterAlert] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('menu_items')
      .select('id, name, stock_quantity, price, is_available, image_url, menu_categories(name, is_beverage)')
      .or('is_deleted.eq.false,is_deleted.is.null')
      .order('name');
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('plat_stock').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, load).subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const filtered = useMemo(() => {
    let r = items;
    if (search) r = r.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.menu_categories?.name || '').toLowerCase().includes(search.toLowerCase()));
    if (filterAlert) r = r.filter(i => i.stock_quantity !== null && i.stock_quantity < LOW);
    return r;
  }, [items, search, filterAlert]);

  const totalItems = items.length;
  const criticalCount = items.filter(i => i.stock_quantity !== null && i.stock_quantity < CRITICAL).length;
  const lowCount = items.filter(i => i.stock_quantity !== null && i.stock_quantity >= CRITICAL && i.stock_quantity < LOW).length;
  const okCount = items.filter(i => i.stock_quantity === null || i.stock_quantity >= LOW).length;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-blue-50 rounded-lg"><Utensils className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-xs text-slate-500">Total plats</p><p className="text-2xl font-bold text-slate-800">{totalItems}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-xs text-slate-500">Normal / Illimité</p><p className="text-2xl font-bold text-emerald-700">{okCount}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-yellow-50 rounded-lg"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div>
          <div><p className="text-xs text-slate-500">Stock faible</p><p className="text-2xl font-bold text-yellow-600">{lowCount}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-red-50 rounded-lg"><PackageX className="h-5 w-5 text-red-600" /></div>
          <div><p className="text-xs text-slate-500">Critique / Épuisé</p><p className="text-2xl font-bold text-red-600">{criticalCount}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Rechercher un plat ou une catégorie..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <button
          onClick={() => setFilterAlert(v => !v)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${filterAlert ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <AlertTriangle className="h-4 w-4" /> {filterAlert ? 'Voir tout' : 'Alertes uniquement'}
        </button>
        <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[280px]">Plat</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead className="w-[180px]">Niveau de stock</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6} className="h-14 animate-pulse bg-slate-50/60" /></TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-slate-400">Aucun résultat.</TableCell></TableRow>
            ) : filtered.map(item => (
              <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                      : <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100"><span className="text-lg">🍽️</span></div>}
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      {item.menu_categories?.is_beverage && (
                        <span className="text-xs text-blue-600 flex items-center gap-1"><GlassWater className="h-3 w-3" /> Boisson</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50 text-slate-600 text-xs">{item.menu_categories?.name || '—'}</Badge>
                </TableCell>
                <TableCell className="text-slate-700 font-medium">{formatCurrency(item.price)}</TableCell>
                <TableCell><StockBar value={item.stock_quantity} max={item.stock_quantity !== null ? Math.max(item.stock_quantity, 20) : null} /></TableCell>
                <TableCell className="text-center"><StatusBadge value={item.stock_quantity} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setEditItem(item)} className="gap-1.5 text-amber-700 hover:bg-amber-50 border-amber-200">
                    <Edit2 className="h-3.5 w-3.5" /> Ajuster
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <QuickEditMenuItemStockModal isOpen={!!editItem} onClose={() => setEditItem(null)} menuItem={editItem} onSuccess={() => { setEditItem(null); load(); }} />
    </div>
  );
}

// ──────────────────────────────────────────────
// TAB 2 — Ingrédients partagés
// ──────────────────────────────────────────────
function IngredientRow({ ingredient, linkedDishes, onAdjust, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const stock = ingredient.current_stock;
  const pct = ingredient.max_stock ? Math.min(100, Math.round((stock / ingredient.max_stock) * 100)) : null;
  const barColor = stock < CRITICAL ? 'bg-red-500' : stock < LOW ? 'bg-yellow-400' : 'bg-emerald-500';

  return (
    <>
      <TableRow className={`hover:bg-slate-50/50 transition-colors ${stock !== null && stock < CRITICAL ? 'bg-red-50/30' : ''}`}>
        <TableCell>
          <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-2 text-left w-full">
            {linkedDishes.length > 0
              ? (expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />)
              : <span className="w-4" />}
            <div>
              <p className="font-semibold text-slate-800">{ingredient.name}</p>
              {ingredient.category && <p className="text-xs text-slate-400">{ingredient.category}</p>}
            </div>
          </button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {pct !== null ? (
              <>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 min-w-[80px]">
                  <div className={`${barColor} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-sm font-bold tabular-nums ${stock < CRITICAL ? 'text-red-600' : stock < LOW ? 'text-yellow-600' : 'text-emerald-700'}`}>
                  {stock} {ingredient.unit || ''}
                </span>
              </>
            ) : (
              <span className="text-slate-400 text-sm">Non défini</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs text-slate-500 bg-slate-50">
            {linkedDishes.length} plat{linkedDishes.length !== 1 ? 's' : ''}
          </Badge>
        </TableCell>
        <TableCell className="text-center"><StatusBadge value={stock} /></TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onAdjust(ingredient)} className="gap-1.5 text-purple-700 hover:bg-purple-50 border-purple-200">
              <Edit2 className="h-3.5 w-3.5" /> Réappro
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(ingredient)} className="text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {expanded && linkedDishes.map((dish, i) => (
        <TableRow key={i} className="bg-purple-50/30">
          <TableCell className="pl-10 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Utensils className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
              {dish.menu_items?.image_url
                ? <img src={dish.menu_items.image_url} className="w-6 h-6 rounded object-cover" alt="" />
                : null}
              <span className="font-medium">{dish.menu_items?.name || '?'}</span>
            </div>
          </TableCell>
          <TableCell className="py-2">
            <span className="text-xs text-slate-500">Utilise <strong>{dish.quantity_per_serving} {dish.unit || ingredient.unit || 'unité(s)'}</strong> par portion</span>
          </TableCell>
          <TableCell colSpan={3} />
        </TableRow>
      ))}
    </>
  );
}

const UNITS = ['portions', 'kg', 'g', 'L', 'cl', 'ml', 'unités', 'litres', 'pièces'];

function SharedIngredientsTab() {
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newIng, setNewIng] = useState({ name: '', unit: 'portions', current_stock: '', category: '', min_stock: '' });

  const load = async () => {
    setLoading(true);
    const [ingRes, linkRes] = await Promise.all([
      supabase.from('ingredients').select('*').or('is_deleted.eq.false,is_deleted.is.null').order('name'),
      supabase.from('menu_item_ingredients').select('*, menu_items(id, name, image_url)'),
    ]);
    setIngredients(ingRes.data || []);
    setLinks(linkRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return ingredients;
    return ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.category || '').toLowerCase().includes(search.toLowerCase()));
  }, [ingredients, search]);

  const unlinkedCount = ingredients.filter(ing => !links.some(l => l.ingredient_id === ing.id)).length;

  const handleAdjust = async () => {
    if (!adjustItem || adjustQty === '') return;
    setAdjustSaving(true);
    const newStock = parseFloat(adjustQty);
    const prev = adjustItem.current_stock || 0;
    await supabase.from('ingredients').update({ current_stock: newStock }).eq('id', adjustItem.id);
    await supabase.from('stock_movements').insert({
      ingredient_id: adjustItem.id,
      movement_type: 'adjustment',
      quantity: newStock - prev,
      notes: 'Réappro manuelle',
    });
    toast({ title: 'Stock mis à jour', description: `${adjustItem.name} → ${newStock} ${adjustItem.unit || ''}` });
    setAdjustItem(null);
    setAdjustQty('');
    setAdjustSaving(false);
    load();
  };

  const handleDelete = async (ing) => {
    if (!window.confirm(`Supprimer "${ing.name}" ? Cette action est irréversible.`)) return;
    const { error } = await supabase.from('ingredients').update({ is_deleted: true }).eq('id', ing.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else {
      toast({ title: 'Ingrédient supprimé', description: `"${ing.name}" a été supprimé.` });
      load();
    }
  };

  const handleCreate = async () => {
    if (!newIng.name.trim()) return;
    setCreating(true);
    const { error } = await supabase.from('ingredients').insert({
      id: crypto.randomUUID(),
      name: newIng.name.trim(),
      unit: newIng.unit || 'unités',
      current_stock: parseFloat(newIng.current_stock) || 0,
      min_stock: parseFloat(newIng.min_stock) || 0,
      category: newIng.category || null,
      created_at: new Date().toISOString(),
    });
    setCreating(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message });
    } else {
      toast({ title: 'Ingrédient créé !', description: `${newIng.name} ajouté avec succès.` });
      setShowCreate(false);
      setNewIng({ name: '', unit: 'portions', current_stock: '', category: '', min_stock: '' });
      load();
    }
  };

  const criticalCount = ingredients.filter(i => i.current_stock !== null && i.current_stock < CRITICAL).length;
  const linkedOnly = filtered.filter(ing => links.some(l => l.ingredient_id === ing.id));
  const displayList = showAll ? filtered : linkedOnly;

  return (
    <div className="space-y-5">
      {criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">{criticalCount} ingrédient{criticalCount > 1 ? 's' : ''} en stock critique</p>
            <p className="text-sm text-red-600 mt-0.5">Des plats liés à ces ingrédients pourraient être bloqués à la commande.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Rechercher un ingrédient..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <button
          onClick={() => setShowAll(v => !v)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${showAll ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          {showAll ? 'Liés seulement' : `Voir tout (${ingredients.length})`}
        </button>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-4 w-4" /> Nouvel ingrédient
        </Button>
        <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {unlinkedCount > 0 && !search && !showAll && (
        <p className="text-xs text-slate-400 italic">{unlinkedCount} ingrédient{unlinkedCount > 1 ? 's' : ''} créé{unlinkedCount > 1 ? 's' : ''} mais pas encore liés à un plat.</p>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[280px]">Ingrédient</TableHead>
              <TableHead className="w-[220px]">Stock actuel</TableHead>
              <TableHead>Plats liés</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5} className="h-14 animate-pulse bg-slate-50/60" /></TableRow>
              ))
            ) : displayList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <FlaskConical className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400">Aucun ingrédient trouvé.</p>
                  <button onClick={() => setShowCreate(true)} className="text-xs text-purple-600 hover:underline mt-1">+ Créer un ingrédient</button>
                </TableCell>
              </TableRow>
            ) : displayList.map(ing => (
              <IngredientRow
                key={ing.id}
                ingredient={ing}
                linkedDishes={links.filter(l => l.ingredient_id === ing.id)}
                onAdjust={(ing) => { setAdjustItem(ing); setAdjustQty(String(ing.current_stock ?? 0)); }}
                onDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create ingredient modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><FlaskConical className="h-5 w-5 text-purple-600" /></div>
              <div>
                <h3 className="font-bold text-slate-900">Nouvel ingrédient</h3>
                <p className="text-sm text-slate-500">Ajouter un ingrédient partagé au stock</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Nom *</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="Ex: Viande de bœuf"
                  value={newIng.name}
                  onChange={e => setNewIng(v => ({ ...v, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Unité</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                    value={newIng.unit}
                    onChange={e => setNewIng(v => ({ ...v, unit: e.target.value }))}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Stock initial</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="0"
                    value={newIng.current_stock}
                    onChange={e => setNewIng(v => ({ ...v, current_stock: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Stock minimum</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="0"
                    value={newIng.min_stock}
                    onChange={e => setNewIng(v => ({ ...v, min_stock: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Catégorie</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Ex: Viandes"
                    value={newIng.category}
                    onChange={e => setNewIng(v => ({ ...v, category: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setNewIng({ name: '', unit: 'portions', current_stock: '', category: '', min_stock: '' }); }}>
                Annuler
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleCreate}
                disabled={creating || !newIng.name.trim()}
              >
                {creating ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust modal */}
      {adjustItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><FlaskConical className="h-5 w-5 text-purple-600" /></div>
              <div>
                <h3 className="font-bold text-slate-900">Réapprovisionner</h3>
                <p className="text-sm text-slate-500">{adjustItem.name}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Nouveau stock total ({adjustItem.unit || 'unités'})</p>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={adjustQty}
                onChange={e => setAdjustQty(e.target.value)}
                placeholder="Ex: 20"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1">Stock actuel : <strong>{adjustItem.current_stock ?? '—'}</strong></p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setAdjustItem(null)}>Annuler</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleAdjust} disabled={adjustSaving}>
                {adjustSaving ? 'Sauvegarde...' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Page principale
// ──────────────────────────────────────────────
export const StockManagementPage = () => {
  const [tab, setTab] = useState('plats');

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-amber-600" /> Gestion des Stocks
          </h1>
          <p className="text-slate-500 mt-1">Stocks des plats, ingrédients partagés et historique des mouvements.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl gap-1">
            <TabsTrigger value="plats" className="gap-2 font-medium px-5 py-2 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Utensils className="h-4 w-4" /> Plats & Menus
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="gap-2 font-medium px-5 py-2 rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <FlaskConical className="h-4 w-4" /> Ingrédients Partagés
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 font-medium px-5 py-2 rounded-lg data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              <History className="h-4 w-4" /> Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plats" className="mt-5">
            <PlatStockTab />
          </TabsContent>

          <TabsContent value="ingredients" className="mt-5">
            <SharedIngredientsTab />
          </TabsContent>

          <TabsContent value="history" className="mt-5">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <StockMovementHistoryPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default StockManagementPage;
