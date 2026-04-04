import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, RotateCcw, Search, Loader2, Database } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';
import { useToast } from '@/components/ui/use-toast';
import { PaginationControls } from '@/components/PaginationControls';
import { HardDeleteConfirmationModal } from '@/components/HardDeleteConfirmationModal';
import { useHardDelete } from '@/hooks/useHardDelete';
import { verifyHardDelete } from '@/lib/hardDeleteVerification';

export const AdminTrashPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const { toast } = useToast();
  const { hardDelete, loading: isHardDeleting } = useHardDelete();

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const tablesToSearch = [
        { name: 'orders', type: 'Commande', titleCol: 'customer_name', idCol: 'id' },
        { name: 'delivery_orders', type: 'Livraison', titleCol: 'id', idCol: 'id' },
        { name: 'customers', type: 'Client', titleCol: 'name', idCol: 'id' },
        { name: 'menu_items', type: 'Produit', titleCol: 'name', idCol: 'id' },
        { name: 'reservations', type: 'Réservation', titleCol: 'customer_name', idCol: 'id' },
        { name: 'reviews', type: 'Avis', titleCol: 'customer_name', idCol: 'id' },
        { name: 'promo_codes', type: 'Code Promo', titleCol: 'code', idCol: 'id' },
        { name: 'menu_categories', type: 'Catégorie Menu', titleCol: 'name', idCol: 'id' },
        { name: 'tables', type: 'Table', titleCol: 'table_number', idCol: 'id' },
      ];

      let allDeleted = [];

      for (const table of tablesToSearch) {
        const { data, error } = await supabase
          .from(table.name)
          .select(`id, ${table.titleCol}, deleted_at`)
          .eq('is_deleted', true)
          .order('deleted_at', { ascending: false });

        if (!error && data) {
          allDeleted = [
            ...allDeleted,
            ...data.map(item => ({
              ...item,
              tableName: table.name,
              recordType: table.type,
              displayName: table.titleCol === 'id' ? `ID: ${item.id.slice(0,8)}` : (item[table.titleCol] || `ID: ${item.id.slice(0,8)}`),
              deletedDate: item.deleted_at
            }))
          ];
        }
      }

      allDeleted.sort((a, b) => new Date(b.deletedDate) - new Date(a.deletedDate));
      setRecords(allDeleted);
    } catch (error) {
      console.error("Error fetching trash:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger la corbeille." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.includes(searchTerm);
    const matchesType = typeFilter === 'all' || r.tableName === typeFilter;
    return matchesSearch && matchesType;
  });

  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const handleRestore = async (record) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.rpc('restore_record_with_audit', {
        table_name: record.tableName,
        record_id: record.id,
        user_id: user?.id,
        reason: "Restauration depuis la corbeille admin"
      });

      if (error) throw error;
      toast({ title: "Données restaurées", className: "bg-blue-600 text-white" });
      
      setRecords(prevRecords => prevRecords.filter(r => r.id !== record.id));
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur lors de la restauration", description: e.message });
    }
  };

  const executePermanentDelete = async () => {
    if (!selectedRecord) return;
    
    setIsVerifying(true);
    const { id, tableName } = selectedRecord;
    
    // 1. Execute initial hard delete
    let result = await hardDelete(id, tableName);
    
    if (result.success) {
      // 2. Verify deletion
      let isActuallyDeleted = await verifyHardDelete(tableName, id);
      
      // 3. Retry mechanism if record still exists (e.g. slight replication delay or constraint issue not caught)
      if (!isActuallyDeleted) {
        console.warn(`[Retry] Record ${id} still exists in ${tableName}, retrying hard delete...`);
        // Wait 1.5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        result = await hardDelete(id, tableName);
        isActuallyDeleted = await verifyHardDelete(tableName, id);
      }
      
      setIsVerifying(false);

      if (isActuallyDeleted) {
        // Immediate UI removal
        setRecords(prevRecords => prevRecords.filter(r => r.id !== id));
        setConfirmModalOpen(false);
        setSelectedRecord(null);
        
        toast({ 
          title: "Élément supprimé définitivement", 
          className: "bg-green-600 text-white" 
        });
        
        // Background refresh to ensure sync
        fetchTrash();
      } else {
        setConfirmModalOpen(false);
        setSelectedRecord(null);
        toast({ 
          variant: "destructive", 
          title: "Échec de la suppression", 
          description: "L'élément n'a pas pu être supprimé. Il est peut-être bloqué par une contrainte de clé étrangère (ex: commandes liées)." 
        });
      }
    } else {
      setIsVerifying(false);
      setConfirmModalOpen(false);
      setSelectedRecord(null);
      toast({ 
        variant: "destructive", 
        title: "Erreur de suppression", 
        description: result.error 
      });
    }
  };

  const isModalLoading = isHardDeleting || isVerifying;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Trash2 className="h-6 w-6" /></div>
              Corbeille
            </h1>
            <p className="text-muted-foreground mt-1">Gérez les éléments supprimés. <strong className="text-foreground">{filteredRecords.length} records supprimés.</strong></p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="orders">Commandes</SelectItem>
                <SelectItem value="delivery_orders">Livraisons</SelectItem>
                <SelectItem value="customers">Clients</SelectItem>
                <SelectItem value="menu_items">Produits</SelectItem>
                <SelectItem value="reservations">Réservations</SelectItem>
                <SelectItem value="reviews">Avis</SelectItem>
                <SelectItem value="promo_codes">Codes Promo</SelectItem>
                <SelectItem value="menu_categories">Catégories</SelectItem>
                <SelectItem value="tables">Tables</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Nom / Réf</TableHead>
                  <TableHead>Date de Suppression</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : paginatedRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-20 text-center text-muted-foreground"><Database className="h-10 w-10 mx-auto mb-3 opacity-20"/>La corbeille est vide.</TableCell></TableRow>
                ) : (
                  paginatedRecords.map(record => (
                    <TableRow key={`${record.tableName}-${record.id}`}>
                      <TableCell><Badge variant="outline">{record.recordType}</Badge></TableCell>
                      <TableCell className="font-medium">{record.displayName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(record.deletedDate)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{record.id.slice(0,12)}...</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200" 
                            onClick={() => handleRestore(record)}
                            disabled={isModalLoading && selectedRecord?.id === record.id}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" /> Restaurer
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => { 
                              setSelectedRecord(record); 
                              setConfirmModalOpen(true); 
                            }}
                            disabled={isModalLoading && selectedRecord?.id === record.id}
                          >
                            {isModalLoading && selectedRecord?.id === record.id ? (
                               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                               <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Supprimer définitivement
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredRecords.length > 0 && (
            <div className="p-4 border-t bg-gray-50/50">
              <PaginationControls currentPage={currentPage} totalPages={totalPages} totalCount={filteredRecords.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={setItemsPerPage} />
            </div>
          )}
        </div>

        <HardDeleteConfirmationModal 
          open={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
            if (!isModalLoading) setSelectedRecord(null);
          }}
          onConfirm={executePermanentDelete}
          itemName={selectedRecord?.displayName}
          loading={isModalLoading}
        />

      </div>
    </AdminLayout>
  );
};

export default AdminTrashPage;