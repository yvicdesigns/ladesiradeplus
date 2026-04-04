import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SortableHeader from '@/components/SortableHeader';
import { 
  formatCurrency, 
  formatTime, 
  formatDeliveryStatusFR, 
  getDeliveryStatusColor, 
  formatPaymentMethod, 
  getPaymentMethodColor, 
  getPaymentStatusColor 
} from '@/lib/formatters';
import { Eye, Trash2, ArchiveRestore, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNextStatus, getActionLabel } from '@/lib/deliveryConstants';
import { formatOrderIdForDisplay } from '@/lib/orderIdVerification';
import { OrderIdSyncService } from '@/lib/OrderIdSyncService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const StatusActionButton = ({ order, onUpdateStatus, displayId, isUpdating }) => {
  const effectiveStatus = order?.status;
  if (!effectiveStatus) return <span className="text-xs text-gray-400 italic">-</span>;

  const nextStatus = getNextStatus(effectiveStatus);

  if (!nextStatus || !onUpdateStatus) {
    return <span className="text-xs text-gray-400 italic">-</span>;
  }

  const handleUpdate = async (e) => {
    e.stopPropagation(); 
    if (!isUpdating) {
      await onUpdateStatus(displayId, nextStatus);
    }
  };

  return (
    <Button 
      size="sm" 
      variant="secondary" 
      className="h-7 text-[10px] sm:text-xs px-3 whitespace-nowrap bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleUpdate}
      disabled={isUpdating}
    >
      {isUpdating && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
      {getActionLabel(nextStatus)}
    </Button>
  );
};

