import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { formatDateTime } from '@/lib/formatters';
import { useToast } from '@/components/ui/use-toast';

export const AuditLogsExportButton = ({ filters }) => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });

      if (filters.action && filters.action !== 'all') {
        query = query.eq('action', filters.action.toUpperCase());
      }
      if (filters.tableName && filters.tableName !== 'all') {
        query = query.eq('table_name', filters.tableName);
      }
      if (filters.userId && filters.userId !== 'all') {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setDate(toDate.getDate() + 1);
        query = query.lt('created_at', toDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch emails
      let enrichedData = data || [];
      const userIds = [...new Set(enrichedData.map(l => l.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, email').in('user_id', userIds);
        if (profiles) {
          enrichedData = enrichedData.map(log => {
            const profile = profiles.find(p => p.user_id === log.user_id);
            return { ...log, user_email: profile?.email || 'System / Unknown' };
          });
        }
      }

      // Generate CSV
      const headers = ['Date', 'User', 'Action', 'Table', 'Record ID', 'Reason', 'User Agent', 'IP Address'];
      const csvRows = [headers.join(',')];

      enrichedData.forEach(log => {
        const row = [
          `"${formatDateTime(log.created_at)}"`,
          `"${log.user_email || log.user_id || ''}"`,
          `"${log.action || ''}"`,
          `"${log.table_name || ''}"`,
          `"${log.record_id || ''}"`,
          `"${(log.reason || '').replace(/"/g, '""')}"`,
          `"${(log.user_agent || '').replace(/"/g, '""')}"`,
          `"${log.ip_address || ''}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Export réussi", description: "Le fichier CSV a été téléchargé." });
    } catch (err) {
      console.error('Export error:', err);
      toast({ variant: "destructive", title: "Erreur d'export", description: err.message });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2 bg-white">
      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Exporter CSV
    </Button>
  );
};