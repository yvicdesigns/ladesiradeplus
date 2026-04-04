import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/formatters';
import { PaginationControls } from '@/components/PaginationControls';
import { FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminActivityLogsPage() {
  const { logs, totalCount, loading, page, limit, setPage, setLimit, filters, setFilters } = useActivityLogs();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <FileText className="h-6 w-6" />
              </div>
              Journal d'Activités (Audit Complet)
            </h1>
            <p className="text-muted-foreground mt-1">
              Historique détaillé de toutes les actions effectuées sur la base de données.
            </p>
          </div>
          <div className="flex items-center gap-3 relative w-full md:w-auto">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Rechercher un ID..." 
                className="pl-9 w-full md:w-[250px]"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
             />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="p-4">Date & Heure</th>
                    <th className="p-4">Utilisateur</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Table Affectée</th>
                    <th className="p-4">Données (old_data) / Raison</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-muted-foreground">Chargement des logs...</td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-muted-foreground">Aucun résultat trouvé.</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-sm whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                        <td className="p-4 text-sm font-medium">{log.user_email || log.user_id}</td>
                        <td className="p-4">
                          <Badge variant={log.action === 'DELETE' ? 'destructive' : log.action === 'RESTORE' ? 'default' : 'outline'}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm font-mono">{log.table_name}</td>
                        <td className="p-4 text-xs">
                          <div className="max-w-md truncate text-muted-foreground" title={JSON.stringify(log.old_data)}>
                            {log.old_data ? <span className="text-blue-600 font-mono">JSON Data</span> : <span className="italic">{log.reason || 'N/A'}</span>}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {totalCount > 0 && (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <PaginationControls 
              currentPage={page} 
              totalPages={Math.ceil(totalCount / limit)} 
              totalCount={totalCount}
              itemsPerPage={limit}
              onPageChange={setPage} 
              onItemsPerPageChange={setLimit} 
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}