export const AdminDeliveryOrdersTable = ({ 
  orders = [], 
  loading = false, 
  error = null,
  selectedIds = [], 
  toggleSelection = () => {}, 
  toggleSelectAll = () => {}, 
  sort = { column: 'created_at', order: 'desc' }, 
  setSort = () => {}, 
  onViewDetails = () => {}, 
  onDelete = () => {}, 
  onRestore = () => {},
  onUpdateStatus = () => {},
  showDeleted = false,
  updatingOrderIds = new Set()
}) => {
  
  if (!Array.isArray(orders) || orders.length === 0) return null; 

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden relative">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-[40px] pl-4">
                <Checkbox 
                  checked={orders.length > 0 && selectedIds.length === orders.length} 
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>
                <SortableHeader 
                  label="ID Commande" 
                  columnName="id" 
                  currentSort={sort?.column} 
                  currentOrder={sort?.order} 
                  onSort={(c,o) => setSort({column: c, order: o})} 
                />
              </TableHead>
              <TableHead>
                <SortableHeader 
                  label="Client & Adresse" 
                  columnName="customer_name" 
                  currentSort={sort?.column} 
                  currentOrder={sort?.order} 
                  onSort={(c,o) => setSort({column: c, order: o})} 
                />
              </TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>
                <SortableHeader 
                  label="Statut" 
                  columnName="status" 
                  currentSort={sort?.column} 
                  currentOrder={sort?.order} 
                  onSort={(c,o) => setSort({column: c, order: o})} 
                />
              </TableHead>
              <TableHead>Action Rapide</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>
                <SortableHeader 
                  label="Total" 
                  columnName="total" 
                  currentSort={sort?.column} 
                  currentOrder={sort?.order} 
                  onSort={(c,o) => setSort({column: c, order: o})} 
                />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {orders.map((order) => {
                if (!order) return null;
                
                const displayId = OrderIdSyncService.getOrderIdForDisplay(order);
                const rawId = order.id;
                
                const isSelected = selectedIds.includes(displayId) || selectedIds.includes(rawId);
                const isUpdating = updatingOrderIds.has(displayId) || updatingOrderIds.has(rawId);
                
                const deliveryData = Array.isArray(order?.delivery_orders) ? (order.delivery_orders[0] || {}) : order;
                const safeStatus = order?.status || 'pending';
                const itemsCount = Array.isArray(order?.order_items) ? order.order_items.length : 0;
                const paymentStatus = deliveryData?.payment_status || 'pending';
                
                // robust check for total amount across possible nested structures
                const rawTotal = order?.total ?? order?.orders?.total ?? deliveryData?.total;
                const displayTotal = rawTotal || 0;
                const isZeroOrNull = rawTotal === null || rawTotal === undefined || rawTotal === 0;

                return (
                  <motion.tr 
                    key={displayId} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0, height: 0 }}
                    className={`border-b transition-all group ${isSelected ? 'bg-blue-50/50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'} ${isUpdating ? 'bg-gray-50/70 opacity-60 grayscale-[30%] pointer-events-none' : 'hover:bg-gray-50'}`}
                  >
                    <TableCell className="pl-4">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(displayId)} disabled={isUpdating}/>
                    </TableCell>
                    
                    <TableCell className="font-mono font-medium text-xs text-gray-500 relative">
                      {isUpdating && <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-full bg-blue-400 animate-pulse rounded-r-md"></div>}
                      <div 
                        className="cursor-pointer hover:text-indigo-600 hover:underline inline-flex items-center gap-1" 
                        onClick={() => !isUpdating && onViewDetails({...order, displayId})}
                        title={`Main ID: ${displayId}\nRecord ID: ${rawId}`}
                      >
                        #{formatOrderIdForDisplay(displayId)}
                        {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                      </div>
                      {order?.is_deleted && <Badge variant="destructive" className="mt-1 text-[9px] px-1 py-0 h-4 uppercase">Supprimée</Badge>}
                    </TableCell>
                    
                    <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm text-gray-900">{order?.customer_name || 'Anonyme'}</span>
                          <span className="text-xs text-gray-500 flex items-center">
                            {formatTime(order?.created_at)}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center truncate max-w-[200px]" title={order?.delivery_address || deliveryData.delivery_address}>
                            <MapPin className="w-3 h-3 mr-1 inline shrink-0" /> {order?.delivery_address || deliveryData.delivery_address || 'Adresse non spécifiée'}
                          </span>
                        </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {itemsCount} items
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={`${getDeliveryStatusColor(safeStatus)} border px-2 py-0.5 whitespace-nowrap transition-colors duration-500`}>
                        {formatDeliveryStatusFR(safeStatus)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <StatusActionButton order={order} onUpdateStatus={onUpdateStatus} displayId={displayId} isUpdating={isUpdating} />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start text-[10px]">
                        <Badge variant="outline" className={`${getPaymentMethodColor(deliveryData?.payment_method)}`}>
                          {formatPaymentMethod(deliveryData?.payment_method || 'non_spécifié')}
                        </Badge>
                        <span className={`font-semibold uppercase tracking-tighter ${getPaymentStatusColor(paymentStatus)}`}>
                          {paymentStatus === 'paid' || paymentStatus === 'confirmed' ? 'Payé' : 'Non payé'}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="font-bold font-mono text-gray-900">
                      <div className="flex items-center gap-1.5">
                        {formatCurrency(displayTotal)}
                        {isZeroOrNull && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="w-4 h-4 text-amber-500 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="bg-amber-50 border-amber-200 text-amber-900">
                                <p className="font-medium">Montant non détecté</p>
                                <p className="text-xs opacity-80">La base de données n'a pas enregistré le total pour cette commande.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className={`flex justify-end gap-1 transition-opacity ${isUpdating ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-gray-200" 
                            onClick={() => onViewDetails({...order, displayId})}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                          
                          {showDeleted ? (
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-8 w-8 hover:text-amber-600 hover:bg-amber-50" 
                               onClick={() => onRestore({...order, id: displayId})} 
                               title="Restaurer"
                             >
                               <ArchiveRestore className="h-4 w-4 text-amber-500" />
                             </Button>
                          ) : (
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-8 w-8 hover:text-red-600 hover:bg-red-50" 
                               onClick={() => onDelete({...order, id: displayId})} 
                               title="Supprimer"
                             >
                               <Trash2 className="h-4 w-4 text-red-500" />
                             </Button>
                          )}
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};