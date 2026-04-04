import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { PaginationControls } from '@/components/PaginationControls';
import SortableHeader from '@/components/SortableHeader';
import SearchBar from '@/components/SearchBar';
import ExportButton from '@/components/ExportButton';
import { formatCurrency, formatDateTime, formatOrderStatus, ORDER_STATUSES } from '@/lib/formatters';
import { Eye, AlertCircle, RefreshCw, ShoppingBag, Wifi, WifiOff, Activity, Utensils, Truck, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { exportDataService } from '@/lib/exportDataService';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useManagerPermissions } from '@/hooks/useManagerPermissions';
import { ENTITY_TYPES } from '@/lib/managerPermissions';
import { useDeleteWithUndo } from '@/hooks/useDeleteWithUndo';
import { DeleteButton } from '@/components/DeleteButton';
import { DeletedRecordIndicator } from '@/components/DeletedRecordIndicator';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { OrderTypeFilter } from '@/components/OrderTypeFilter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MotionTableRow = motion(TableRow);

// REALTIME ESSENTIAL: Realtime is intentionally used here for live order tracking, immediate alerts, and instant UI updates for staff.
export const AdminOrdersPage = () => {
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();
  const { canDelete } = useManagerPermissions(ENTITY_TYPES.ORDER);
  
  const [filter, setFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const hookFilters = useMemo(() => {
     let f = { 
        status: filter !== 'all' ? filter : undefined, 
        order_type: orderTypeFilter !== 'all' ? orderTypeFilter : undefined,
        userId: undefined, 
        includeDeleted: showDeleted, 
        restaurantId: restaurantId,
        ...advancedFilters 
     };
     if (methodFilter !== 'all') f.order_method = methodFilter;
     return f;
  }, [filter, orderTypeFilter, methodFilter, advancedFilters, showDeleted, restaurantId]);
  
  const { 
    orders, 
    loading, 
    connectionState, 
    lastUpdated, 
    connectionError, 
    refresh, 
    retryConnection,
    isPolling,
    pagination, 
    sortBy, 
    sortOrder, 
    setSort, 
    searchQuery, 
    setSearchQuery 
  } = useRealtimeOrders(hookFilters, currentPage, itemsPerPage);

  const { deleteRecord, undoDelete, isDeleting } = useDeleteWithUndo('orders', refresh);

  useEffect(() => { if(pagination?.setPage) pagination.setPage(currentPage); }, [currentPage, pagination]);
  useEffect(() => { if(pagination?.setLimit) { pagination.setLimit(itemsPerPage); setCurrentPage(1); } }, [itemsPerPage, pagination]);
  useEffect(() => { setCurrentPage(1); }, [filter, orderTypeFilter, methodFilter, advancedFilters, showDeleted]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [singleOrderToDelete, setSingleOrderToDelete] = useState(null);

  const safeOrders = Array.isArray(orders) ? orders : [];

  const typeCounts = useMemo(() => {
    return {
      all: pagination?.totalCount || 0,
      dine_in: safeOrders.filter(o => o?.order_type === 'dine_in' || o?.type === 'dine_in').length,
      delivery: safeOrders.filter(o => o?.order_type === 'delivery' || o?.type === 'delivery').length,
    };
  }, [safeOrders, pagination?.totalCount]);

  const handleExport = useCallback((format) => {
    setIsExporting(true);
    try { exportDataService.exportOrders(safeOrders, format); toast({ title: "Export réussi" }); } 
    catch (error) { toast({ variant: "destructive", title: "Erreur d'export" }); } 
    finally { setIsExporting(false); }
  }, [safeOrders, toast]);

  const confirmDelete = async () => {
    if (!singleOrderToDelete?.id) return;
    await deleteRecord(singleOrderToDelete.id, "Suppression depuis AdminOrdersPage");
    setSingleOrderToDelete(null);
  };

  const renderConnectionBadge = () => {
    switch(connectionState) {
      case 'connected': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><Wifi className="w-3 h-3" /> Connecté</Badge>;
      case 'polling': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1"><Activity className="w-3 h-3 animate-pulse" /> Périodique</Badge>;
      case 'connecting': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Connexion...</Badge>;
      default: return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1"><WifiOff className="w-3 h-3" /> Déconnecté</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 pb-12">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-card p-4 md:p-6 rounded-2xl shadow-sm border border-border">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
               <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2"><ShoppingBag className="h-6 w-6 text-[#D97706]" /> Commandes</h1>
               {renderConnectionBadge()}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <p>Total: {pagination?.totalCount || 0}</p>
              <span>•</span>
              <p>Dernière maj: {lastUpdated?.toLocaleTimeString() || '...'}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
             <div className="flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-xl border text-sm">
                <Checkbox id="show-deleted" checked={showDeleted} onCheckedChange={setShowDeleted} />
                <label htmlFor="show-deleted" className="cursor-pointer font-medium text-foreground">Afficher supprimés</label>
             </div>
             <div className="flex gap-2">
                 <ExportButton onExport={handleExport} loading={isExporting} count={safeOrders.length} disabled={safeOrders.length === 0} />
                 <Button variant="outline" size="icon" onClick={refresh} title="Actualiser" className="rounded-xl"><RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /></Button>
             </div>
             <SearchBar value={searchQuery || ''} onChange={setSearchQuery} resultCount={pagination?.totalCount || 0} placeholder="Rechercher..." loading={loading} />
          </div>
        </div>

        {connectionError && (
          <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600"/>
            <AlertTitle>Problème de synchronisation</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{connectionError}</span>
              <Button variant="outline" size="sm" onClick={retryConnection} className="bg-white text-red-700 hover:bg-red-50 border-red-200 ml-4 font-bold">
                <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div className="flex gap-2">
            <OrderTypeFilter 
              currentFilter={orderTypeFilter} 
              onFilterChange={setOrderTypeFilter} 
              counts={typeCounts}
            />
            <Select value={methodFilter} onValueChange={setMethodFilter}>
               <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Méthode" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">Toutes méthodes</SelectItem>
                  <SelectItem value="online">En ligne</SelectItem>
                  <SelectItem value="qr_code">QR Code</SelectItem>
                  <SelectItem value="counter">Comptoir</SelectItem>
               </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
              <TabsList className="bg-white p-1 rounded-xl border shadow-sm w-max md:w-auto flex h-auto gap-1">
                {['all', ...Object.values(ORDER_STATUSES)].map((status) => <TabsTrigger key={status} value={status} className="capitalize text-sm py-2 px-4 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">{status}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[50px] px-4"></TableHead>
                  <TableHead><SortableHeader label="Date" columnName="created_at" currentSort={sortBy} currentOrder={sortOrder} onSort={setSort} /></TableHead>
                  <TableHead><SortableHeader label="Client" columnName="customer_name" currentSort={sortBy} currentOrder={sortOrder} onSort={setSort} /></TableHead>
                  <TableHead>Type & Méthode</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead><SortableHeader label="Montant" columnName="total" currentSort={sortBy} currentOrder={sortOrder} onSort={setSort} /></TableHead>
                  <TableHead><SortableHeader label="Statut" columnName="status" currentSort={sortBy} currentOrder={sortOrder} onSort={setSort} /></TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && safeOrders.length === 0 ? Array(5).fill(0).map((_, i) => <TableRow key={i}><TableCell className="px-4"><Skeleton className="h-4 w-4"/></TableCell><TableCell><Skeleton className="h-4 w-24"/></TableCell><TableCell><Skeleton className="h-4 w-32"/></TableCell><TableCell><Skeleton className="h-6 w-24 rounded-full"/></TableCell><TableCell><Skeleton className="h-4 w-32"/></TableCell><TableCell><Skeleton className="h-4 w-16"/></TableCell><TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell><TableCell><Skeleton className="h-8 w-16 ml-auto"/></TableCell></TableRow>) : 
                 safeOrders.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-16 text-muted-foreground text-sm">Aucune commande trouvée</TableCell></TableRow> : (
                  <AnimatePresence>
                    {safeOrders.map((order) => {
                      if (!order) return null;
                      const isDelivery = order.order_type === 'delivery' || order.type === 'delivery';
                      const isCounter = order.order_method === 'counter';
                      
                      const content = (
                         <>
                            <TableCell className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="font-mono text-xs font-semibold text-slate-400">#{order.id?.slice(0, 6) || '???'}</div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 py-4 whitespace-nowrap">{formatDateTime(order.created_at)}</TableCell>
                            <TableCell className="text-sm font-medium text-slate-900 py-4">{order.customer_name || 'Invité'}</TableCell>
                            <TableCell className="py-4">
                               <div className="flex flex-col gap-1.5 items-start">
                                 <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${isDelivery ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                    {isDelivery ? <Truck className="w-3.5 h-3.5" /> : <Utensils className="w-3.5 h-3.5" />}
                                    {isDelivery ? 'Livraison' : 'Sur place'}
                                 </div>
                                 <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${isCounter ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                   {isCounter && <Store className="w-3 h-3" />}
                                   {isCounter ? 'Comptoir' : (order.order_method === 'qr_code' ? 'QR Code' : 'En Ligne')}
                                 </div>
                               </div>
                            </TableCell>
                            <TableCell className="py-4 text-sm text-slate-600 max-w-[200px] truncate">
                               {isDelivery ? (
                                  <span title={order.delivery_address} className="flex items-center gap-1"><span className="truncate">{order.delivery_address || 'Adresse non spécifiée'}</span></span>
                               ) : (
                                  <span className="font-semibold text-slate-800">{isCounter && !order.table_id ? '-' : `Table ${order.table_id || '?'}`}</span>
                               )}
                            </TableCell>
                            <TableCell className="font-bold text-sm text-slate-900 py-4 whitespace-nowrap">{formatCurrency(order.total)}</TableCell>
                            <TableCell className="py-4">
                              <Badge className={`${isCounter ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' : formatOrderStatus(order.status || 'pending')} px-2.5 py-0.5 whitespace-nowrap`}>
                                {isCounter && order.status === 'ready' ? 'Prêt (Comptoir)' : (order.status || 'pending')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-9 w-9 rounded-lg" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}><Eye className="h-4 w-4" /></Button>
                                {!order.is_deleted && (
                                  <DeleteButton onClick={(e) => { e.stopPropagation(); setSingleOrderToDelete(order); }} disabled={!canDelete} className="h-9 w-9 rounded-lg" />
                                )}
                              </div>
                            </TableCell>
                         </>
                      );

                      return (
                        <MotionTableRow 
                          key={order.id || Math.random()} 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }} 
                          className={`cursor-pointer transition-colors hover:bg-slate-50 ${order.is_deleted ? 'border-none p-0 block table-row-group' : 'border-b border-slate-100'}`} 
                          onClick={() => !order.is_deleted && setSelectedOrder(order)}
                        >
                           {order.is_deleted ? (
                             <td colSpan="8" className="p-0 border-b border-slate-100">
                                <DeletedRecordIndicator onRestore={() => undoDelete(order.id)} isRestoring={isDeleting}>
                                  <div className="flex items-center w-full px-4 py-3">
                                     <div className="text-sm font-mono text-slate-500 mr-4">#{order.id?.slice(0, 8) || '???'}</div>
                                     <div className="text-sm text-slate-500">{order.customer_name || 'Invité'} - {formatCurrency(order.total)}</div>
                                  </div>
                                </DeletedRecordIndicator>
                             </td>
                           ) : content}
                        </MotionTableRow>
                      );
                    })}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 p-3">
             <PaginationControls currentPage={currentPage} totalPages={pagination?.totalPages || 1} totalCount={pagination?.totalCount || 0} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} loading={loading} />
          </div>
        </div>

        <OrderDetailModal order={selectedOrder} open={!!selectedOrder} onClose={() => setSelectedOrder(null)} />
        
        <DeleteConfirmationModal
          open={!!singleOrderToDelete}
          onClose={() => setSingleOrderToDelete(null)}
          onConfirm={confirmDelete}
          recordType="Commande"
          recordName={`#${singleOrderToDelete?.id?.slice(0,8) || '???'}`}
          loading={isDeleting}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;