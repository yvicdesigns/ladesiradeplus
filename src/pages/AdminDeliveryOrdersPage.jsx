import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useRealtimeDeliveryOrders } from '@/hooks/useRealtimeDeliveryOrders';
import { useNewOrderNotificationBadge } from '@/hooks/useNewOrderNotificationBadge.jsx';
import { PaginationControls } from '@/components/PaginationControls';
import { ConnectionStatusBadge } from '@/components/ConnectionStatusBadge';
import { AdminDeliveryOrdersFilters } from '@/components/AdminDeliveryOrdersFilters';
import { AdminDeliveryOrdersTable } from '@/components/AdminDeliveryOrdersTable';
import { ConfirmationDeleteMultipleModal } from '@/components/ConfirmationDeleteMultipleModal';
import { DeliveryOrderDetailModal } from '@/components/DeliveryOrderDetailModal';
import { AdvancedFiltersPanel } from '@/components/AdvancedFiltersPanel';
import { ExportDataPanel } from '@/components/ExportDataPanel';
import { StatisticsPanel } from '@/components/StatisticsPanel';
import { useDeliveryOrdersFilters } from '@/hooks/useDeliveryOrdersFilters';
import { formatDeliveryStatusFR } from '@/lib/formatters';
import { Truck, BellRing, AlertCircle, Search, RefreshCw, Loader2, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { simpleDeleteDeliveryOrdersMultiple, restoreDeliveryOrdersMultiple } from '@/lib/deliveryOrderDeletion';
import { supabase } from '@/lib/customSupabaseClient';
import { executeWithResilience } from '@/lib/supabaseErrorHandler';
import { useSoftDelete } from '@/hooks/useSoftDelete';
import { useUpdateOrderStatus } from '@/hooks/useUpdateOrderStatus';

export const AdminDeliveryOrdersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { badgeCount: unreadCount, resetBadge } = useNewOrderNotificationBadge({ showToast: false });
  const { deleteRecord, restoreRecord, loading: singleActionLoading } = useSoftDelete('orders'); 
  const { updateOrderStatus, loading: isUpdatingStatus } = useUpdateOrderStatus();
  
  const [pageError, setPageError] = useState(null);

  // Hooks must be called unconditionally at the top level
  const { 
    orders = [], 
    loading = false, 
    error = null, 
    connectionStatus = 'disconnected', 
    refresh = () => {}, 
    retry = () => {},
    reconnect = () => {}, 
    pagination = { page: 1, totalPages: 1, totalCount: 0, limit: 50, setPage: ()=>{}, setLimit: ()=>{} },
    filters = { status: 'all', search: '', showDeleted: false },
    setFilters = () => {},
    sort = { column: 'created_at', order: 'desc' },
    setSort = () => {}
  } = useRealtimeDeliveryOrders();

  // Phase 2: Client-side advanced filtering
  const { 
    advancedFilters, 
    setAdvancedFilters, 
    filteredOrders, 
    resetFilters: resetAdvancedFilters 
  } = useDeliveryOrdersFilters(orders);

  const combinedError = pageError || error;

  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteMultipleModal, setShowDeleteMultipleModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const toggleSelection = useCallback((id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]), []);
  const toggleSelectAll = useCallback(() => setSelectedIds(selectedIds.length === filteredOrders.length ? [] : filteredOrders.map(o => o.order_id || o.id)), [filteredOrders, selectedIds.length]);

  const handleResetAllFilters = () => {
    setFilters({ status: 'all', search: '', showDeleted: false });
    resetAdvancedFilters();
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    const result = await simpleDeleteDeliveryOrdersMultiple(selectedIds);
    setIsProcessing(false);
    if (result.success) {
      toast({ title: "Corbeille", description: `${selectedIds.length} commande(s) mise(s) à la corbeille.`, className: "bg-green-600 text-white" });
      setSelectedIds([]); setShowDeleteMultipleModal(false); refresh();
    } else {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    const result = await restoreDeliveryOrdersMultiple(selectedIds);
    setIsProcessing(false);
    if (result.success) {
      toast({ title: "Restauré", description: `${selectedIds.length} commande(s) restaurée(s).`, className: "bg-green-600 text-white" });
      setSelectedIds([]); refresh();
    } else toast({ title: "Erreur", description: result.error, variant: "destructive" });
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    const targetId = orderToDelete.order_id || orderToDelete.id;
    const { success, error: delError } = await deleteRecord(targetId, 'Suppression manuelle depuis page livraisons');
    if (success) { 
      toast({ 
        title: "Succès", 
        description: "Commande supprimée avec succès", 
        className: "bg-green-600 text-white" 
      });
      refresh(); 
      setOrderToDelete(null); 
      setShowDetailModal(false); 
    } else {
      toast({ 
        title: "Erreur", 
        description: `Erreur: ${delError?.message || 'Impossible de supprimer'}`, 
        variant: "destructive" 
      });
    }
  };

  const handleRestoreOrder = async (order) => {
    const targetId = order.order_id || order.id;
    const { success } = await restoreRecord(targetId, 'Restauré depuis la page de livraison');
    if (success) refresh();
  };

  const verifyOrderExists = async (orderId) => {
    try {
      // Cherche d'abord dans delivery_orders directement
      const { data: doData } = await supabase
        .from('delivery_orders')
        .select('id, status, order_id')
        .eq('id', orderId)
        .maybeSingle();
      if (doData) return { exists: true, order: doData, targetId: doData.id };

      // Fallback: l'ID passé est peut-être un order_id
      const { data: doData2 } = await supabase
        .from('delivery_orders')
        .select('id, status, order_id')
        .eq('order_id', orderId)
        .maybeSingle();
      if (doData2) return { exists: true, order: doData2, targetId: doData2.id };

      return { exists: false };
    } catch (e) { return { exists: false, error: e }; }
  };

  const handleUpdateStatus = async (id, status) => {
     if (status === 'cancelled' || status === 'rejected') {
       const confirmed = window.confirm(`Êtes-vous sûr de vouloir annuler cette commande de livraison ?`);
       if (!confirmed) return;
     }

     const verification = await verifyOrderExists(id);
     if (!verification.exists) {
        toast({ title: "Erreur", description: "Commande introuvable.", variant: "destructive" });
        refresh(); return;
     }

     const targetId = verification.targetId;
     const currentStatus = verification.order?.status;

     const result = await updateOrderStatus(targetId, status, 'delivery', currentStatus);
     
     if (result.success) {
        toast({ 
          title: "Succès", 
          description: "Commande modifiée avec succès",
          className: "bg-green-600 text-white"
        });
        
        setSelectedOrder(prev => prev ? {...prev, status} : null);
        
        if (['cancelled', 'rejected', 'delivered'].includes(status)) {
           setShowDetailModal(false);
           setTimeout(() => refresh(), 1000);
        } else {
           refresh();
        }
     } else {
        toast({ 
          title: "Erreur", 
          description: `Erreur: ${result.error || 'Échec de la modification'}`, 
          variant: "destructive" 
        });
     }
  };

  const handleUpdatePayment = async (id, status) => {
    try {
        const verification = await verifyOrderExists(id);
        const targetId = verification.exists ? verification.targetId : id;

        await executeWithResilience(async () => {
            const { error } = await supabase.from('delivery_orders').update({ payment_status: status }).eq('id', targetId);
            if (error) throw error;
        }, { context: 'Update Payment Status', retry: true });
        
        toast({ title: "Succès", description: "Commande modifiée avec succès", className: "bg-green-600 text-white" });
        refresh();
    } catch (err) {
        toast({ title: "Erreur", description: `Erreur: ${err.message || 'Erreur inconnue'}`, variant: "destructive" });
    }
  };

  const handleViewDetails = (order) => { setSelectedOrder(order); setShowDetailModal(true); };
  const selectedItemsList = useMemo(() => filteredOrders.filter(o => selectedIds.includes(o.order_id || o.id)), [filteredOrders, selectedIds]);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
               <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900"><Truck className="h-8 w-8 text-blue-600" /> Livraisons</h1>
               {unreadCount > 0 && (
                 <Badge variant="destructive" className="animate-pulse cursor-pointer" onClick={resetBadge}>
                   <BellRing className="w-3 h-3 mr-1" /> {unreadCount} nouvelles
                 </Badge>
               )}
            </div>
            <div className="flex items-center gap-2">
              <ConnectionStatusBadge status={connectionStatus} onReconnect={reconnect} />
              <span className="text-muted-foreground text-sm font-medium">• {filteredOrders.length} résultats affichés</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <ExportDataPanel data={filteredOrders} />
            {selectedIds.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-2">
                  {filters?.showDeleted ? (
                     <Button variant="outline" className="text-amber-600 border-amber-200" onClick={handleRestoreSelected} disabled={isProcessing}>Restaurer ({selectedIds.length})</Button>
                  ) : (
                     <Button variant="destructive" onClick={() => setShowDeleteMultipleModal(true)} disabled={isProcessing}>Corbeille ({selectedIds.length})</Button>
                  )}
              </motion.div>
            )}
          </div>
        </div>

        {!combinedError && (
          <>
            <StatisticsPanel orders={filteredOrders} />
            
            <div className="space-y-2">
              <AdminDeliveryOrdersFilters 
                filters={filters} 
                setFilters={setFilters} 
                loading={loading} 
                resultCount={filteredOrders.length} 
              />
              <AdvancedFiltersPanel 
                baseFilters={filters}
                setBaseFilters={setFilters}
                advancedFilters={advancedFilters}
                setAdvancedFilters={setAdvancedFilters}
                onReset={handleResetAllFilters}
              />
            </div>
          </>
        )}

        {combinedError && (
          <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600"/><AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{combinedError.friendlyMessage || combinedError.message || 'Une erreur inattendue est survenue.'}</span>
              <Button variant="outline" size="sm" onClick={retry || refresh} className="bg-white text-red-700 hover:bg-red-50 ml-4 font-bold"><RefreshCw className="w-4 h-4 mr-2" /> Réessayer</Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
           <div className="bg-white rounded-xl shadow-sm border py-24 flex flex-col items-center justify-center text-center">
               <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
               <h3 className="text-xl font-bold text-gray-900">Chargement...</h3>
           </div>
        ) : filteredOrders.length === 0 && !combinedError ? (
           <div className="bg-white rounded-xl shadow-sm border py-24 flex flex-col items-center justify-center text-center">
               <div className="bg-amber-50 p-4 rounded-full mb-4"><Inbox className="w-12 h-12 text-amber-500" /></div>
               <h3 className="text-xl font-bold text-gray-900 mb-1">Aucune commande trouvée</h3>
               <p className="text-gray-500 text-sm">Ajustez vos filtres pour voir plus de résultats.</p>
           </div>
        ) : !combinedError ? (
           <AdminDeliveryOrdersTable 
             orders={filteredOrders}
             loading={loading || isUpdatingStatus}
             error={combinedError}
             selectedIds={selectedIds}
             toggleSelection={toggleSelection}
             toggleSelectAll={toggleSelectAll}
             sort={sort}
             setSort={setSort}
             onViewDetails={handleViewDetails}
             onDelete={setOrderToDelete}
             onRestore={handleRestoreOrder}
             onUpdateStatus={handleUpdateStatus}
             showDeleted={filters?.showDeleted}
             updatingOrderIds={new Set()}
           />
        ) : null}

        {!loading && !combinedError && filteredOrders.length > 0 && pagination && (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm mt-4">
            <PaginationControls currentPage={pagination.page} totalPages={pagination.totalPages} totalCount={pagination.totalCount} itemsPerPage={pagination.limit} onPageChange={pagination.setPage} onItemsPerPageChange={pagination.setLimit} loading={loading} />
          </div>
        )}

        {selectedOrder && (
          <DeliveryOrderDetailModal
            order={selectedOrder}
            open={showDetailModal}
            onOpenChange={setShowDetailModal}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePayment={handleUpdatePayment}
            onDelete={() => setOrderToDelete(selectedOrder)}
          />
        )}

        <Dialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Supprimer la commande
              </DialogTitle>
              <DialogDescription className="pt-2 text-base text-slate-700">
                Êtes-vous sûr de vouloir supprimer cette commande ?
                {orderToDelete && (
                  <strong className="block mt-2 font-mono bg-slate-100 p-2 rounded">
                    Commande #{orderToDelete.id?.slice(0, 8)}
                  </strong>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
              <Button variant="outline" onClick={() => setOrderToDelete(null)} disabled={singleActionLoading}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDeleteOrder} disabled={singleActionLoading}>
                {singleActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmationDeleteMultipleModal 
          open={showDeleteMultipleModal} 
          onClose={() => setShowDeleteMultipleModal(false)} 
          selectedCount={selectedIds.length} 
          items={selectedItemsList}
          onConfirm={handleDeleteSelected} 
          loading={isProcessing} 
          isPermanent={false}
          title="Mettre à la corbeille"
          message="Ces commandes seront déplacées vers la corbeille."
        />
      </div>
    </AdminLayout>
  );
};

export default AdminDeliveryOrdersPage;