import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { Utensils, AlertCircle, ShoppingBag, Store, ArrowLeft, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OrderTrackingTimeline } from '@/components/OrderTrackingTimeline';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useTableSelection } from '@/hooks/useTableSelection';
import { formatCurrency } from '@/lib/formatters';

export const RestaurantOrderTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const { order, loading, error } = useOrderTracking(id);
  const { getTableNumber } = useTableSelection();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#D97706] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6 space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold">{t('tracking.not_found')}</h2>
            <p className="text-gray-500">
              {error || "La commande que vous recherchez n'existe pas."}
            </p>
            <Button onClick={() => navigate('/menu')} className="w-full">
              {t('common.back_to_menu')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCounter = order.order_method === 'counter';
  const tableNumber = order.table_id || order.orders?.table_id ? getTableNumber(order.table_id || order.orders?.table_id) || order.table_number || '...' : 'N/A';

  const getStatusMessage = (status) => {
      switch(status) {
          case 'pending':
          case 'confirmed':
              return "Votre commande a été reçue et est en attente de préparation.";
          case 'preparing':
              return "La cuisine prépare actuellement votre commande avec soin !";
          case 'ready':
          case 'served':
          case 'delivered':
              return `Votre commande est prête ! ${isCounter ? "Veuillez vous présenter au comptoir pour la retirer." : "Elle vous sera servie à votre table d'ici quelques instants."}`;
          case 'cancelled':
          case 'rejected':
              return "Votre commande a été annulée.";
          default:
              return "Votre commande est en cours de traitement.";
      }
  };

  return (
    <>
      <Helmet>
        <title>Suivi de commande {isCounter ? 'au comptoir' : 'sur place'} - La Desirade Plus</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b sticky top-0 z-10 px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="-ml-2">
            <ArrowLeft className="w-5 h-5"/>
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCounter ? 'bg-purple-100' : 'bg-amber-100'}`}>
              {isCounter ? <Store className="w-5 h-5 text-purple-600" /> : <Utensils className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">
                {isCounter ? 'Commande au Comptoir' : 'Commande sur place'}
              </h1>
              <p className="text-sm text-gray-500 font-mono">
                #{order.id?.slice(0, 8)} • {isCounter ? 'Retrait' : `Table ${tableNumber}`}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-4 space-y-6 mt-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-gray-100 space-y-2">
              <h2 className="text-xl font-bold text-gray-900">État de votre commande</h2>
              <p className="text-gray-600 text-sm max-w-sm mx-auto">
                 {getStatusMessage(order.status)}
              </p>
          </div>

          <Card className="overflow-hidden border-none shadow-sm rounded-2xl ring-1 ring-gray-100">
            <CardContent className="p-6">
              <OrderTrackingTimeline 
                status={order.status} 
                createdAt={order.created_at}
                updatedAt={order.updated_at}
                orderMethod={order.order_method}
                orderType={order.type || order.orders?.type || 'restaurant'}
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl ring-1 ring-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                <Receipt className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-bold">Détails de la commande</h2>
              </div>
              
              <div className="space-y-4">
                {order.items?.length > 0 ? order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">
                      <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-xs mr-2">{item.quantity}x</span>
                      {item.name || item.menu_items?.name || 'Produit'}
                    </span>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                )) : (
                   <p className="italic text-gray-400 text-sm">Chargement des articles...</p>
                )}
              </div>

              <div className="flex justify-between items-center pt-5 mt-5 border-t border-gray-100">
                  <span className="font-bold text-gray-600 uppercase text-xs tracking-wider">Total</span>
                  <span className="text-xl font-black text-gray-900">{formatCurrency(order.total || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RestaurantOrderTrackingPage;