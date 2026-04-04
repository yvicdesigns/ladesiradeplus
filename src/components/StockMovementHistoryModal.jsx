import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStockManagement } from '@/hooks/useStockManagement';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const StockMovementHistoryModal = ({ open, onClose, menuItemId = null }) => {
  const [movements, setMovements] = useState([]);
  const { getStockMovements, loading } = useStockManagement();

  useEffect(() => {
    if (open) {
      loadMovements();
    }
  }, [open, menuItemId]);

  const loadMovements = async () => {
    const data = await getStockMovements(menuItemId ? { menu_item_id: menuItemId } : { limit: 100 });
    setMovements(data);
  };

  const getMovementColor = (type) => {
    switch(type) {
      case 'order_confirmed': return 'bg-blue-100 text-blue-800';
      case 'order_cancelled': return 'bg-amber-100 text-amber-800';
      case 'manual_adjustment': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementLabel = (type) => {
    switch(type) {
      case 'order_confirmed': return 'Commande (-)';
      case 'order_cancelled': return 'Annulation (+)';
      case 'manual_adjustment': return 'Manuel';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historique des Mouvements de Stock</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-gray-400" /></div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-500">Date</th>
                    {!menuItemId && <th className="text-left p-3 font-medium text-gray-500">Produit</th>}
                    <th className="text-left p-3 font-medium text-gray-500">Type</th>
                    <th className="text-center p-3 font-medium text-gray-500">Changement</th>
                    <th className="text-center p-3 font-medium text-gray-500">Stock</th>
                    <th className="text-left p-3 font-medium text-gray-500">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">Aucun mouvement trouvé.</td>
                    </tr>
                  )}
                  {movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-600">
                        {format(new Date(mov.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </td>
                      {!menuItemId && (
                        <td className="p-3 font-medium">{mov.menu_items?.name}</td>
                      )}
                      <td className="p-3">
                        <Badge variant="outline" className={`border-none ${getMovementColor(mov.movement_type)}`}>
                          {getMovementLabel(mov.movement_type)}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-bold ${mov.quantity_changed > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                          {mov.quantity_changed > 0 ? '+' : ''}{mov.quantity_changed}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <span>{mov.previous_quantity}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="font-bold text-gray-900">{mov.new_quantity}</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-500 text-xs max-w-[200px] truncate" title={mov.notes}>
                        {mov.notes}
                        {mov.order_id && <span className="block text-[10px] text-gray-400">Order: {mov.order_id.split('-')[0]}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};