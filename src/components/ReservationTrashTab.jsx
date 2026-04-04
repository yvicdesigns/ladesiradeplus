import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDateTime, formatTime } from '@/lib/formatters';
import { Trash2, RefreshCw, AlertTriangle, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationRestoreReservationModal } from '@/components/ConfirmationRestoreReservationModal';
import { ConfirmationDeleteMultipleModal } from '@/components/ConfirmationDeleteMultipleModal';
import { RestoreMultipleOrdersModal } from '@/components/RestoreMultipleOrdersModal'; // Can reuse for display
import { useTrash } from '@/hooks/useTrash';

export const ReservationTrashTab = ({ deletedReservations, loading: fetching }) => {
  const { restoreOrder, restoreMultiple, permanentlyDeleteOrder, deleteMultiplePermanently, loading: actionLoading } = useTrash();
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [singleRestoreItem, setSingleRestoreItem] = useState(null);
  const [singleDeleteItem, setSingleDeleteItem] = useState(null);

  // Filter
  const filteredReservations = useMemo(() => {
    if (!searchTerm) return deletedReservations;
    return deletedReservations.filter(r => 
      (r.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [deletedReservations, searchTerm]);

  // Selection Logic
  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReservations.length) setSelectedIds([]);
    else setSelectedIds(filteredReservations.map(r => r.id));
  };

  // Actions
  const handleRestoreMultiple = async () => {
    const items = selectedIds.map(id => ({ id, source_table: 'reservations' }));
    const success = await restoreMultiple(items);
    if (success) {
        setSelectedIds([]);
        setRestoreModalOpen(false);
    }
  };

  const handleDeleteMultiple = async () => {
    const items = selectedIds.map(id => ({ id, source_table: 'reservations' }));
    const success = await deleteMultiplePermanently(items);
    if (success) {
        setSelectedIds([]);
        setDeleteModalOpen(false);
    }
  };

  const handleSingleRestore = async () => {
    if (!singleRestoreItem) return;
    const success = await restoreOrder(singleRestoreItem.id, 'reservations');
    if (success) setSingleRestoreItem(null);
  };

  const handleSingleDelete = async () => {
    if (!singleDeleteItem) return;
    const success = await permanentlyDeleteOrder(singleDeleteItem.id, 'reservations');
    if (success) setSingleDeleteItem(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <Input 
             placeholder="Rechercher un client..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-9"
           />
        </div>
        
        <div className="flex gap-2">
           <Button 
             variant="outline" 
             size="sm"
             className="text-amber-600 border-amber-200 hover:bg-amber-50"
             disabled={selectedIds.length === 0}
             onClick={() => setRestoreModalOpen(true)}
           >
             <RefreshCw className="h-4 w-4 mr-2" />
             Restaurer ({selectedIds.length})
           </Button>
           <Button 
             variant="outline" 
             size="sm"
             className="text-red-600 border-red-200 hover:bg-red-50"
             disabled={selectedIds.length === 0}
             onClick={() => setDeleteModalOpen(true)}
           >
             <Trash2 className="h-4 w-4 mr-2" />
             Supprimer définitivement ({selectedIds.length})
           </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={filteredReservations.length > 0 && selectedIds.length === filteredReservations.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date / Heure</TableHead>
              <TableHead>Taille</TableHead>
              <TableHead>Supprimé le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching && filteredReservations.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20">
                   <div className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Chargement...</div>
                </TableCell></TableRow>
            ) : filteredReservations.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                   Aucune réservation dans la corbeille.
                </TableCell></TableRow>
            ) : (
                <AnimatePresence>
                   {filteredReservations.map(res => (
                     <motion.tr
                       key={res.id}
                       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       className="hover:bg-gray-50 border-b"
                     >
                        <TableCell>
                          <Checkbox 
                             checked={selectedIds.includes(res.id)}
                             onCheckedChange={() => toggleSelection(res.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{res.customer_name || 'Client Inconnu'}</TableCell>
                        <TableCell>
                          {res.reservation_date} <span className="text-muted-foreground text-xs">à {formatTime(res.reservation_time)}</span>
                        </TableCell>
                        <TableCell>{res.party_size} pers.</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(res.deleted_at)}</TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => setSingleRestoreItem(res)}>
                               <RefreshCw className="h-4 w-4" />
                             </Button>
                             <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => setSingleDeleteItem(res)}>
                               <AlertTriangle className="h-4 w-4" />
                             </Button>
                           </div>
                        </TableCell>
                     </motion.tr>
                   ))}
                </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <ConfirmationRestoreReservationModal 
         open={!!singleRestoreItem}
         onClose={() => setSingleRestoreItem(null)}
         reservation={singleRestoreItem}
         onConfirm={handleSingleRestore}
         loading={actionLoading}
      />
      
      <ConfirmationDeleteMultipleModal
         open={!!singleDeleteItem}
         onClose={() => setSingleDeleteItem(null)}
         selectedCount={1}
         isPermanent={true}
         onConfirm={handleSingleDelete}
         loading={actionLoading}
      />

      <RestoreMultipleOrdersModal
         open={restoreModalOpen}
         onClose={() => setRestoreModalOpen(false)}
         orders={filteredReservations.filter(r => selectedIds.includes(r.id)).map(r => ({ ...r, ui_type: 'Réservation', total: 0 }))} // Mapping specifically for modal display compatibility
         onConfirm={handleRestoreMultiple}
         loading={actionLoading}
      />

      <ConfirmationDeleteMultipleModal
         open={deleteModalOpen}
         onClose={() => setDeleteModalOpen(false)}
         selectedCount={selectedIds.length}
         isPermanent={true}
         onConfirm={handleDeleteMultiple}
         loading={actionLoading}
      />
    </div>
  );
};