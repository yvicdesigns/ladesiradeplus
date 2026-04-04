import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from './OrderStatusBadge';
import { useCancelOrder } from '../hooks/useCancelOrder';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapPin, Phone, User, Package, Ban, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OrderDetail = ({ order, loading }) => {
  const navigate = useNavigate();
  const { cancelOrder, loading: cancelling } = useCancelOrder();

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!order) return <div className="p-8 text-center text-red-500">Commande introuvable.</div>;

  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 -ml-4 mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Commande #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Passée le {format(new Date(order.created_at), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} size="lg" />
          {canCancel && (
            <Button variant="destructive" size="sm" onClick={() => cancelOrder(order)} disabled={cancelling}>
              {cancelling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />} Annuler
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50 border-b pb-4"><CardTitle className="text-sm font-bold uppercase text-gray-600 flex items-center gap-2"><User className="w-4 h-4"/> Client & Livraison</CardTitle></CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{order.customer_name}</p>
                {order.customer_email && <p className="text-sm text-gray-500">{order.customer_email}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="text-gray-900">{order.customer_phone}</p>
            </div>
            {order.type === 'delivery' && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <p className="text-gray-900">{order.delivery_address || 'Aucune adresse fournie'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-gray-50 border-b pb-4"><CardTitle className="text-sm font-bold uppercase text-gray-600 flex items-center gap-2"><Package className="w-4 h-4"/> Récapitulatif ({order.order_items?.length || 0} articles)</CardTitle></CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div className="flex gap-2">
                    <span className="font-bold text-gray-900">{item.quantity}x</span>
                    <span className="text-gray-700">{item.menu_items?.name || 'Article inconnu'}</span>
                  </div>
                  <span className="font-medium text-gray-900 whitespace-nowrap">{Number(item.price * item.quantity).toFixed(2)} FCFA</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold text-gray-900">
              <span>Total</span>
              <span className="text-primary">{Number(order.total).toFixed(2)} FCFA</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};