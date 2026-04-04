import React, { useState, useMemo } from 'react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Edit2, Package, AlertTriangle, CheckCircle, PackageX, Loader2 } from 'lucide-react';
import { StockLevelIndicator } from './StockLevelIndicator';
import { QuickEditStockModal } from './QuickEditStockModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const StockManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [filterState, setFilterState] = useState('all'); // all, low, out

  const { data: menuItems, loading } = useRealtimeSubscription('menu_items', {
    select: '*, menu_categories(name)',
    orderBy: { column: 'name', ascending: true }
  });

  const MIN_STOCK = 5;

  const stats = useMemo(() => {
    let total = menuItems.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    menuItems.forEach(item => {
      const stock = item.stock_quantity || 0;
      if (stock <= 0) outOfStock++;
      else if (stock <= MIN_STOCK) lowStock++;
      else inStock++;
    });

    return { total, inStock, lowStock, outOfStock };
  }, [menuItems]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.menu_categories?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const stock = item.stock_quantity || 0;
    if (filterState === 'low') return stock > 0 && stock <= MIN_STOCK;
    if (filterState === 'out') return stock <= 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {stats.outOfStock > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
          <PackageX className="h-4 w-4 text-red-600" />
          <AlertTitle className="font-bold text-red-800">Alerte Rupture</AlertTitle>
          <AlertDescription>
            {stats.outOfStock} plat(s) sont actuellement en rupture de stock.
            <Button variant="link" className="px-2 h-auto text-red-700 underline" onClick={() => setFilterState('out')}>Voir les plats</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50" onClick={() => setFilterState('all')}>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Plats</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50" onClick={() => setFilterState('all')}>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><CheckCircle className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">En Stock</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.inStock}</h3>
          </div>
        </div>
        <div className={`bg-white p-4 rounded-xl shadow-sm border ${filterState === 'low' ? 'ring-2 ring-yellow-400' : 'border-gray-100'} flex items-center gap-4 cursor-pointer hover:bg-gray-50`} onClick={() => setFilterState('low')}>
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><AlertTriangle className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Stock Faible</p>
            <h3 className="text-2xl font-bold text-yellow-600">{stats.lowStock}</h3>
          </div>
        </div>
        <div className={`bg-white p-4 rounded-xl shadow-sm border ${filterState === 'out' ? 'ring-2 ring-red-400' : 'border-gray-100'} flex items-center gap-4 cursor-pointer hover:bg-gray-50`} onClick={() => setFilterState('out')}>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><PackageX className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Rupture</p>
            <h3 className="text-2xl font-bold text-red-600">{stats.outOfStock}</h3>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Rechercher un plat..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>
          {filterState !== 'all' && (
            <Button variant="ghost" onClick={() => setFilterState('all')} className="text-gray-500">
              Effacer les filtres
            </Button>
          )}
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut / Niveau</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-500" />
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                    Aucun produit ne correspond à votre recherche.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => (
                  <TableRow key={item.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
                          alt={item.name} 
                          className="w-10 h-10 rounded-md object-cover border" 
                        />
                        <div>
                           <span className="font-bold text-gray-900 block">{item.name}</span>
                           {!item.is_available && <span className="text-xs text-red-500 font-medium">Masqué du menu</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 font-medium">
                      {item.menu_categories?.name}
                    </TableCell>
                    <TableCell>
                      <StockLevelIndicator stock={item.stock_quantity} minStock={MIN_STOCK} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEditingItem(item)}
                        className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" /> Éditer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <QuickEditStockModal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        menuItem={editingItem}
      />
    </div>
  );
};