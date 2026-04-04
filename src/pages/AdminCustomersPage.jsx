import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomerCreateModal } from '@/components/CustomerCreateModal';
import { CustomerEditModal } from '@/components/CustomerEditModal';
import { CustomerDetailModal } from '@/components/CustomerDetailModal';
import { CustomerNotesModal } from '@/components/CustomerNotesModal';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { Search, Plus, User, FileText, Eye, Edit, Filter, Users, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useManagerPermissions } from '@/hooks/useManagerPermissions';
import { ENTITY_TYPES } from '@/lib/managerPermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDeleteWithUndo } from '@/hooks/useDeleteWithUndo';
import { DeleteButton } from '@/components/DeleteButton';
import { DeletedRecordIndicator } from '@/components/DeletedRecordIndicator';
import { motion, AnimatePresence } from 'framer-motion';

const MotionTableRow = motion(TableRow);

export const AdminCustomersPage = () => {
  const { data: rawCustomers, loading, refetch, error } = useRealtimeSubscription('customers');
  const { toast } = useToast();
  const { canDelete } = useManagerPermissions(ENTITY_TYPES.CUSTOMER);
  const { deleteRecord, undoDelete, isDeleting } = useDeleteWithUndo('customers', refetch);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [sortOption, setSortOption] = useState('name');
  const [showDeleted, setShowDeleted] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modals, setModals] = useState({ create: false, edit: false, detail: false, notes: false, delete: false });

  const toggleModal = (modalName, isOpen, customer = null) => { 
    if (customer) setSelectedCustomer(customer); 
    setModals(prev => ({ ...prev, [modalName]: isOpen })); 
  };
  
  const handleMessage = () => { toast({ title: "Fonctionnalité à venir", description: "Le système de messagerie est en cours de développement." }); };

  const activeCustomers = useMemo(() => {
    if (!rawCustomers) return [];
    return rawCustomers.filter(c => !c.is_deleted);
  }, [rawCustomers]);

  const stats = useMemo(() => {
    if (!activeCustomers) return { total: 0, revenue: 0, avgVisits: 0, newThisMonth: 0 };
    const total = activeCustomers.length;
    const revenue = activeCustomers.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0);
    const avgVisits = total ? Math.round(activeCustomers.reduce((sum, c) => sum + (c.total_visits || 0), 0) / total) : 0;
    const now = new Date();
    const newThisMonth = activeCustomers.filter(c => { if (!c.registration_date) return false; const d = new Date(c.registration_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
    return { total, revenue, avgVisits, newThisMonth };
  }, [activeCustomers]);

  const uniqueCities = useMemo(() => { 
    if (!rawCustomers) return [];
    const cities = new Set(rawCustomers.map(c => c.city).filter(Boolean)); 
    return Array.from(cities).sort(); 
  }, [rawCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!rawCustomers) return [];
    let result = [...rawCustomers];
    
    if (!showDeleted) result = result.filter(c => !c.is_deleted);
    
    if (searchTerm) { const lower = searchTerm.toLowerCase(); result = result.filter(c => (c.name || '').toLowerCase().includes(lower) || (c.email || '').toLowerCase().includes(lower) || (c.phone || '').includes(lower)); }
    if (filterCity !== 'all') result = result.filter(c => c.city === filterCity);
    
    result.sort((a, b) => {
      // Put deleted at bottom always if showing them
      if (a.is_deleted !== b.is_deleted) return a.is_deleted ? 1 : -1;
      
      switch (sortOption) {
        case 'registration_date': return new Date(b.registration_date || 0) - new Date(a.registration_date || 0);
        case 'visits': return (b.total_visits || 0) - (a.total_visits || 0);
        case 'spent': return (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0);
        case 'name': default: return (a.name || '').localeCompare(b.name || '');
      }
    });
    return result;
  }, [rawCustomers, searchTerm, filterCity, sortOption, showDeleted]);

  const confirmDelete = async () => {
    if (!selectedCustomer) return;
    await deleteRecord(selectedCustomer.id, "Suppression du profil client");
    toggleModal('delete', false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div><h1 className="text-xl font-bold tracking-tight text-foreground">Clients</h1><p className="text-muted-foreground text-sm">Gérez votre base de données clients et vos relations.</p></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-md border shadow-sm text-sm">
                <Checkbox id="show-deleted" checked={showDeleted} onCheckedChange={setShowDeleted} />
                <label htmlFor="show-deleted" className="cursor-pointer font-medium text-muted-foreground">Afficher les supprimés</label>
            </div>
            <Button onClick={() => toggleModal('create', true)} className="bg-primary text-primary-foreground gap-2 text-sm"><Plus className="h-4 w-4" /> Ajouter Client</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Total Clients Actifs</p><h3 className="text-xl font-bold">{stats.total}</h3></div><div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-600 dark:text-blue-300"><Users className="h-5 w-5" /></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Revenu Total</p><h3 className="text-xl font-bold">{stats.revenue.toLocaleString()} F</h3></div><div className="p-2 bg-amber-100 dark:bg-green-900 rounded-full text-amber-600 dark:text-green-300"><DollarSign className="h-5 w-5" /></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Visites Moy.</p><h3 className="text-xl font-bold">{stats.avgVisits}</h3></div><div className="p-2 bg-amber-100 dark:bg-green-900 rounded-full text-amber-600 dark:text-green-300"><Eye className="h-5 w-5" /></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Nouveaux ce Mois</p><h3 className="text-xl font-bold">+{stats.newThisMonth}</h3></div><div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full text-purple-600 dark:text-purple-300"><Calendar className="h-5 w-5" /></div></CardContent></Card>
        </div>

        <Card className="border-border">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher par nom, email, tél..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 text-sm"/></div>
            <div className="flex gap-2 w-full md:w-auto ml-auto">
              <Select value={filterCity} onValueChange={setFilterCity}><SelectTrigger className="w-[150px] text-sm"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Ville" /></SelectTrigger><SelectContent><SelectItem value="all" className="text-sm">Toutes Villes</SelectItem>{uniqueCities.map(city => <SelectItem key={city} value={city} className="text-sm">{city}</SelectItem>)}</SelectContent></Select>
              <Select value={sortOption} onValueChange={setSortOption}><SelectTrigger className="w-[180px] text-sm"><SelectValue placeholder="Trier par" /></SelectTrigger><SelectContent><SelectItem value="name" className="text-sm">Nom (A-Z)</SelectItem><SelectItem value="registration_date" className="text-sm">Récemment Inscrits</SelectItem><SelectItem value="visits" className="text-sm">Plus de Visites</SelectItem><SelectItem value="spent" className="text-sm">Meilleurs Payeurs</SelectItem></SelectContent></Select>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>Impossible de charger les clients: {error.message}</AlertDescription>
          </Alert>
        )}

        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead className="text-sm">Client</TableHead><TableHead className="text-sm">Contact</TableHead><TableHead className="text-sm">Localisation</TableHead><TableHead className="text-sm">Inscrit</TableHead><TableHead className="text-center text-sm">Visites</TableHead><TableHead className="text-right text-sm">Dépensé</TableHead><TableHead className="text-right text-sm">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-40" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell><TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell><TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell></TableRow>) : filteredCustomers.length === 0 ? <TableRow><TableCell colSpan={7} className="h-48 text-center text-muted-foreground text-sm">Aucun client trouvé.</TableCell></TableRow> : (
                  <AnimatePresence>
                    {filteredCustomers.map((customer) => {
                      const content = (
                        <>
                          <TableCell><div className="font-medium text-foreground text-sm">{customer.name}</div>{customer.notes && <div className="text-xs text-muted-foreground truncate max-w-[150px]">{customer.notes}</div>}</TableCell>
                          <TableCell><div className="text-sm">{customer.email}</div><div className="text-xs text-muted-foreground">{customer.phone}</div></TableCell>
                          <TableCell><div className="text-sm">{customer.city}</div><div className="text-xs text-muted-foreground">{customer.country}</div></TableCell>
                          <TableCell><span className="text-sm text-muted-foreground">{customer.registration_date ? format(new Date(customer.registration_date), 'dd MMM yyyy') : 'N/A'}</span></TableCell>
                          <TableCell className="text-center"><Badge variant="secondary" className="font-mono text-xs">{customer.total_visits}</Badge></TableCell>
                          <TableCell className="text-right font-medium text-sm">{Number(customer.total_spent).toLocaleString()} F</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => toggleModal('notes', true, customer)} title="Notes"><FileText className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => toggleModal('detail', true, customer)} title="Détails"><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => toggleModal('edit', true, customer)} title="Éditer"><Edit className="h-4 w-4" /></Button>
                              {!customer.is_deleted && <DeleteButton onClick={() => toggleModal('delete', true, customer)} disabled={!canDelete} />}
                            </div>
                          </TableCell>
                        </>
                      );

                      return (
                        <MotionTableRow 
                          key={customer.id} 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }} 
                          className={`group ${customer.is_deleted ? 'border-none p-0 block table-row-group' : 'border-b hover:bg-muted/30'}`}
                        >
                          {customer.is_deleted ? (
                             <td colSpan="7" className="p-0 border-b">
                                <DeletedRecordIndicator onRestore={() => undoDelete(customer.id)} isRestoring={isDeleting}>
                                  <div className="flex items-center w-full px-4 py-3">
                                     <div className="flex-1 grid grid-cols-7 items-center gap-4">
                                        <div className="col-span-2 font-medium text-sm pl-2">{customer.name}</div>
                                        <div className="col-span-2 text-sm text-muted-foreground">{customer.email}</div>
                                        <div className="col-span-1 text-sm">{customer.city}</div>
                                        <div className="col-span-1 text-center text-xs">{customer.total_visits} visites</div>
                                        <div className="col-span-1 text-right text-sm">{Number(customer.total_spent).toLocaleString()} F</div>
                                     </div>
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
        </Card>

        <CustomerCreateModal open={modals.create} onClose={() => toggleModal('create', false)} />
        <CustomerEditModal open={modals.edit} onClose={() => toggleModal('edit', false)} customer={selectedCustomer}/>
        <CustomerDetailModal open={modals.detail} onClose={() => toggleModal('detail', false)} customer={selectedCustomer} onEdit={(c) => { toggleModal('detail', false); toggleModal('edit', true, c); }} onDelete={(c) => { toggleModal('detail', false); toggleModal('delete', true, c); }} onMessage={handleMessage}/>
        <CustomerNotesModal open={modals.notes} onClose={() => toggleModal('notes', false)} customer={selectedCustomer}/>
        
        <DeleteConfirmationModal 
          open={modals.delete} 
          onClose={() => toggleModal('delete', false)} 
          onConfirm={confirmDelete}
          loading={isDeleting}
          recordType="Client"
          recordName={selectedCustomer?.name}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminCustomersPage;