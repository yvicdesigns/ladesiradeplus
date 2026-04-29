import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { exportDataService } from '@/lib/exportDataService';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2, Download, FileText, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const RESTAURANT_ID = '7eedf081-0268-4867-af38-61fa5932420a';

const EXPENSE_CATEGORIES = [
  { value: 'supplies', label: 'Fournitures / Ingrédients' },
  { value: 'salary', label: 'Salaires' },
  { value: 'rent', label: 'Loyer' },
  { value: 'utilities', label: 'Eau / Électricité' },
  { value: 'equipment', label: 'Équipement' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Autre' },
];

const getCategoryLabel = (value) => EXPENSE_CATEGORIES.find(c => c.value === value)?.label || value;

const getPeriodRange = (period, customStart, customEnd) => {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_month': {
      const last = subMonths(now, 1);
      return { start: startOfMonth(last), end: endOfMonth(last) };
    }
    case 'custom':
      return {
        start: customStart ? startOfDay(new Date(customStart)) : startOfMonth(now),
        end: customEnd ? endOfDay(new Date(customEnd)) : endOfMonth(now),
      };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
};

export const AdminFinancePage = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [recettes, setRecettes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ amount: '', category: 'supplies', description: '', expense_date: format(new Date(), 'yyyy-MM-dd') });
  const [saving, setSaving] = useState(false);

  const canManage = role === 'admin' || role === 'manager';

  const { start, end } = useMemo(() => getPeriodRange(period, customStart, customEnd), [period, customStart, customEnd]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      const [expensesRes, ordersRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .eq('restaurant_id', RESTAURANT_ID)
          .gte('expense_date', format(start, 'yyyy-MM-dd'))
          .lte('expense_date', format(end, 'yyyy-MM-dd'))
          .order('expense_date', { ascending: false }),
        supabase
          .from('orders')
          .select('total, status, created_at')
          .not('status', 'in', '(cancelled,rejected)')
          .neq('is_complimentary', true)
          .gte('created_at', startISO)
          .lte('created_at', endISO),
      ]);

      if (expensesRes.error) throw expensesRes.error;
      if (ordersRes.error) throw ordersRes.error;

      setExpenses(expensesRes.data || []);
      const totalRecettes = (ordersRes.data || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      setRecettes(totalRecettes);
    } catch (err) {
      console.error('[AdminFinancePage] fetchData error:', err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalDepenses = useMemo(() => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);
  const solde = recettes - totalDepenses;

  const handleAddExpense = async () => {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast({ variant: 'destructive', title: 'Montant invalide', description: 'Veuillez entrer un montant positif.' });
      return;
    }
    setSaving(true);
    try {
      const { error: err } = await supabase.from('expenses').insert({
        restaurant_id: RESTAURANT_ID,
        amount: Number(form.amount),
        category: form.category,
        description: form.description || null,
        expense_date: form.expense_date,
        created_by: user?.id,
      });
      if (err) throw err;
      toast({ title: 'Dépense ajoutée', description: `${formatCurrency(Number(form.amount))} enregistré.` });
      setShowAddModal(false);
      setForm({ amount: '', category: 'supplies', description: '', expense_date: format(new Date(), 'yyyy-MM-dd') });
      fetchData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const { error: err } = await supabase.from('expenses').delete().eq('id', id);
      if (err) throw err;
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Dépense supprimée' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = (fmt) => {
    try {
      const periodLabel = period === 'today' ? 'aujourd_hui'
        : period === 'week' ? 'cette_semaine'
        : period === 'month' ? 'ce_mois'
        : period === 'last_month' ? 'mois_precedent'
        : `${customStart}_${customEnd}`;
      exportDataService.exportFinance({ recettes, depenses: expenses, totalDepenses, solde }, fmt, periodLabel);
      toast({ title: 'Export réussi' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur export', description: err.message });
    }
  };

  const periodLabel = period === 'today' ? "Aujourd'hui"
    : period === 'week' ? 'Cette semaine'
    : period === 'month' ? 'Ce mois'
    : period === 'last_month' ? 'Mois précédent'
    : `${customStart} → ${customEnd}`;

  const expensesByCategory = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const cat = e.category || 'other';
      map[cat] = (map[cat] || 0) + Number(e.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Finances</h1>
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
            {canManage && (
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-1" /> Ajouter dépense
              </Button>
            )}
          </div>
        </div>

        {/* Period Filter */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Période</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="last_month">Mois précédent</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {period === 'custom' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Du</Label>
                    <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-40" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Au</Label>
                    <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-40" />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Recettes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(recettes)}</p>
                <p className="text-xs text-muted-foreground mt-1">Commandes complétées</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" /> Dépenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalDepenses)}</p>
                <p className="text-xs text-muted-foreground mt-1">{expenses.length} entrée{expenses.length !== 1 ? 's' : ''}</p>
              </CardContent>
            </Card>

            <Card className={`border-2 ${solde >= 0 ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20' : 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${solde >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  <Wallet className="h-4 w-4" /> Solde net
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${solde >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(solde)}</p>
                <p className="text-xs text-muted-foreground mt-1">{solde >= 0 ? 'Bénéfice' : 'Déficit'}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        {!loading && !error && (
          <Tabs defaultValue="depenses">
            <TabsList>
              <TabsTrigger value="depenses">Dépenses ({expenses.length})</TabsTrigger>
              <TabsTrigger value="recap">Récapitulatif</TabsTrigger>
            </TabsList>

            <TabsContent value="depenses" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {expenses.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <TrendingDown className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>Aucune dépense pour cette période</p>
                      {canManage && (
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddModal(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Ajouter une dépense
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            {canManage && <TableHead className="w-12" />}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenses.map(e => (
                            <TableRow key={e.id}>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {format(parseISO(e.expense_date), 'dd MMM yyyy', { locale: fr })}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted">
                                  {getCategoryLabel(e.category)}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                {e.description || '—'}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-red-600">
                                {formatCurrency(Number(e.amount))}
                              </TableCell>
                              {canManage && (
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    disabled={deleting === e.id}
                                    onClick={() => handleDelete(e.id)}
                                  >
                                    {deleting === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recap" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* By category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Dépenses par catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expensesByCategory.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
                    ) : (
                      <div className="space-y-3">
                        {expensesByCategory.map(([cat, amount]) => {
                          const pct = totalDepenses > 0 ? ((amount / totalDepenses) * 100).toFixed(0) : 0;
                          return (
                            <div key={cat}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{getCategoryLabel(cat)}</span>
                                <span className="font-medium text-red-600">{formatCurrency(amount)}</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Summary table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Résumé financier</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm">Recettes (commandes)</span>
                        <span className="font-semibold text-green-600">{formatCurrency(recettes)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm">Total dépenses</span>
                        <span className="font-semibold text-red-600">− {formatCurrency(totalDepenses)}</span>
                      </div>
                      <div className="flex justify-between py-2 rounded-lg bg-muted px-3">
                        <span className="font-semibold">Solde net</span>
                        <span className={`font-bold text-lg ${solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {formatCurrency(solde)}
                        </span>
                      </div>
                      {totalDepenses > 0 && recettes > 0 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          Ratio dépenses/recettes : {((totalDepenses / recettes) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Add Expense Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle dépense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Montant (XAF) *</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ex: 25000"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Catégorie *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                placeholder="Ex: Achat légumes marché central"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.expense_date}
                onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={saving}>Annuler</Button>
            <Button onClick={handleAddExpense} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminFinancePage;
