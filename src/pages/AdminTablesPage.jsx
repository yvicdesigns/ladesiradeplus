import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useQRCode } from '@/hooks/useQRCode';
import { TableCard } from '@/components/TableCard';
import { TableFilters } from '@/components/TableFilters';
import { TableCreateModal } from '@/components/TableCreateModal';
import { TableEditModal } from '@/components/TableEditModal';
import { TableStatusModal } from '@/components/TableStatusModal';
import { TableDetailModal } from '@/components/TableDetailModal';
import { DeleteWithReasonModal } from '@/components/DeleteWithReasonModal';
import { QRCodeModal } from '@/components/QRCodeModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, RefreshCcw, LayoutGrid, AlertCircle, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSoftDelete } from '@/hooks/useSoftDelete';
import { useRestaurant } from '@/contexts/RestaurantContext';

export const AdminTablesPage = () => {
  const { restaurantId, loading: restaurantLoading } = useRestaurant();
  const { data: tables, loading: tablesLoading, refetch, error } = useRealtimeSubscription('tables');
  const qrCode = useQRCode();
  const { deleteRecord, loading: isDeleting } = useSoftDelete('tables');
  
  const loading = restaurantLoading || tablesLoading;

  const [modalState, setModalState] = useState({
    type: null,
    item: null
  });

  const closeModal = () => setModalState({ type: null, item: null });

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    capacity: 'all',
    location: 'all'
  });

  const restaurantTables = useMemo(() => {
    if (!tables || !restaurantId) return [];
    return tables.filter(t => t.restaurant_id === restaurantId);
  }, [tables, restaurantId]);

  const uniqueLocations = useMemo(() => {
    const locs = new Set(restaurantTables.map(t => t.location).filter(Boolean));
    return Array.from(locs).sort();
  }, [restaurantTables]);

  const filteredTables = useMemo(() => {
    let result = [...restaurantTables];

    if (filters.search) {
      result = result.filter(t => 
        t.table_number.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }

    if (filters.capacity !== 'all') {
      if (filters.capacity === 'small') {
        result = result.filter(t => t.capacity >= 2 && t.capacity <= 4);
      } else if (filters.capacity === 'medium') {
        result = result.filter(t => t.capacity >= 5 && t.capacity <= 6);
      } else if (filters.capacity === 'large') {
        result = result.filter(t => t.capacity >= 7);
      }
    }

    if (filters.location !== 'all') {
      result = result.filter(t => t.location === filters.location);
    }

    result.sort((a, b) => a.table_number.localeCompare(b.table_number, undefined, { numeric: true }));

    return result;
  }, [restaurantTables, filters]);

  const handleEdit = (table) => {
    setModalState({ type: 'edit', item: table });
  };

  const handleDeleteClick = (table) => {
    setModalState({ type: 'delete', item: table });
  };

  const executeDelete = async (reason) => {
    if (!modalState.item) return;
    const { success } = await deleteRecord(modalState.item.id, reason);
    if (success) {
      closeModal();
      refetch();
    }
  };

  const handleOpenQR = (table) => {
    setModalState({ type: 'qr', item: table });
  };

  if (restaurantLoading) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!restaurantId) {
    return (
      <AdminLayout>
        <Alert variant="destructive" className="my-6 max-w-2xl mx-auto">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Erreur de Configuration</AlertTitle>
          <AlertDescription className="mt-2">
            L'identifiant du restaurant est manquant. Veuillez vérifier la configuration de votre établissement.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl shadow-sm border border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2"><LayoutGrid className="h-6 w-6 text-primary" /> Gestion des Tables</h1>
            <p className="text-muted-foreground text-sm mt-1">Gérez le plan de salle, les codes QR et les statuts des tables.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" size="icon" onClick={refetch} title="Actualiser" className="shrink-0" disabled={loading}>
               <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={() => setModalState({ type: 'create', item: null })}
              className="w-full md:w-auto gap-2 shadow-sm bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Ajouter Table
            </Button>
          </div>
        </div>

        <TableFilters filters={filters} setFilters={setFilters} locations={uniqueLocations} />

        {error ? (
          <Alert variant="destructive" className="my-6">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription className="mt-2">
              {error.message || "Impossible de charger les tables. Veuillez vérifier votre connexion."}
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={refetch} className="bg-background text-foreground border-border">
                  Réessayer
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : loading && (!tables || tables.length === 0) ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl bg-card" />
            ))}
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-xl border border-dashed border-border shadow-sm">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <LayoutGrid className="h-8 w-8 text-muted-foreground opacity-60" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Aucune table trouvée</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">Essayez d'ajuster vos filtres de recherche ou créez une nouvelle table pour commencer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <AnimatePresence>
              {filteredTables.map((table) => (
                <TableCard 
                  key={table.id} 
                  table={table}
                  onEdit={() => handleEdit(table)}
                  onDelete={() => handleDeleteClick(table)}
                  onChangeStatus={() => setModalState({ type: 'status', item: table })}
                  onView={() => setModalState({ type: 'detail', item: table })}
                  onOpenQR={handleOpenQR}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        <TableCreateModal open={modalState.type === 'create'} onClose={closeModal} onSuccess={refetch} restaurantId={restaurantId} />
        <TableEditModal open={modalState.type === 'edit'} table={modalState.item} onClose={closeModal} onSuccess={refetch} restaurantId={restaurantId} />
        <TableStatusModal open={modalState.type === 'status'} table={modalState.item} onClose={closeModal} onSuccess={refetch} />
        <TableDetailModal open={modalState.type === 'detail'} table={modalState.item} onClose={closeModal} onEdit={handleEdit} onDelete={handleDeleteClick} />
        <DeleteWithReasonModal open={modalState.type === 'delete'} onClose={closeModal} requireReason={true} title="Mettre à la corbeille" message="Êtes-vous sûr de vouloir supprimer cette table ?" onConfirm={executeDelete} loading={isDeleting} />
        <QRCodeModal open={modalState.type === 'qr'} onClose={closeModal} table={modalState.item} loading={qrCode.loading} onRegenerate={async (id, name) => { await qrCode.regenerateQRCode(id, name); refetch(); }} onDownload={qrCode.handleDownload} onPrint={qrCode.handlePrint} onCopyUrl={qrCode.handleCopyUrl} />
      </div>
    </AdminLayout>
  );
};

export default AdminTablesPage;