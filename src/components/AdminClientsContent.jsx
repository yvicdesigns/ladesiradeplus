import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Calendar, 
  RefreshCw, 
  Users, 
  Eye, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Wrench, 
  Store, 
  Clock, 
  Utensils, 
  Loader2, 
  User,
  BugPlay,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDateTime, formatRestaurantOrderStatus, getRestaurantOrderStatusColor } from '@/lib/formatters';
import { ClientDetailModal } from '@/components/clients/ClientDetailModal';
import { ClientCreateModal } from '@/components/clients/ClientCreateModal';
import { CreateOrderModal } from '@/components/clients/CreateOrderModal';
import { AdminCounterOrderForm } from '@/components/AdminCounterOrderForm';
import { RestaurantOrderDetailModal } from '@/components/RestaurantOrderDetailModal';
import { PaginationControls } from '@/components/PaginationControls';
import { useClients } from '@/hooks/useClients';
import { useRealtimeRestaurantOrders } from '@/hooks/useRealtimeRestaurantOrders';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// Phase 2 components
import { ClientFiltersPanel } from '@/components/clients/ClientFiltersPanel';
import { ClientStatisticsPanel } from '@/components/clients/ClientStatisticsPanel';
import { useClientExport } from '@/hooks/useClientExport';

export const AdminClientsContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { exportToCSV, exportToPDF } = useClientExport();
  
  // Phase 2 Filters State
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    minOrders: '',
    maxOrders: ''
  });
  
  // We pass limit='all' assuming we want all clients for client-side filtering and export
  // Alternatively, just pull the standard set if it's small enough. The hook uses limit: 50 by default.
  // We'll let useClients use its default or apply search server-side, but do advanced filters client-side.
  const { 
    clients, 
    loading: clientsLoading, 
    error: clientsError, 
    refetch: refetchClients, 
    createClient, 
    updateClient,
    deleteClient,
    totalCount 
  } = useClients({ search: searchTerm });
  
  const { toast } = useToast();
  
  const { orders: restaurantOrders, loading: ordersLoading, updateStatus, refresh: refetchOrders } = useRealtimeRestaurantOrders({
    page: 1, limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeDeleted: false
  });
  
  const [activeTab, setActiveTab] = useState('list');
  
  const [localClients, setLocalClients] = useState([]);
  const [localTotalCount, setLocalTotalCount] = useState(0);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ field: 'created_at', order: 'desc' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [selectedClientForOrder, setSelectedClientForOrder] = useState(null);
  
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Deletion Confirmation State
  const [clientToDelete, setClientToDelete] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update local state when hook data changes
  useEffect(() => {
    if (!clientsLoading) {
      setLocalClients(clients || []);
      setLocalTotalCount(totalCount || (clients ? clients.length : 0));
    }
  }, [clients, clientsLoading, totalCount, clientsError]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase.channel(`public:customers:admin_list`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'customers'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (!payload.new.is_deleted) {
            setLocalClients(prev => {
              if (prev.some(c => c.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.is_deleted) {
             setLocalClients(prev => prev.filter(c => c.id !== payload.new.id));
          } else {
             setLocalClients(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
          }
        } else if (payload.eventType === 'DELETE') {
          setLocalClients(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset page on search
  };

  const handleSearchReset = () => {
    setSearchTerm('');
    setAdvancedFilters({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      minOrders: '',
      maxOrders: ''
    });
    setCurrentPage(1); // Reset page on search clear
  };

  // Phase 2: Client-side filtering logic
  const filteredClients = useMemo(() => {
    return localClients.filter(c => {
      // status
      if (advancedFilters.status && advancedFilters.status !== 'all' && c.statut_client !== advancedFilters.status) return false;
      
      // dateFrom
      if (advancedFilters.dateFrom && new Date(c.created_at) < new Date(advancedFilters.dateFrom)) return false;
      
      // dateTo
      if (advancedFilters.dateTo && new Date(c.created_at) > new Date(advancedFilters.dateTo + 'T23:59:59')) return false;
      
      // minOrders
      if (advancedFilters.minOrders && (c.total_visits || 0) < Number(advancedFilters.minOrders)) return false;
      
      // maxOrders
      if (advancedFilters.maxOrders && (c.total_visits || 0) > Number(advancedFilters.maxOrders)) return false;
      
      return true;
    });
  }, [localClients, advancedFilters]);

  // Sorting Logic
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset page on sort
  };

  const sortClients = (clientsToSort) => {
    if (!sortConfig.field) return clientsToSort;
    return [...clientsToSort].sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedClients = useMemo(() => sortClients(filteredClients), [filteredClients, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedClients.length / itemsPerPage);
  
  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset page on items per page change
  };

  const calculatePaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedClients.slice(startIndex, startIndex + itemsPerPage);
  };

  const paginatedClients = useMemo(() => calculatePaginatedData(), [sortedClients, currentPage, itemsPerPage]);

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setIsDetailModalOpen(true);
  };

  // Phase 2: Export Handlers
  const handleExportCSV = () => {
    const { success, error } = exportToCSV(sortedClients);
    if (success) {
      toast({ title: "Succès", description: "Export CSV réussi", className: "bg-green-600 text-white border-none" });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: error });
    }
  };

  const handleExportPDF = () => {
    const { success, error } = exportToPDF(sortedClients);
    if (success) {
      toast({ title: "Succès", description: "Export PDF réussi", className: "bg-green-600 text-white border-none" });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: error });
    }
  };

  // Wrapped CRUD functions to inject toasts without altering child components
  const wrappedCreateClient = async (data) => {
    const result = await createClient(data);
    if (!result.success && !result.isDuplicate) {
      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-2"><XCircle className="w-5 h-5" /> Erreur de création</div>,
        description: `Erreur: ${result.error?.message || "La création du client a échoué."}`,
        className: "bg-red-600 text-white border-none",
        duration: 4000,
      });
    }
    return result;
  };

  const wrappedUpdateClient = async (id, data) => {
    const result = await updateClient(id, data);
    if (!result.success) {
      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-2"><XCircle className="w-5 h-5" /> Erreur de modification</div>,
        description: `Erreur: ${result.error?.message || "La modification du client a échoué."}`,
        className: "bg-red-600 text-white border-none",
        duration: 4000,
      });
    }
    return result;
  };

  const handleClientCreated = () => {
    if (refetchClients) refetchClients(); 
    setIsCreateModalOpen(false);
    toast({
      title: <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Client créé avec succès</div>,
      className: "bg-green-600 text-white border-none",
      duration: 3500,
    });
  };

  const handleClientUpdated = () => {
    if (refetchClients) refetchClients();
    toast({
      title: <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Client modifié avec succès</div>,
      className: "bg-green-600 text-white border-none",
      duration: 3500,
    });
  };

  const handleOrderSuccess = () => {
    if (refetchOrders) refetchOrders();
    setIsCreateOrderModalOpen(false);
  };
  
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsOrderDetailModalOpen(true);
  };

  // Deletion Handlers
  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setShowDeleteConfirmation(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setTimeout(() => setClientToDelete(null), 200); // Clear after animation
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete || !deleteClient) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteClient(clientToDelete.id);
      if (result.success) {
        toast({
          title: <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Client supprimé avec succès</div>,
          description: `Le client ${clientToDelete.name || 'Sans nom'} a été retiré.`,
          className: "bg-green-600 text-white border-none",
          duration: 3500,
        });
        if (refetchClients) refetchClients();
      } else {
        toast({
          variant: "destructive",
          title: <div className="flex items-center gap-2"><XCircle className="w-5 h-5" /> Erreur de suppression</div>,
          description: `Erreur: ${result.error?.message || "Impossible de supprimer ce client."}`,
          className: "bg-red-600 text-white border-none",
          duration: 4000,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: <div className="flex items-center gap-2"><XCircle className="w-5 h-5" /> Erreur inattendue</div>,
        description: `Erreur: ${error?.message || "Une erreur inattendue est survenue."}`,
        className: "bg-red-600 text-white border-none",
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setTimeout(() => setClientToDelete(null), 200);
    }
  };
  
  const handleUpdateOrderStatus = async (id, newStatus, orderMethod, currentStatus) => {
     const result = await updateStatus(id, newStatus);
     if (result.success) {
         toast({ title: "Statut mis à jour", description: `Commande passée à ${formatRestaurantOrderStatus(newStatus)}` });
         setIsOrderDetailModalOpen(false);
     } else {
         toast({ variant: "destructive", title: "Erreur", description: result.error?.message || "Impossible de mettre à jour le statut." });
     }
  };

  const handleUpdatePaymentStatus = async (id, newStatus) => {
     try {
         const { data, error } = await supabase
             .from('restaurant_orders')
             .update({ payment_status: newStatus })
             .eq('id', id)
             .select();

         if (error) throw error;
         
         if (!data || data.length === 0) {
             throw new Error("Aucune commande trouvée avec cet ID ou problème de permissions RLS.");
         }

         toast({ 
             title: "Paiement mis à jour", 
             description: "Commande marquée comme payée avec succès.",
             variant: "default"
         });
         
         if (refetchOrders) refetchOrders();
         
     } catch (error) {
         toast({ 
             variant: "destructive", 
             title: "Erreur de mise à jour", 
             description: error.message || "Impossible de mettre à jour le statut de paiement. Vérifiez votre connexion." 
         });
         throw error;
     }
  };
  
  const displayOrders = useMemo(() => {
    return restaurantOrders.filter(o => o.order_method !== 'counter');
  }, [restaurantOrders]);

  const SortIcon = ({ field }) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-20" />;
    return sortConfig.order === 'asc' ? <ChevronUp className="w-4 h-4 ml-1 text-indigo-600" /> : <ChevronDown className="w-4 h-4 ml-1 text-indigo-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {activeTab === 'list' && <><Users className="w-6 h-6 text-indigo-600" /> Base Clients</>}
              {activeTab === 'counter' && <><Store className="w-6 h-6 text-purple-600" /> Commande Comptoir</>}
              {activeTab === 'orders' && <><Utensils className="w-6 h-6 text-amber-600" /> Commandes</>}
            </h1>
            {!isOnline ? (
               <Badge variant="destructive" className="flex items-center gap-1"><WifiOff className="w-3 h-3"/> Hors ligne</Badge>
            ) : (
               <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"><Wifi className="w-3 h-3"/> En ligne</Badge>
            )}
          </div>
          <p className="text-slate-500 mt-1">
            {activeTab === 'list' && `Gérez vos clients et leur historique (${sortedClients.length} au total)`}
            {activeTab === 'counter' && `Enregistrez rapidement une vente au comptoir`}
            {activeTab === 'orders' && `Gérez vos commandes en salle et vos livraisons`}
          </p>
        </div>
        {activeTab === 'list' && (
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Phase 2: Export Buttons */}
            <div className="flex gap-2 mr-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportCSV} 
                disabled={sortedClients.length === 0 || clientsLoading}
                className="bg-white shadow-sm border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-700"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-amber-600" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportPDF} 
                disabled={sortedClients.length === 0 || clientsLoading}
                className="bg-white shadow-sm border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-700"
              >
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                PDF
              </Button>
            </div>
            
            <Button onClick={refetchClients} variant="outline" className="bg-white" disabled={clientsLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${clientsLoading ? 'animate-spin' : ''}`} /> Actualiser
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Nouveau Client
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 max-w-[600px] mb-6 h-auto">
          <TabsTrigger value="list" className="p-3">Liste des clients</TabsTrigger>
          <TabsTrigger value="counter" className="p-3">Commande Comptoir</TabsTrigger>
          <TabsTrigger value="orders" className="p-3">Sur place / Livraison</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6 mt-0">
          {clientsError && !clientsLoading && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur de Chargement</AlertTitle>
              <AlertDescription>
                Impossible de charger la liste des clients. {clientsError?.message || "Une erreur est survenue."}
              </AlertDescription>
            </Alert>
          )}

          {/* Phase 2: Statistics Panel */}
          <ClientStatisticsPanel clients={filteredClients} />

          {/* Phase 2: Filters Panel */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-96 flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Rechercher par nom, email ou téléphone..." 
                  className="pl-9 pr-9 bg-white border-slate-200 text-slate-900"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  disabled={clientsLoading && localClients.length === 0}
                />
                {searchTerm && (
                  <button 
                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-sm font-medium text-slate-500">
                {sortedClients.length} client(s) affiché(s)
              </div>
            </div>

            <ClientFiltersPanel 
              filters={advancedFilters}
              onFilterChange={setAdvancedFilters}
              onReset={handleSearchReset}
            />
          </div>

          <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-4 md:p-6 pb-4">
               <CardTitle className="text-lg font-bold text-slate-800">Données Clients</CardTitle>
               <CardDescription>Consultez et gérez les détails de vos clients</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead 
                        onClick={() => handleSort('name')} 
                        className={`cursor-pointer select-none hover:bg-slate-100 transition-colors ${sortConfig.field === 'name' ? 'text-indigo-700 bg-slate-100/50' : ''}`}
                      >
                        <div className="flex items-center font-semibold">Nom <SortIcon field="name" /></div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('email')} 
                        className={`cursor-pointer select-none hover:bg-slate-100 transition-colors ${sortConfig.field === 'email' ? 'text-indigo-700 bg-slate-100/50' : ''}`}
                      >
                        <div className="flex items-center font-semibold">Email <SortIcon field="email" /></div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('phone')} 
                        className={`cursor-pointer select-none hover:bg-slate-100 transition-colors ${sortConfig.field === 'phone' ? 'text-indigo-700 bg-slate-100/50' : ''}`}
                      >
                        <div className="flex items-center font-semibold">Téléphone <SortIcon field="phone" /></div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('created_at')} 
                        className={`cursor-pointer select-none hover:bg-slate-100 transition-colors ${sortConfig.field === 'created_at' ? 'text-indigo-700 bg-slate-100/50' : ''}`}
                      >
                        <div className="flex items-center font-semibold">Date d'inscription <SortIcon field="created_at" /></div>
                      </TableHead>
                      <TableHead className="font-semibold">Total Dépensé</TableHead>
                      <TableHead className="font-semibold">Statut</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsLoading && localClients.length === 0 ? (
                      Array(itemsPerPage).fill(0).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20 mb-1" /><Skeleton className="h-3 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-12 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : sortedClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16">
                           <div className="flex flex-col items-center justify-center text-slate-500">
                              <Users className="w-10 h-10 mb-3 text-slate-300" />
                              <p className="text-lg font-medium text-slate-900">
                                {searchTerm || advancedFilters.status !== 'all' ? 'Aucun résultat' : 'Aucun client trouvé'}
                              </p>
                              <p className="text-sm">
                                {searchTerm || advancedFilters.status !== 'all'
                                  ? 'Aucun client ne correspond à vos filtres.' 
                                  : 'Ajoutez votre premier client pour commencer.'}
                              </p>
                           </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedClients.map(client => (
                        <TableRow key={client.id} className="hover:bg-slate-50 transition-colors">
                          <TableCell>
                            <div className="font-semibold text-slate-900">{client.name || 'Sans nom'}</div>
                          </TableCell>
                          <TableCell>
                            {client.email ? (
                               <div className="flex items-center text-sm text-slate-600"><Mail className="w-3.5 h-3.5 mr-2 text-slate-400" /> {client.email}</div>
                            ) : (
                               <span className="text-xs text-slate-400 italic">Non spécifié</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {client.phone ? (
                               <div className="flex items-center text-sm text-slate-600"><Phone className="w-3.5 h-3.5 mr-2 text-slate-400" /> {client.phone}</div>
                            ) : (
                               <span className="text-xs text-slate-400 italic">Non spécifié</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-slate-600">
                              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                              {formatDateTime(client.created_at, true)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-slate-800">{formatCurrency(client.total_spent || 0)}</div>
                            <div className="text-xs font-medium text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded mt-0.5">{client.total_visits || 0} commande(s)</div>
                          </TableCell>
                          <TableCell>
                             <Badge variant="outline" className={
                               (!client.statut_client || client.statut_client === 'Actif') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                               client.statut_client === 'Inactif' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                               'bg-red-50 text-red-700 border-red-200'
                             }>
                               {client.statut_client || 'Actif'}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleViewClient(client)} className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700" title="Voir Profil">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(client)} className="text-red-500 hover:bg-red-50 hover:text-red-700" title="Supprimer">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {sortedClients.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalCount={sortedClients.length}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    loading={clientsLoading}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="counter" className="mt-0 h-[calc(100vh-250px)] min-h-[700px]">
           <div className="h-full bg-slate-50/50 rounded-xl p-1 md:p-4">
              <AdminCounterOrderForm 
                onSuccess={() => {
                  if (refetchOrders) refetchOrders();
                  setActiveTab('orders');
                }} 
              />
           </div>
        </TabsContent>
        
        <TabsContent value="orders" className="mt-0 space-y-6">
           <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div>
                <h2 className="text-lg font-bold text-slate-800">Commandes Sur place & Livraison</h2>
                <p className="text-sm text-slate-500">Gérez vos commandes en salle et vos livraisons ({displayOrders.length} récentes)</p>
             </div>
             <Button 
               onClick={() => { setSelectedClientForOrder(null); setIsCreateOrderModalOpen(true); }} 
               className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
             >
                 <Plus className="w-4 h-4 mr-2" /> Nouvelle Commande
             </Button>
           </div>

           <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
             <div className="overflow-x-auto">
               <Table className="min-w-[800px]">
                 <TableHeader className="bg-slate-50">
                    <TableRow>
                       <TableHead className="w-[120px]">Order #</TableHead>
                       <TableHead>Type</TableHead>
                       <TableHead>Client</TableHead>
                       <TableHead>Total</TableHead>
                       <TableHead>Statut</TableHead>
                       <TableHead>Date</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {ordersLoading ? (
                       <TableRow><TableCell colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></TableCell></TableRow>
                    ) : displayOrders.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={7} className="text-center py-16">
                           <div className="flex flex-col items-center justify-center text-slate-500">
                              <Utensils className="w-10 h-10 mb-3 text-slate-300" />
                              <p className="text-lg font-medium text-slate-900">Aucune commande récente</p>
                              <p className="text-sm">Les nouvelles commandes s'afficheront ici.</p>
                           </div>
                         </TableCell>
                       </TableRow>
                    ) : (
                       displayOrders.map(order => (
                         <TableRow key={order.id} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-mono font-medium text-xs text-slate-500 align-middle">
                               #{order.id.slice(0,6)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-slate-50 text-slate-700">
                                {order.type === 'delivery' ? 'Livraison' : (order.order_method === 'qr_code' ? 'QR Code' : 'Sur place')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1 items-start">
                                   <span className="font-semibold text-slate-800 flex items-center gap-1 text-sm">
                                     <User className="w-3.5 h-3.5 text-slate-400" />
                                     {order.customer_name || 'Anonyme'}
                                   </span>
                                   {order.table_number && (
                                     <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-amber-100 text-amber-800 border-amber-200">
                                       Table {order.table_number}
                                     </Badge>
                                   )}
                               </div>
                            </TableCell>
                            <TableCell className="font-bold font-mono text-slate-700">
                               {formatCurrency(order.orders?.total)}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getRestaurantOrderStatusColor(order.status)} px-2 py-0.5 whitespace-nowrap border shadow-sm`}>
                                {formatRestaurantOrderStatus(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                               <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDateTime(order.created_at)}</div>
                            </TableCell>
                            <TableCell className="text-right">
                               <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)} className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700" title="Voir les détails">
                                 <Eye className="w-4 h-4" />
                               </Button>
                            </TableCell>
                         </TableRow>
                       ))
                    )}
                 </TableBody>
               </Table>
             </div>
           </Card>
        </TabsContent>
      </Tabs>

      <ClientCreateModal 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={handleClientCreated}
        createClient={wrappedCreateClient}
        updateClient={wrappedUpdateClient}
      />
      
      {selectedClient && (
        <ClientDetailModal 
          open={isDetailModalOpen} 
          onClose={() => {
            setIsDetailModalOpen(false);
            setTimeout(() => setSelectedClient(null), 200);
          }} 
          client={selectedClient}
          onUpdate={handleClientUpdated}
          onCreateOrder={() => {
            setSelectedClientForOrder(selectedClient);
            setIsDetailModalOpen(false);
            setIsCreateOrderModalOpen(true);
            setActiveTab('orders');
          }}
        />
      )}

      {isCreateOrderModalOpen && (
        <CreateOrderModal 
          open={isCreateOrderModalOpen}
          onClose={() => {
            setIsCreateOrderModalOpen(false);
            setTimeout(() => setSelectedClientForOrder(null), 200);
          }}
          client={selectedClientForOrder}
          onSuccess={handleOrderSuccess}
        />
      )}
      
      {isOrderDetailModalOpen && selectedOrder && (
         <RestaurantOrderDetailModal 
            order={displayOrders.find(o => o.id === selectedOrder.id) || selectedOrder} 
            open={isOrderDetailModalOpen} 
            onOpenChange={setIsOrderDetailModalOpen} 
            onUpdateStatus={handleUpdateOrderStatus}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
         />
      )}

      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Supprimer le client
            </DialogTitle>
            <DialogDescription className="pt-3 pb-2 text-base">
              Êtes-vous sûr de vouloir supprimer <strong>{clientToDelete?.name || 'ce client'}</strong> ?
            </DialogDescription>
            <DialogDescription className="text-red-500 font-medium pb-2">
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Suppression...</>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};