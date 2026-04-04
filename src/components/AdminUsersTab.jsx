import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AddAdminUserModal } from '@/components/AddAdminUserModal';
import { EditAdminUserModal } from '@/components/EditAdminUserModal';
import { EditAdminUserRoleModal } from '@/components/EditAdminUserRoleModal';
import { ConfirmationDeleteModal } from '@/components/ConfirmationDeleteModal';
import { Search, Plus, UserCog, Edit, Trash2, ShieldAlert, ShieldCheck, FileSpreadsheet, FileText, X, Users as UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useManagerPermissions } from '@/hooks/useManagerPermissions';
import { ENTITY_TYPES } from '@/lib/managerPermissions';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';

// Phase 2 components
import { UserFiltersPanel } from '@/components/users/UserFiltersPanel';
import { UserStatisticsPanel } from '@/components/users/UserStatisticsPanel';
import { UserExportService } from '@/services/UserExportService';

export const AdminUsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { canDelete } = useManagerPermissions(ENTITY_TYPES.USER);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  // Phase 2 Filters State
  const [advancedFilters, setAdvancedFilters] = useState({
    role: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('admin_users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) { 
      console.error('Error fetching users:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  const handleResetFilters = () => {
    setSearchTerm('');
    setAdvancedFilters({
      role: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Phase 2: Combined filtering
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 1. Search text
      if (searchTerm && !(user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      // 2. Role filter
      if (advancedFilters.role && advancedFilters.role !== 'all' && user.role !== advancedFilters.role) {
        return false;
      }
      // 3. Status filter
      if (advancedFilters.status && advancedFilters.status !== 'all' && user.status !== advancedFilters.status) {
        return false;
      }
      // 4. Date From
      if (advancedFilters.dateFrom && new Date(user.created_at) < new Date(advancedFilters.dateFrom)) {
        return false;
      }
      // 5. Date To
      if (advancedFilters.dateTo && new Date(user.created_at) > new Date(advancedFilters.dateTo + 'T23:59:59')) {
        return false;
      }
      return true;
    });
  }, [users, searchTerm, advancedFilters]);

  // Phase 2: Export Handlers
  const handleExportCSV = () => {
    const { success, error } = UserExportService.exportToCSV(filteredUsers);
    if (success) {
      toast({ title: "Succès", description: "Export CSV réussi", className: "bg-green-600 text-white border-none" });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: error });
    }
  };

  const handleExportPDF = () => {
    const { success, error } = UserExportService.exportToPDF(filteredUsers);
    if (success) {
      toast({ title: "Succès", description: "Export PDF réussi", className: "bg-green-600 text-white border-none" });
    } else {
      toast({ variant: "destructive", title: "Erreur", description: error });
    }
  };

  const isSelf = (targetUser) => {
    return (targetUser.user_id && targetUser.user_id === currentUser?.id) || (targetUser.email === currentUser?.email);
  };

  const isAdmin = (targetUser) => {
    return targetUser.role === 'admin';
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default'; // primary color
      case 'staff': return 'secondary';
      default: return 'outline';
    }
  };

  const handleDeleteClick = (user) => {
    const validRoles = ['admin', 'manager', 'staff', 'user', 'kitchen', 'delivery'];
    if (!validRoles.includes(user.role)) {
      toast({
        title: "Erreur de rôle",
        description: "Le rôle de l'utilisateur n'est pas reconnu.",
        variant: "destructive"
      });
      return;
    }

    if (user.role === 'admin') {
      toast({
        title: "Action non autorisée",
        description: "Vous ne pouvez pas supprimer un compte Administrateur.",
        variant: "destructive"
      });
      return;
    }

    if (isSelf(user)) {
      toast({
        title: "Action non autorisée",
        description: "Vous ne pouvez pas supprimer votre propre compte.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header & Export Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion de l'équipe</h1>
          <p className="text-slate-500 mt-1">Gérez les accès et les rôles du personnel ({filteredUsers.length} affichés).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Phase 2: Export Buttons */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportCSV} 
            disabled={filteredUsers.length === 0 || loading}
            className="bg-white shadow-sm border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-700 h-10"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-amber-600" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportPDF} 
            disabled={filteredUsers.length === 0 || loading}
            className="bg-white shadow-sm border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-700 h-10 mr-2"
          >
            <FileText className="w-4 h-4 mr-2 text-red-500" />
            <span className="hidden sm:inline">PDF</span>
          </Button>

          <Button onClick={() => setShowAddModal(true)} className="gap-2 h-10 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Ajouter Utilisateur</span>
          </Button>
        </div>
      </div>

      {/* Phase 2: Statistics */}
      <UserStatisticsPanel users={filteredUsers} />

      {/* Phase 2: Advanced Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Rechercher par nom ou email..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-9 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <UserFiltersPanel 
          filters={advancedFilters}
          onFilterChange={setAdvancedFilters}
          onReset={handleResetFilters}
        />
      </div>

      {/* Data Table */}
      <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Nom</TableHead>
                  <TableHead className="font-semibold text-slate-700">Rôle</TableHead>
                  <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                  <TableHead className="font-semibold text-slate-700">Création</TableHead>
                  <TableHead className="font-semibold text-slate-700">Dernière Connexion</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32 mb-1" /><Skeleton className="h-3 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <UsersIcon className="w-8 h-8 mb-2 text-slate-300" />
                        <p className="font-medium text-slate-900">Aucun utilisateur trouvé</p>
                        <p className="text-sm">Ajustez vos filtres de recherche.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const self = isSelf(user);
                    const targetIsAdmin = isAdmin(user);
                    const canEditRole = !self && !targetIsAdmin;
                    
                    return (
                      <TableRow key={user.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </TableCell>
                        <TableCell>
                           <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize flex w-fit items-center gap-1 shadow-sm">
                             {user.role === 'admin' && <ShieldAlert className="h-3 w-3" />}
                             {user.role === 'manager' && <ShieldCheck className="h-3 w-3" />}
                             {user.role}
                           </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className={user.status === 'active' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : ''}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {user.last_login ? format(new Date(user.last_login), 'dd MMM, HH:mm') : 'Jamais'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 items-center">
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0}>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                      onClick={() => { setSelectedUser(user); setShowRoleModal(true); }}
                                      disabled={!canEditRole}
                                    >
                                      <UserCog className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {self ? "Vous ne pouvez pas modifier votre propre rôle" : 
                                   targetIsAdmin ? "Vous ne pouvez pas modifier le rôle d'un admin" : 
                                   "Changer le rôle"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => { setSelectedUser(user); setShowEditModal(true); }} title="Modifier"><Edit className="h-4 w-4" /></Button>
                            {canDelete && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50" 
                                onClick={() => handleDeleteClick(user)}
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <AddAdminUserModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchUsers} />
      <EditAdminUserModal open={showEditModal} onClose={() => setShowEditModal(false)} user={selectedUser} onSuccess={fetchUsers} />
      <EditAdminUserRoleModal open={showRoleModal} onClose={() => setShowRoleModal(false)} user={selectedUser} onSuccess={fetchUsers} />
      
      {canDelete && (
        <ConfirmationDeleteModal 
          open={showDeleteModal} 
          onClose={() => setShowDeleteModal(false)} 
          item={selectedUser} 
          type="admin_user" 
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
};