import React from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ShoppingBag, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OrderConfirmationModal = ({ open, onClose, order }) => {
  const navigate = useNavigate();

  if (!order) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleViewOrder = () => {
    onClose();
    // Navigate to the order details in admin section (assuming OrdersPage handles it or AdminOrdersPage)
    navigate('/admin/orders');
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-white">
        <div className="flex flex-col items-center justify-center pt-6 pb-2 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <CheckCircle2 className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Commande Réussie !</DialogTitle>
          <p className="text-gray-500">
            La commande a été enregistrée pour <strong>{order.customer_name}</strong>.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 my-4 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> N° Commande
            </span>
            <span className="font-mono text-sm font-bold text-slate-800 break-all ml-4 text-right">
              {order.id?.split('-')[0].toUpperCase() || 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              Type
            </span>
            <Badge variant="outline" className="bg-white capitalize">
              {order.type === 'delivery' ? 'Livraison' : order.type === 'takeaway' ? 'À emporter' : 'Sur place'}
            </Badge>
          </div>

          {order.type === 'delivery' && order.delivery_address && (
            <div className="flex justify-between items-start pb-3 border-b border-slate-200">
              <span className="text-slate-500 font-medium flex items-center gap-2 shrink-0">
                <MapPin className="w-4 h-4" /> Adresse
              </span>
              <span className="text-sm text-right font-medium text-slate-800 ml-4">
                {order.delivery_address}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date
            </span>
            <span className="text-sm font-medium text-slate-800">
              {formatDate(order.created_at || new Date().toISOString())}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-700 font-bold text-lg">Total TTC</span>
            <span className="text-amber-600 font-bold text-xl">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-1/2">
            Retour aux Clients
          </Button>
          <Button onClick={handleViewOrder} className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <ExternalLink className="w-4 h-4" /> Voir la Commande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};