import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/PaginationControls';
import { DependencyDetailModal } from '@/components/DependencyDetailModal';
import { Search, Network, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const AdminDependenciesPage = () => {
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const TABLES_TO_SCAN = ['menu_categories', 'menu_items', 'customers', 'tables'];

  const fetchDependencies = async () => {
    setLoading(true);
    let results = [];
    
    try {
      for (const table of TABLES_TO_SCAN) {
        const { data: records } = await supabase
          .from(table)
          .select('id, created_at')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (records) {
          for (const rec of records) {
            const { data: deps } = await supabase.rpc('get_dependencies', {
              p_table_name: table,
              p_record_id: rec.id
            });
            
            if (deps && deps.length > 0) {
              const totalCount = deps.reduce((sum, d) => sum + d.count, 0);
              results.push({
                id: rec.id,
                table_name: table,
                created_at: rec.created_at,
                dependencies: deps,
                total_count: totalCount,
                tables: deps.map(d => d.table).join(', ')
              });
            }
          }
        }
      }
      
      setData(results.sort((a, b) => b.total_count - a.total_count));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleCascadeDelete = async (record) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: result, error } = await supabase.rpc('delete_with_cascade', {
        p_table_name: record.table_name,
        p_record_id: record.id,
        p_user_id: user?.id,
        p_cascade: true
      });

      if (error) throw error;
      if (!result?.success) throw new Error(result?.message);

      toast({ 
        title: 'Cascade Réussie', 
        description: `${result.deleted_count} enregistrements supprimés au total.`,
        className: 'bg-green-600 text-white' 
      });
      fetchDependencies();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    }
  };

  const filteredData = data.filter(d => 
    d.table_name.includes(search.toLowerCase()) || d.id.includes(search)
  );

  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredData.length / limit);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Network className="h-6 w-6 text-primary" /> Gestion des Dépendances
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Identifiez et gérez les enregistrements liés avant suppression.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-9 w-[250px]" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchDependencies} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <Card className="border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Table Source</TableHead>
                <TableHead>ID Enregistrement</TableHead>
                <TableHead>Nb. Dépendances</TableHead>
                <TableHead>Tables Liées</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">Aucune dépendance active détectée dans l'échantillon.</TableCell></TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell><Badge variant="outline" className="capitalize">{row.table_name}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.id}</TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                        {row.total_count} actifs
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{row.tables}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedRecord(row); setDetailOpen(true); }}>
                        Voir Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {filteredData.length > 0 && (
            <div className="border-t p-4">
              <PaginationControls 
                currentPage={page} totalPages={totalPages} totalCount={filteredData.length} 
                itemsPerPage={limit} onPageChange={setPage} onItemsPerPageChange={setLimit} loading={loading} 
              />
            </div>
          )}
        </Card>

        <DependencyDetailModal 
          open={detailOpen} 
          onClose={() => setDetailOpen(false)} 
          record={selectedRecord} 
          onCascadeDelete={handleCascadeDelete}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminDependenciesPage;