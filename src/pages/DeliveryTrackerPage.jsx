import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Circle, Clock, MapPin, Package, UserCheck, AlertTriangle } from 'lucide-react';
import { DELIVERY_STATUSES, getStatusIndex } from '@/lib/deliveryConstants';
import { formatDateTime } from '@/lib/formatters';

export const DeliveryTrackerPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, trackingHistory, loading, isOffline, updateDeliveryStatus } = useDeliveryTracking(orderId);

  const currentStatusIndex = order ? getStatusIndex(order.status) : 0;

  const handleClientConfirmation = async () => {
    await updateDeliveryStatus('completed', 'client');
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement du suivi...</div>;
  }

  if (!order) {
    return <div className="p-8 text-center">Commande introuvable.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-center">Suivi de Commande</h1>
        <p className="text-sm text-center text-muted-foreground">#{order.id.slice(0, 8)}</p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {isOffline && (
           <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4" />
              Mode hors ligne activé. Vos actions seront synchronisées plus tard.
           </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> 
              Statut Actuel
            </CardTitle>
            <CardDescription>
                Dernière mise à jour: {formatDateTime(order.validation_timestamp || order.updated_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary mb-2">
              {DELIVERY_STATUSES.find(s => s.key === order.status)?.label}
            </div>
            
            {/* Show "J'ai reçu" button ONLY if status is 'arrived' (7) */}
            {order.status === 'arrived' && (
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-green-100">
                <p className="text-sm font-medium text-amber-800 mb-3 text-center">
                  Le livreur indique être arrivé. Avez-vous reçu votre commande ?
                </p>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                  onClick={handleClientConfirmation}
                >
                  <UserCheck className="mr-2 h-5 w-5" />
                  Oui, j'ai reçu ma commande
                </Button>
              </div>
            )}
            
             {order.status === 'completed' && (
              <div className="mt-4 p-4 bg-amber-100 text-amber-800 rounded-xl text-center font-medium">
                  Commande terminée avec succès !
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 pb-4">
          {DELIVERY_STATUSES.map((status, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const historyItem = trackingHistory.find(h => h.status === status.key);

            return (
              <div key={status.key} className="relative pl-6">
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 
                  ${isCompleted ? 'bg-primary border-primary' : 'bg-white border-gray-300'}
                  ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                `}>
                  {isCompleted && <CheckCircle2 className="w-full h-full text-white p-0.5" />}
                </div>
                
                <div className={`transition-all ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                  <h3 className={`font-semibold text-sm ${isCurrent ? 'text-primary text-base' : ''}`}>
                    {status.label}
                  </h3>
                  {historyItem && (
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(historyItem.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Helper Info */}
        <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-semibold">Adresse de livraison</p>
                    {/* Ensure we don't access invalid relationships here */}
                    <p>{order.delivery_address || (order.orders && order.orders.delivery_address)}</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryTrackerPage;