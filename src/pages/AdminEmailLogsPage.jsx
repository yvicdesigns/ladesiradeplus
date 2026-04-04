import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/PaginationControls';
import SearchBar from '@/components/SearchBar';
import { supabase } from '@/lib/customSupabaseClient';
import { formatDateTime } from '@/lib/formatters';
import { RefreshCw, Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { emailService } from '@/lib/emailService';

export const AdminEmailLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase.from('email_logs').select('*', { count: 'exact' });
      
      if (searchQuery) {
        query = query.or(`recipient_email.ilike.%${searchQuery}%,email_type.ilike.%${searchQuery}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les logs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, searchQuery]);

  const handleResend = async (log) => {
    toast({ title: "Renvoi en cours...", description: `Tentative de renvoi pour ${log.recipient_email}` });
    const result = await emailService.resendEmail(log);
    
    if (result.success) {
      toast({ title: "Succès", description: "Email renvoyé avec succès" });
      fetchLogs(); // Refresh status
    } else {
      toast({ variant: "destructive", title: "Erreur", description: result.error || "Échec du renvoi" });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200"><CheckCircle className="w-3 h-3 mr-1"/> Envoyé</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200"><AlertTriangle className="w-3 h-3 mr-1"/> Échec</Badge>;
      default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" /> Logs Emails
            </h1>
            <p className="text-muted-foreground">Historique des emails transactionnels</p>
          </div>
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="Rechercher (email, type)..." 
            resultCount={totalCount}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={5} className="text-center py-8">Chargement...</TableCell></TableRow>
              ) : logs.length === 0 ? (
                 <TableRow><TableCell colSpan={5} className="text-center py-8">Aucun log trouvé</TableCell></TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.created_at)}</TableCell>
                    <TableCell><Badge variant="outline">{log.email_type}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.recipient_email}</span>
                        <span className="text-xs text-muted-foreground">{log.recipient_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col gap-1">
                         {getStatusBadge(log.status)}
                         {log.status === 'failed' && <span className="text-xs text-red-500 max-w-[200px] truncate">{log.error_message}</span>}
                       </div>
                    </TableCell>
                    <TableCell>
                      {log.status === 'failed' && (
                        <Button size="sm" variant="outline" onClick={() => handleResend(log)}>
                          <RefreshCw className="h-3 w-3 mr-2" /> Renvoyer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="border-t p-4">
             <PaginationControls
                currentPage={page}
                totalPages={Math.ceil(totalCount / limit)}
                totalCount={totalCount}
                itemsPerPage={limit}
                onPageChange={setPage}
                onItemsPerPageChange={setLimit}
             />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailLogsPage;