import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDateTime } from '@/lib/formatters';
import { Eye, RotateCcw, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export const AuditLogsTable = ({ logs, loading, onViewDetails, onRestore }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadge = (action) => {
    const act = action?.toUpperCase();
    if (act === 'DELETE') return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">SUPPRESSION</Badge>;
    if (act === 'RESTORE') return <Badge variant="default" className="bg-amber-100 text-amber-800 border-amber-200">RESTAURATION</Badge>;
    if (act === 'UPDATE') return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">MODIFICATION</Badge>;
    if (act === 'SYSTEM_RESET') return <Badge className="bg-purple-100 text-purple-800 border-purple-200">RÉINITIALISATION</Badge>;
    return <Badge>{act || 'INCONNU'}</Badge>;
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[160px]">Date / Heure</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>ID Enregistrement</TableHead>
              <TableHead className="max-w-[200px]">Raison</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(10).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  Aucun log d'audit trouvé pour ces critères.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm text-foreground">{log.user_email || 'Système'}</div>
                  </TableCell>
                  <TableCell>
                    {getActionBadge(log.action)}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-sm">{log.table_name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {log.record_id ? (
                        <>
                          <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {log.record_id.slice(0, 8)}...
                          </span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => handleCopy(e, log.record_id)}>
                            {copiedId === log.record_id ? <CheckCircle2 className="h-3 w-3 text-amber-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">N/A</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate text-sm text-muted-foreground cursor-help">
                            {log.reason || <span className="opacity-50 italic">Aucune</span>}
                          </div>
                        </TooltipTrigger>
                        {log.reason && (
                          <TooltipContent className="max-w-[300px] break-words">
                            <p>{log.reason}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onViewDetails(log)} title="Voir les détails (old_data)">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {log.action?.toUpperCase() === 'DELETE' && log.record_id && (
                        <Button variant="ghost" size="sm" onClick={() => onRestore(log)} title="Restaurer l'enregistrement" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};