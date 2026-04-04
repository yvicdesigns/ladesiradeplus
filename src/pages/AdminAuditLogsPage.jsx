import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { AuditLogsTable } from '@/components/AuditLogsTable';
import { AuditLogDetailModal } from '@/components/AuditLogDetailModal';
import { RestoreConfirmationModal } from '@/components/RestoreConfirmationModal';
import { AuditLogsExportButton } from '@/components/AuditLogsExportButton';
import { PaginationControls } from '@/components/PaginationControls';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, AlertCircle, RefreshCw, Trash2, RotateCcw, Table2, User } from 'lucide-react';

export const AdminAuditLogsPage = () => {
  const [filters, setFilters] = useState({
    action: 'all',
    tableName: 'all',
    dateFrom: '',
    dateTo: '',
    userId: 'all'
  });
  
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  
  const { logs, stats, loading, error, totalCount, currentPage, totalPages, refetch } = useAuditLogs(filters, pagination);

  const [selectedLog, setSelectedLog] = useState(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handlePageChange = (newPage) => setPagination(prev => ({ ...prev, page: newPage }));
  const handleLimitChange = (newLimit) => setPagination({ page: 1, limit: newLimit });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({ action: 'all', tableName: 'all', dateFrom: '', dateTo: '', userId: 'all' });
    setPagination({ page: 1, limit: 20 });
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const handleRestoreRequest = (log) => {
    setSelectedLog(log);
    setDetailModalOpen(false);
    setRestoreModalOpen(true);
  };

  const handleRestoreSuccess = () => {
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <FileText className="h-6 w-6" />
              </div>
              Audit Logs & Restaurations
            </h1>
            <p className="text-muted-foreground mt-1">Traçabilité complète des actions système et restauration des données supprimées (old_data).</p>
          </div>
          <div className="flex items-center gap-3">
            <AuditLogsExportButton filters={filters} />
            <Button variant="outline" size="icon" onClick={refetch} disabled={loading} title="Actualiser">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Suppressions</p>
                <h3 className="text-xl font-bold">{stats?.totalDeletions || 0}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Restaurations</p>
                <h3 className="text-xl font-bold">{stats?.totalRestorations || 0}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                <User className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-muted-foreground">Acteur Principal</p>
                <h3 className="text-md font-bold truncate" title={stats?.topUser}>{stats?.topUser || 'N/A'}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                <Table2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Table Plus Affectée</p>
                <h3 className="text-xl font-bold capitalize">{stats?.topTable || 'N/A'}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardContent className="p-4 flex flex-col lg:flex-row gap-4 items-end lg:items-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Action</label>
                <Select value={filters.action} onValueChange={(val) => handleFilterChange('action', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes Actions</SelectItem>
                    <SelectItem value="DELETE">Suppression (DELETE)</SelectItem>
                    <SelectItem value="RESTORE">Restauration (RESTORE)</SelectItem>
                    <SelectItem value="UPDATE">Modification (UPDATE)</SelectItem>
                    <SelectItem value="SYSTEM_RESET">Réinitialisation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Table</label>
                <Select value={filters.tableName} onValueChange={(val) => handleFilterChange('tableName', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes Tables</SelectItem>
                    <SelectItem value="orders">orders</SelectItem>
                    <SelectItem value="delivery_orders">delivery_orders</SelectItem>
                    <SelectItem value="restaurant_orders">restaurant_orders</SelectItem>
                    <SelectItem value="reservations">reservations</SelectItem>
                    <SelectItem value="customers">customers</SelectItem>
                    <SelectItem value="menu_items">menu_items</SelectItem>
                    <SelectItem value="multiple">multiple (Global)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Du</label>
                <Input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Au</label>
                <Input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} />
              </div>
            </div>
            <Button variant="ghost" onClick={resetFilters} className="shrink-0">
              Réinitialiser
            </Button>
          </CardContent>
        </Card>

        <AuditLogsTable 
          logs={logs} 
          loading={loading} 
          onViewDetails={handleViewDetails} 
          onRestore={handleRestoreRequest} 
        />

        {logs.length > 0 && (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <PaginationControls 
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleLimitChange}
              loading={loading}
            />
          </div>
        )}

        <AuditLogDetailModal 
          open={detailModalOpen} 
          onClose={() => setDetailModalOpen(false)} 
          log={selectedLog} 
          onRestoreRequest={handleRestoreRequest} 
        />

        <RestoreConfirmationModal 
          open={restoreModalOpen} 
          onClose={() => setRestoreModalOpen(false)} 
          log={selectedLog} 
          onSuccess={handleRestoreSuccess} 
        />
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLogsPage;