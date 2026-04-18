import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { useRealtimeReservations } from '@/hooks/useRealtimeReservations';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReservationCreateModal } from '@/components/ReservationCreateModal';
import { ReservationEditModal } from '@/components/ReservationEditModal';
import { ReservationDetailModal } from '@/components/ReservationDetailModal';
import { ReservationFilters } from '@/components/ReservationFilters';
import { ReservationStatistics } from '@/components/ReservationStatistics';
import { ReservationExport } from '@/components/ReservationExport';
import { formatReservationStatus, formatTime } from '@/lib/formatters';
import { Plus, RefreshCcw, MoreHorizontal, Trash2, AlertCircle, Loader2, X, Search, Edit, Eye, Ban, BellRing } from 'lucide-react';
import { useNewReservationNotificationBadge } from '@/hooks/useNewReservationNotificationBadge';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ConnectionStatusBadge } from '@/components/ConnectionStatusBadge';
import { useManagerPermissions } from '@/hooks/useManagerPermissions';
import { ENTITY_TYPES } from '@/lib/managerPermissions';
import { useSoftDelete } from '@/hooks/useSoftDelete';

export const AdminReservationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { canDelete, canCancel, isAdmin } = useManagerPermissions(ENTITY_TYPES.RESERVATION);
  const { deleteRecord, loading: deleteLoading } = useSoftDelete('reservations');
  const { unreadCount: newReservationsCount, resetBadge: resetReservationBadge } = useNewReservationNotificationBadge({ showToast: false });
  
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Phase 2: Advanced Filters State
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    partyMin: '',
    partyMax: ''
  });

  // Delete Modal State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState(null);

  const { 
    reservations, loading, error, refresh, connectionStatus,
    updateReservationStatus, pagination, 
    sortBy, sortOrder, setSort, searchQuery, setSearchQuery 
  } = useRealtimeReservations(1, itemsPerPage); 

  useEffect(() => {
    const checkRole = async () => {
      setIsAuthChecking(true);
      if (!user) { navigate('/'); return; }
      try {
        const { data, error } = await supabase.from('profiles').select('role').eq('user_id', user.id).maybeSingle();
        if (error || !['admin', 'manager', 'staff'].includes(data?.role)) {
          toast({ variant: "destructive", title: "Accès refusé" });
          navigate('/');
        }
      } catch (err) { navigate('/'); } 
      finally { setIsAuthChecking(false); }
    };
    checkRole();
  }, [user, navigate, toast]);

  useEffect(() => { 
    pagination.setLimit(itemsPerPage); 
    pagination.setPage(1); 
  }, [itemsPerPage]);

  // Phase 2: Apply Client-side filters
  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      if (advancedFilters.status && advancedFilters.status !== 'all' && res.status !== advancedFilters.status) return false;
      if (advancedFilters.dateFrom && res.reservation_date < advancedFilters.dateFrom) return false;
      if (advancedFilters.dateTo && res.reservation_date > advancedFilters.dateTo) return false;
      if (advancedFilters.partyMin && Number(res.party_size) < Number(advancedFilters.partyMin)) return false;
      if (advancedFilters.partyMax && Number(res.party_size) > Number(advancedFilters.partyMax)) return false;
      return true;
    });
  }, [reservations, advancedFilters]);

  const toggleSelection = useCallback((id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]), []);
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === filteredReservations.length) setSelectedIds([]);
    else setSelectedIds(filteredReservations.map(r => r.id));
  }, [filteredReservations, selectedIds]);

  const handleDeleteConfirm = async () => {
    if (!reservationToDelete) return;
    
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Error: Admin access required to delete." });
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const { success, error: delError } = await deleteRecord(reservationToDelete.id, 'Manually deleted');
      
      if (success) {
        toast({ title: "Reservation deleted successfully", className: "bg-green-600 text-white border-none" });
        setIsDeleteDialogOpen(false);
        setReservationToDelete(null);
        refresh();
      } else {
        throw new Error(delError?.message || "Deletion failed");
      }
    } catch (err) {
      toast({ title: `Error: ${err.message}`, variant: "destructive" });
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(true);
    try {
      await updateReservationStatus(id, status);
      toast({ title: "Reservation updated successfully", className: "bg-green-600 text-white border-none" });
      setIsDetailOpen(false); 
    } catch (e) { 
      toast({ title: `Error: ${e.message}`, variant: "destructive" }); 
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleResetFilters = () => {
    setAdvancedFilters({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      partyMin: '',
      partyMax: ''
    });
    setSearchQuery('');
  };

  const handleSort = (column) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    setSort(column, isAsc ? 'desc' : 'asc');
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return <span className="ml-1 text-slate-300">↕</span>;
    return <span className="ml-1 text-blue-600 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  if (isAuthChecking) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  const startItem = (pagination.currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(pagination.currentPage * itemsPerPage, pagination.totalCount);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">Réservations</h1>
              <ConnectionStatusBadge status={connectionStatus} />
              {newReservationsCount > 0 && (
                <Badge variant="destructive" className="animate-pulse cursor-pointer" onClick={resetReservationBadge}>
                  <BellRing className="w-3 h-3 mr-1" /> {newReservationsCount} nouvelles
                </Badge>
              )}
            </div>
            <p className="text-slate-500 text-sm">Gérez toutes vos réservations de tables</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <ReservationExport reservations={filteredReservations} loading={loading} />
            <Button variant="outline" onClick={refresh} disabled={loading} title="Actualiser" className="h-10">
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-10">
              <Plus className="h-4 w-4 mr-2" /> Nouvelle
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600"/>
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ReservationStatistics reservations={filteredReservations} loading={loading} />

        {/* Filters Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Rechercher par n°, client, email, téléphone..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="text-sm font-medium text-slate-500">
              {filteredReservations.length} résultat(s) affiché(s)
            </div>
          </div>
          
          <ReservationFilters 
            filters={advancedFilters} 
            onFilterChange={setAdvancedFilters} 
            onReset={handleResetFilters} 
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox checked={selectedIds.length === filteredReservations.length && filteredReservations.length > 0} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead onClick={() => handleSort('id')} className="cursor-pointer whitespace-nowrap">
                    N° Réservation {getSortIcon('id')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('customer_name')} className="cursor-pointer whitespace-nowrap">
                    Client {getSortIcon('customer_name')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('reservation_date')} className="cursor-pointer whitespace-nowrap">
                    Date {getSortIcon('reservation_date')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('reservation_time')} className="cursor-pointer whitespace-nowrap">
                    Heure {getSortIcon('reservation_time')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('party_size')} className="cursor-pointer whitespace-nowrap">
                    Personnes {getSortIcon('party_size')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('status')} className="cursor-pointer whitespace-nowrap">
                    Statut {getSortIcon('status')}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && filteredReservations.length === 0 ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                      Aucune réservation trouvée. Ajustez vos filtres.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReservations.map((res) => (
                    <TableRow key={res.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-center">
                        <Checkbox checked={selectedIds.includes(res.id)} onCheckedChange={() => toggleSelection(res.id)} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        #{res.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{res.customer_name || 'Inconnu'}</div>
                        <div className="text-xs text-slate-500">{res.customer_email || res.customer_phone}</div>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {new Date(res.reservation_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {formatTime(res.reservation_time)}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {res.party_size}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${formatReservationStatus(res.status)} px-2.5 py-1 text-xs shadow-sm font-medium`}>
                          {res.status === 'pending' ? 'En attente' : res.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedReservation(res); setIsDetailOpen(true); }} title="Voir les détails">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-100" onClick={() => { setSelectedReservation(res); setIsEditOpen(true); }} title="Modifier">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {canCancel && res.status !== 'cancelled' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => handleStatusUpdate(res.id, 'cancelled')} title="Annuler">
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {isAdmin && canDelete && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => { setReservationToDelete(res); setIsDeleteDialogOpen(true); }} title="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {pagination.totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 bg-slate-50 gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Afficher</span>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                  <SelectTrigger className="w-[80px] h-8 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span>par page</span>
              </div>
              
              <div className="text-sm text-slate-600 font-medium">
                Affichage {startItem}-{endItem} sur {pagination.totalCount} résultats (avant filtrage local)
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white text-slate-700"
                  onClick={() => pagination.setPage(p => Math.max(1, p - 1))} 
                  disabled={pagination.currentPage === 1}
                >
                  Précédent
                </Button>
                <span className="text-sm font-medium text-slate-700 px-2">
                  Page {pagination.currentPage} sur {pagination.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white text-slate-700"
                  onClick={() => pagination.setPage(p => Math.min(pagination.totalPages, p + 1))} 
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <ReservationCreateModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        
        <ReservationDetailModal 
          open={isDetailOpen} 
          onClose={() => setIsDetailOpen(false)} 
          reservation={selectedReservation} 
          onEdit={(r) => { setSelectedReservation(r); setIsDetailOpen(false); setIsEditOpen(true); }} 
          onConfirm={() => handleStatusUpdate(selectedReservation.id, 'confirmed')} 
          onCancel={() => handleStatusUpdate(selectedReservation.id, 'cancelled')}
        />
        
        <ReservationEditModal 
          open={isEditOpen} 
          onClose={() => setIsEditOpen(false)} 
          reservation={selectedReservation} 
          onSuccess={() => {
            setIsEditOpen(false);
            refresh();
            toast({ title: "Reservation updated successfully", className: "bg-green-600 text-white border-none" });
          }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Confirmer la suppression
              </DialogTitle>
              <DialogDescription className="pt-3 text-base text-slate-700">
                Êtes-vous sûr de vouloir supprimer cette réservation ?
                <br />
                {reservationToDelete && (
                  <strong className="block mt-3 bg-slate-100 p-2 rounded text-slate-900 font-mono text-sm border border-slate-200">
                    N° {reservationToDelete.id.substring(0, 8)} - {reservationToDelete.customer_name}
                  </strong>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleteLoading}>
                Annuler
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
};

export default AdminReservationsPage;