import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/lib/formatters';
import { supabase } from '@/lib/customSupabaseClient';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { History, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export const AdminCustomerAuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    if (!restaurantId) return;
    
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'customers')
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [restaurantId]);

  const filteredLogs = logs.filter(log => 
    (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.reason || '').toLowerCase().includes(search.toLowerCase())
  );

  const getActionBadge = (action) => {
    switch (action?.toUpperCase()) {
      case 'INSERT': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">CRÉATION</Badge>;
      case 'UPDATE': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">MISE À JOUR</Badge>;
      case 'DELETE': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">SUPPRESSION</Badge>;
      case 'RESTORE': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">RESTAURATION</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-6">
      <CardHeader className="bg-slate-50 border-b border-slate-100 p-4 md:p-6 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <History className="w-5 h-5 text-indigo-600" /> Historique des Opérations (Clients)
             </CardTitle>
             <CardDescription>Traçabilité des fusions, suppressions et mises à jour.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Rechercher une action..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Raison / Détail</TableHead>
                <TableHead>Utilisateur (Admin)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Aucun historique trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map(log => (
                  <TableRow key={log.id} className="hover:bg-slate-50">
                    <TableCell className="text-sm font-medium text-slate-700">
                      {formatDateTime(log.created_at, true)}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="text-sm text-slate-600 max-w-[300px] truncate" title={log.reason || 'N/A'}>
                      {log.reason || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {log.user_id || 'Système'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};