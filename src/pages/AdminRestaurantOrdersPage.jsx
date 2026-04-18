/*
 * TASK 1: ANALYSE DE LA STRUCTURE EXISTANTE
 * 
 * Fichier: AdminRestaurantOrdersPage.jsx
 * Objectif: Interface d'administration pour la gestion des commandes du restaurant.
 * 
 * --- Données de Commande Disponibles (Pour l'export & Stats) ---
 * Les données dans le tableau `orders` contiennent:
 * - id: uuid (ex: pour l'affichage court slice(0, 8))
 * - created_at: string (date et heure de création)
 * - customer_name: string (Nom du client direct ou via relation)
 * - orders?.customer_email: string (Email du client via relation principale)
 * - total / orders?.total: number (Montant total de la commande)
 * - order_method / orders?.order_method: string (Type de commande: counter, online, etc.)
 * - payment_method: string (Moyen de paiement)
 * - status: string (Statut actuel de la commande)
 * 
 * --- Intégration de l'Export & Statistiques ---
 * - `filteredOrders`: Tableau de données respectant TOUS les filtres (statut, date, montant) et la recherche textuelle.
 * - Les composants de statistiques (StatisticsCards, DailyRevenueChart, OrdersByStatusChart) prennent `filteredOrders` 
 *   en entrée afin de s'adapter dynamiquement à ce que l'utilisateur recherche.
 * - `sortedOrders`: Variante triée de `filteredOrders`. Utilisé pour l'export (pour respecter le tri de l'utilisateur) 
 *   et pour générer `paginatedOrders`.
 * 
 * --- Structure Existante ---
 * - Hooks Utilisés: useRestaurantOrders, useUpdateRestaurantOrderStatus, useState, useMemo, useToast.
 * - Fonctions: handleSearchChange, handleSort, handleItemsPerPageChange, handleUpdateStatus, confirmDelete, handleDeleteOrder, export.
 * - Emplacement des stats: Intégrées juste en dessous du titre/description, et au-dessus de la barre de filtres/recherche.
 */

import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useRestaurantOrders } from '@/hooks/useRestaurantOrders';
import { useUpdateRestaurantOrderStatus } from '@/hooks/useUpdateRestaurantOrderStatus';
import { useNewRestaurantOrderNotificationBadge } from '@/hooks/useNewRestaurantOrderNotificationBadge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  formatCurrency, 
  formatDateTime, 
  formatPaymentMethod, 
  formatRestaurantOrderStatus, 
  getRestaurantOrderStatusColor, 
  getOrderMethodLabel, 
  getValidActionsForOrderMethod 
} from '@/lib/formatters';
import { 
  Search,
  Store,
  Loader2,
  PlayCircle,
  CheckCircle2,
  Utensils,
  RefreshCw,
  X,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Trash2,
  AlertTriangle,
  BellRing,
  Filter,
  Calendar,
  DollarSign,
  Download,
  FileText
} from 'lucide-react';
import { RestaurantOrderDetailModal } from '@/components/RestaurantOrderDetailModal';
import { useToast } from '@/components/ui/use-toast';
import { getValidStatusTransitionsForOrderMethod } from '@/lib/orderStatusValidation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/lib/customSupabaseClient';
import { exportRestaurantOrdersToCSV, exportRestaurantOrdersToPDF } from '@/components/ExportRestaurantOrders';

// Statistics Components
import { StatisticsCards } from '@/components/StatisticsCards';
import { DailyRevenueChart } from '@/components/DailyRevenueChart';
import { OrdersByStatusChart } from '@/components/OrdersByStatusChart';

const AdminRestaurantOrdersPage = () => {
  const { orders = [], loading, error, refresh } = useRestaurantOrders();
  const { updateOrderStatus, loading: updatingStatus } = useUpdateRestaurantOrderStatus();
  const { unreadCount, resetBadge } = useNewRestaurantOrderNotificationBadge({ showToast: false });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // Advanced Filters State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: ''
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Deletion state
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handlers for search & filters
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const updateFilter = (key, value) => {
    setAdvancedFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: ''
    });
    setCurrentPage(1);
  };

  const resetDateFilters = () => {
    setAdvancedFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }));
    setCurrentPage(1);
  };

  const resetAmountFilters = () => {
    setAdvancedFilters(prev => ({ ...prev, amountMin: '', amountMax: '' }));
    setCurrentPage(1);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (advancedFilters.status !== 'all') count++;
    if (advancedFilters.dateFrom || advancedFilters.dateTo) count++;
    if (advancedFilters.amountMin || advancedFilters.amountMax) count++;
    return count;
  };

  // Combined Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (!order) return false;

      // 1. Status Filter
      if (advancedFilters.status !== 'all' && order.status !== advancedFilters.status) {
        return false;
      }

      // 2. Date Filter
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0); // Normalize time for comparison
      if (advancedFilters.dateFrom) {
        const fromDate = new Date(advancedFilters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (orderDate < fromDate) return false;
      }
      if (advancedFilters.dateTo) {
        const toDate = new Date(advancedFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(order.created_at) > toDate) return false;
      }

      // 3. Amount Filter
      const total = Number(order.total) || Number(order.orders?.total) || 0;
      if (advancedFilters.amountMin !== '' && total < Number(advancedFilters.amountMin)) return false;
      if (advancedFilters.amountMax !== '' && total > Number(advancedFilters.amountMax)) return false;

      // 4. Search Term
      const searchLower = searchTerm.toLowerCase();
      if (searchLower) {
        const idMatch = order.id?.toLowerCase().includes(searchLower);
        const nameMatch = order.customer_name?.toLowerCase().includes(searchLower) || 
                          order.orders?.customer_name?.toLowerCase().includes(searchLower);
        const emailMatch = order.orders?.customer_email?.toLowerCase().includes(searchLower);
        const methodMatch = order.order_method?.toLowerCase().includes(searchLower) || 
                            order.orders?.order_method?.toLowerCase().includes(searchLower);
        
        if (!idMatch && !nameMatch && !emailMatch && !methodMatch) return false;
      }

      return true;
    });
  }, [orders, searchTerm, advancedFilters]);

  // Sort logic
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4 ml-1 text-slate-400" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1 text-blue-600" /> : <ChevronDown className="w-4 h-4 ml-1 text-blue-600" />;
  };

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle nested or derived values
      if (sortConfig.key === 'customer_name') {
        aVal = a.customer_name || a.orders?.customer_name || '';
        bVal = b.customer_name || b.orders?.customer_name || '';
      } else if (sortConfig.key === 'total') {
        aVal = Number(a.total) || Number(a.orders?.total) || 0;
        bVal = Number(b.total) || Number(b.orders?.total) || 0;
      }

      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  // Pagination logic
  const totalItems = sortedOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedOrders.slice(start, start + itemsPerPage);
  }, [sortedOrders, currentPage, itemsPerPage]);

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Export handlers
  const handleExport = (type) => {
    if (sortedOrders.length === 0) return;
    
    let result;
    if (type === 'csv') {
      result = exportRestaurantOrdersToCSV(sortedOrders);
    } else {
      result = exportRestaurantOrdersToPDF(sortedOrders);
    }

    if (result.success) {
      toast({
        title: `Export ${type.toUpperCase()} réussi`,
        description: `${sortedOrders.length} commandes exportées.`,
        className: "bg-green-600 text-white border-none",
        duration: 3000
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erreur lors de l'export",
        description: result.error,
        duration: 4000
      });
    }
  };

  // Status Update
  const handleUpdateStatus = async (orderId, newStatus, currentStatus, orderMethod) => {
    try {
      const validTransitions = getValidStatusTransitionsForOrderMethod(currentStatus, orderMethod);
      if (!validTransitions.includes(newStatus)) {
         toast({
           title: "Transition Invalide",
           description: `Une commande '${getOrderMethodLabel(orderMethod)}' ne peut pas passer à ce statut.`,
           variant: "destructive"
         });
         return;
      }

      const res = await updateOrderStatus(orderId, newStatus, currentStatus, orderMethod);
      if (res && res.success) {
        toast({
          title: "Succès",
          description: "Commande modifiée avec succès",
          className: "bg-green-600 text-white border-none"
        });
        refresh(); 
        if (isModalOpen && selectedOrder?.id === orderId) {
          setIsModalOpen(false);
        }
      } else {
        throw new Error(res?.error || "Erreur de modification");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message || "Une erreur est survenue lors de la modification."
      });
    }
  };

  // Deletion
  const confirmDelete = (order) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      const actualOrderId = orderToDelete.order_id || orderToDelete.id;
      
      const { error: delError } = await supabase
        .from('orders')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', actualOrderId);

      if (delError) throw delError;

      // Also soft delete in restaurant_orders if present
      await supabase
        .from('restaurant_orders')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('order_id', actualOrderId);

      toast({
        title: "Succès",
        description: "Commande supprimée avec succès",
        className: "bg-green-600 text-white border-none"
      });
      refresh();
    } catch (err) {
      console.error("Error deleting order:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message || "Impossible de supprimer la commande."
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getActionIcon = (action) => {
     switch(action) {
       case 'preparing': return <PlayCircle className="w-4 h-4 mr-1.5" />;
       case 'ready': return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
       case 'served': return <Utensils className="w-4 h-4 mr-1.5" />;
       default: return null;
     }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6 pb-20">
          <Card className="p-6 border-red-200 bg-red-50 text-red-800 text-center flex flex-col items-center">
             <h2 className="text-xl font-bold mb-2">Erreur de chargement</h2>
             <p className="mb-4">{error.message}</p>
             <Button onClick={() => refresh()} variant="outline" className="bg-white">
               <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
             </Button>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
              <Utensils className="h-8 w-8 text-blue-600" />
              Commandes Restaurant
            </h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="animate-pulse cursor-pointer" onClick={resetBadge}>
                <BellRing className="w-3 h-3 mr-1" /> {unreadCount} nouvelles
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Gérez les commandes sur place, à emporter et au comptoir. Les statistiques reflètent vos filtres actuels.
          </p>
        </div>

        {/* Statistics Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top Cards */}
          <StatisticsCards orders={filteredOrders} />
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyRevenueChart orders={filteredOrders} />
            <OrdersByStatusChart orders={filteredOrders} />
          </div>
        </div>

        {/* Controls & Filters Section */}
        <div className="flex flex-col justify-between items-start gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col xl:flex-row justify-between w-full gap-4 items-start xl:items-center">
            
            <div className="flex flex-col w-full xl:w-auto gap-3 flex-1 xl:flex-none">
              <div className="flex items-center gap-2 w-full flex-wrap xl:flex-nowrap justify-start">
                {/* Export Buttons */}
                <div className="flex items-center gap-2 mr-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('csv')}
                    disabled={sortedOrders.length === 0}
                    className="shrink-0 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="hidden sm:inline">Exporter en CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('pdf')}
                    disabled={sortedOrders.length === 0}
                    className="shrink-0 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="w-4 h-4 mr-2 text-red-600" />
                    <span className="hidden sm:inline">Exporter en PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                </div>

                <div className="relative flex-1 min-w-[200px] xl:w-80 max-w-lg">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input 
                    placeholder="Numéro, client, email..." 
                    className="pl-9 pr-9 py-2 border-slate-200 focus:ring-blue-500 focus:border-blue-500 w-full rounded-lg text-slate-900 bg-slate-50"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  {searchTerm && (
                    <button 
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`shrink-0 rounded-lg transition-colors ${showAdvancedFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-700'}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres {getActiveFiltersCount() > 0 && <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 rounded-full px-1.5 py-0 min-w-[20px]">{getActiveFiltersCount()}</Badge>}
                </Button>

                <Button variant="outline" onClick={() => refresh()} disabled={loading} className="shrink-0 rounded-lg border-slate-200 bg-white" title="Actualiser">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} 
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Section */}
          {showAdvancedFilters && (
            <div className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    Statut de la commande
                  </label>
                  <Select value={advancedFilters.status} onValueChange={(v) => updateFilter('status', v)}>
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmé</SelectItem>
                      <SelectItem value="preparing">En préparation</SelectItem>
                      <SelectItem value="ready">Prêt à servir</SelectItem>
                      <SelectItem value="served">Servie</SelectItem>
                      <SelectItem value="delivered">Livrée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Période
                    </label>
                    {(advancedFilters.dateFrom || advancedFilters.dateTo) && (
                      <button onClick={resetDateFilters} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                        Effacer
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="date" 
                      value={advancedFilters.dateFrom} 
                      onChange={(e) => updateFilter('dateFrom', e.target.value)} 
                      className="bg-white border-slate-200 text-sm" 
                    />
                    <span className="text-slate-400 text-sm">à</span>
                    <Input 
                      type="date" 
                      value={advancedFilters.dateTo} 
                      onChange={(e) => updateFilter('dateTo', e.target.value)} 
                      className="bg-white border-slate-200 text-sm" 
                    />
                  </div>
                </div>

                {/* Amount Filter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      Montant (XAF)
                    </label>
                    {(advancedFilters.amountMin || advancedFilters.amountMax) && (
                      <button onClick={resetAmountFilters} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                        Effacer
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="number" 
                      placeholder="Min" 
                      value={advancedFilters.amountMin} 
                      onChange={(e) => updateFilter('amountMin', e.target.value)} 
                      className="bg-white border-slate-200 text-sm" 
                    />
                    <span className="text-slate-400 text-sm">-</span>
                    <Input 
                      type="number" 
                      placeholder="Max" 
                      value={advancedFilters.amountMax} 
                      onChange={(e) => updateFilter('amountMax', e.target.value)} 
                      className="bg-white border-slate-200 text-sm" 
                    />
                  </div>
                </div>

              </div>

              {/* Filter Actions */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-600 font-medium">
                  {filteredOrders.length} résultat{filteredOrders.length !== 1 ? 's' : ''} trouvé{filteredOrders.length !== 1 ? 's' : ''}
                </div>
                {getActiveFiltersCount() > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetAdvancedFilters} className="text-slate-500 hover:text-slate-800 hover:bg-slate-200">
                    <X className="w-4 h-4 mr-2" />
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Table Section */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th 
                    className="px-6 py-4 rounded-tl-xl cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      ID & Heure {getSortIcon('id')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                    onClick={() => handleSort('customer_name')}
                  >
                    <div className="flex items-center">
                      Client {getSortIcon('customer_name')}
                    </div>
                  </th>
                  <th className="px-6 py-4">Type</th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center">
                      Total {getSortIcon('total')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Statut {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-6 py-4 rounded-tr-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading && orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                      Chargement des commandes...
                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                      <div className="flex flex-col items-center justify-center">
                        <Utensils className="w-12 h-12 text-slate-300 mb-3" />
                        <span className="font-medium text-slate-600 text-base">Aucune commande trouvée</span>
                        <span className="text-slate-400 mt-1">Essayez de modifier vos filtres ou votre recherche.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const method = order.order_method || order.orders?.order_method || 'unknown';
                    const isCounter = method === 'counter';
                    const actionButtons = getValidActionsForOrderMethod(method, order.status);

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenModal(order)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">#{order.id.slice(0, 8)}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{formatDateTime(order.created_at)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{order.customer_name || 'Anonyme'}</div>
                          {order.orders?.customer_email && (
                            <div className="text-xs text-slate-500">{order.orders.customer_email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`flex items-center gap-1.5 w-fit ${isCounter ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                            <Store className="w-3 h-3" />
                            {getOrderMethodLabel(method)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{formatCurrency(order.total || order.orders?.total)}</div>
                          <div className="text-xs text-slate-500">{formatPaymentMethod(order.payment_method)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${getRestaurantOrderStatusColor(order.status)} px-2.5 py-1 text-xs font-medium border shadow-sm`}>
                            {formatRestaurantOrderStatus(order.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                           <div className="flex gap-2 items-center justify-end" onClick={(e) => e.stopPropagation()}>
                             {actionButtons.slice(0, 1).map((btn, idx) => (
                                <Button 
                                  key={idx}
                                  size="sm" 
                                  className={`${btn.className} h-8 text-xs shadow-sm`}
                                  disabled={updatingStatus}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(order.id, btn.action, order.status, method);
                                  }}
                                >
                                  {getActionIcon(btn.action)}
                                  {btn.label}
                                </Button>
                             ))}
                             {actionButtons.length === 0 && (
                               <span className="text-xs text-slate-400 italic mr-2">Terminé</span>
                             )}
                             
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                               title="Supprimer la commande"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 confirmDelete(order);
                               }}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Afficher par page:</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[80px] h-8 text-sm bg-white">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-slate-500">
                Affichage {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} résultats
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-white"
                >
                  Précédent
                </Button>
                <span className="text-sm text-slate-600 font-medium px-2">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-white"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Order Details Modal */}
        {isModalOpen && selectedOrder && (
          <RestaurantOrderDetailModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            order={selectedOrder}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Supprimer la commande
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteOrder}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Suppression...</>
                ) : (
                  "Supprimer"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminRestaurantOrdersPage;