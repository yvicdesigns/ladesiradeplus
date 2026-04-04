import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit2, AlertTriangle, PackageX, Loader2, Package, Filter, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { QuickEditMenuItemStockModal } from './QuickEditMenuItemStockModal';
import { formatCurrency } from '@/lib/formatters';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { executeWithResilience, getFriendlyErrorMessage } from '@/lib/supabaseErrorHandler';
import { logStockFetch } from '@/lib/stockDebugUtils';

export class StockErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Une erreur critique est survenue</AlertTitle>
          <AlertDescription>
            {this.state.error?.message}
            <Button variant="outline" size="sm" className="mt-4 block" onClick={() => window.location.reload()}>
              Recharger l'interface
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    return this.props.children;
  }
}

const StockManagementContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const isOnline = useNetworkStatus();
  
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const CRITICAL_STOCK = 5;
  const LOW_STOCK = 10;

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    const t0 = performance.now();

    try {
      const data = await executeWithResilience(async () => {
        const res = await supabase
          .from('menu_items')
          .select('id, name, stock_quantity, price, is_available, image_url, category_id, menu_categories(name)')
          .order('name', { ascending: true });
        if (res.error) throw res.error;
        return res.data;
      }, { context: 'Fetch all stock items' });

      setMenuItems(data || []);
      logStockFetch('menu_items', { context: 'all_stock' }, null, data?.length, performance.now() - t0);
    } catch (err) {
      const msg = getFriendlyErrorMessage(err);
      setError(msg);
      logStockFetch('menu_items', { context: 'all_stock' }, err, 0, performance.now() - t0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
    const channel = supabase.channel('stock_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchStockData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (isOnline && error) fetchStockData();
  }, [isOnline]);

  const filteredItems = useMemo(() => {
    let result = menuItems || [];
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(lowerTerm) ||
        (item.menu_categories?.name || '').toLowerCase().includes(lowerTerm)
      );
    }
    if (showLowStockOnly) {
      result = result.filter(item => (item.stock_quantity || 0) < LOW_STOCK);
    }
    return result;
  }, [menuItems, searchTerm, showLowStockOnly]);

  const criticalStockCount = (menuItems || []).filter(i => (i.stock_quantity || 0) < CRITICAL_STOCK).length;
  const lowStockCount = (menuItems || []).filter(i => (i.stock_quantity || 0) >= CRITICAL_STOCK && (i.stock_quantity || 0) < LOW_STOCK).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!isOnline && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Connexion perdue</AlertTitle>
          <AlertDescription>Vous êtes actuellement hors ligne. Les données affichées peuvent ne pas être à jour.</AlertDescription>
        </Alert>
      )}

      {error && isOnline && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur de synchronisation</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{error}</span>
            <Button variant="outline" size="sm" className="w-fit" onClick={() => fetchStockData()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package className="h-6 w-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Plats</p>
              <p className="text-2xl font-bold text-gray-900">{loading && !menuItems.length ? <Skeleton className="h-8 w-12" /> : (menuItems || []).length}</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-yellow-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><AlertTriangle className="h-6 w-6" /></div>
            <div>
              <p className="text-sm text-yellow-700 font-medium">Stock Faible ({`<${LOW_STOCK}`})</p>
              <p className="text-2xl font-bold text-yellow-600">{loading && !menuItems.length ? <Skeleton className="h-8 w-12" /> : lowStockCount}</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><PackageX className="h-6 w-6" /></div>
            <div>
              <p className="text-sm text-red-700 font-medium">Stock Critique ({`<${CRITICAL_STOCK}`})</p>
              <p className="text-2xl font-bold text-red-600">{loading && !menuItems.length ? <Skeleton className="h-8 w-12" /> : criticalStockCount}</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Rechercher un plat ou une catégorie..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200"
              disabled={!isOnline}
            />
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg border">
            <Filter className="h-4 w-4 text-gray-500" />
            <Switch 
              id="low-stock-filter" 
              checked={showLowStockOnly}
              onCheckedChange={setShowLowStockOnly}
              disabled={!isOnline}
            />
            <Label htmlFor="low-stock-filter" className="cursor-pointer font-medium text-gray-700">
              Voir alertes stock
            </Label>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead>Plat</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead className="text-center">Quantité Stock</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !menuItems.length ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 mx-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                    {error ? "Erreur de chargement." : "Aucun résultat."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => {
                  const stock = item.stock_quantity || 0;
                  const isCritical = stock < CRITICAL_STOCK;
                  const isLow = stock >= CRITICAL_STOCK && stock < LOW_STOCK;
                  
                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'} alt={item.name} className="w-10 h-10 rounded-md object-cover border bg-gray-100" />
                          <span className="font-bold text-gray-900">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 font-medium">
                        <Badge variant="outline" className="bg-gray-50">{item.menu_categories?.name || 'Sans catégorie'}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 font-medium">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xl font-black ${isCritical ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-amber-600'}`}>
                          {stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {isCritical ? (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 gap-1 w-[120px] justify-center shadow-none">
                            <PackageX className="w-3 h-3" /> Critique
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="warning" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-300 gap-1 w-[120px] justify-center shadow-none">
                            <AlertTriangle className="w-3 h-3" /> Faible
                          </Badge>
                        ) : (
                          <Badge variant="success" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300 gap-1 w-[120px] justify-center shadow-none">
                             <CheckCircle2 className="w-3 h-3" /> Normal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditingItem(item)}
                          disabled={!isOnline}
                          className="gap-2 bg-white hover:bg-amber-50 border-gray-200 shadow-sm text-amber-600 hover:text-amber-700"
                        >
                          <Edit2 className="w-4 h-4" /> Ajuster
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <QuickEditMenuItemStockModal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        menuItem={editingItem}
        onSuccess={() => {
           setEditingItem(null);
           fetchStockData();
        }}
      />
    </div>
  );
};

export const AdminStockManagementTab = () => (
  <StockErrorBoundary>
    <StockManagementContent />
  </StockErrorBoundary>
);