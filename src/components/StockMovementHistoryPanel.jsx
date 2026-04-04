import React, { useState, useEffect } from 'react';
import { useStockMovements } from '@/hooks/useStockMovements';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { formatTime } from '@/lib/formatters';
import { Loader2, ArrowRight, Calendar as CalendarIcon, History, AlertCircle, RefreshCw } from 'lucide-react';
import { PaginationControls } from '@/components/PaginationControls';

export const StockMovementHistoryPanel = ({ menuItemId = null }) => {
  const [page, setPage] = useState(1);
  const [movementType, setMovementType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { movements, loading, error, totalCount, fetchMovements } = useStockMovements();
  const limit = 10;

  const loadData = () => {
    fetchMovements({ 
      page, 
      limit, 
      menuItemId, 
      movementType,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(new Date(endDate).setHours(23, 59, 59)).toISOString() : null
    });
  };

  useEffect(() => {
    loadData();
  }, [page, limit, menuItemId, movementType, startDate, endDate, fetchMovements]);

  const getMovementBadge = (type) => {
    switch(type) {
      case 'order_confirmed': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Commande Validée (-)</Badge>;
      case 'order_cancelled': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Commande Annulée (+)</Badge>;
      case 'manual_adjustment': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Ajustement Manuel</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <History className="h-5 w-5 text-gray-500" />
          Historique des Mouvements {totalCount > 0 && <span className="text-sm font-normal text-gray-500">({totalCount})</span>}
        </h3>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white border rounded-md px-2 py-1 shadow-sm">
             <CalendarIcon className="h-4 w-4 text-gray-400" />
             <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="border-0 h-8 w-auto p-0 text-sm focus-visible:ring-0" 
             />
             <span className="text-gray-300">-</span>
             <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="border-0 h-8 w-auto p-0 text-sm focus-visible:ring-0" 
             />
          </div>

          <Select value={movementType} onValueChange={(v) => { setMovementType(v); setPage(1); }}>
            <SelectTrigger className="w-[200px] bg-white h-10">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mouvements</SelectItem>
              <SelectItem value="order_confirmed">Commandes validées</SelectItem>
              <SelectItem value="order_cancelled">Commandes annulées</SelectItem>
              <SelectItem value="manual_adjustment">Ajustements manuels</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="w-40 font-semibold">Date & Heure</TableHead>
                {!menuItemId && <TableHead className="font-semibold">Plat (Menu Item)</TableHead>}
                <TableHead className="font-semibold">Type de Mouvement</TableHead>
                <TableHead className="text-center w-28 font-semibold">Quantité</TableHead>
                <TableHead className="text-center w-36 font-semibold">Ancien → Nouveau</TableHead>
                <TableHead className="w-1/4 font-semibold">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={menuItemId ? 5 : 6} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span className="text-sm text-gray-500">Chargement de l'historique...</span>
                  </TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={menuItemId ? 5 : 6} className="h-32 text-center text-gray-500">
                    Aucun mouvement de stock trouvé pour cette période.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((mov) => (
                  <TableRow key={mov.id} className="hover:bg-gray-50">
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {formatTime(mov.created_at)}
                    </TableCell>
                    {!menuItemId && (
                      <TableCell className="font-medium text-gray-900">
                        {mov.menu_items?.name || 'Plat supprimé'}
                      </TableCell>
                    )}
                    <TableCell>
                      {getMovementBadge(mov.movement_type)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg ${mov.quantity_changed > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {mov.quantity_changed > 0 ? '+' : ''}{mov.quantity_changed}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="text-gray-500">{mov.previous_quantity}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="font-bold text-gray-900">{mov.new_quantity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm text-gray-600">
                         <span className="line-clamp-2">{mov.notes || '-'}</span>
                         {mov.order_id && (
                           <span className="text-[10px] text-gray-400 mt-1 font-mono bg-gray-100 self-start px-2 py-0.5 rounded border">
                             ID Commande: {mov.order_id.split('-')[0]}
                           </span>
                         )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!error && totalCount > limit && (
        <div className="pt-2">
          <PaginationControls 
            currentPage={page} 
            totalPages={Math.ceil(totalCount / limit)} 
            onPageChange={setPage} 
          />
        </div>
      )}
    </div>
  );
};