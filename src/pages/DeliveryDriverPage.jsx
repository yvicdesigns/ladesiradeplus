import React from 'react';
import { useParams } from 'react-router-dom';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, User, Navigation, Loader2, WifiOff, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const DeliveryDriverPage = () => {
  const { orderId } = useParams();
  const { order, loading, isOffline, updateDeliveryStatus, syncOfflineValidations } = useDeliveryTracking(orderId);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!order) return <div className="p-4">Commande introuvable</div>;

  const handleArrival = () => {
    updateDeliveryStatus('arrived', 'livreur');
  };

  const handleDelivered = () => {
     updateDeliveryStatus('delivered', 'livreur');
  };

  const isAssigned = order.status === 'assigned';
  const isInTransit = order.status === 'in_transit';
  const isArrived = order.status === 'arrived';
  
  // Logic:
  // If assigned -> Click "Start" -> in_transit (6)
  // If in_transit -> Click "Arrived" -> arrived (7)
  // If arrived -> Wait for client OR Click "Handed Over" -> delivered (8)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Driver Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <div>
           <h1 className="font-bold text-lg">Mode Livreur</h1>
           <p className="text-gray-400 text-sm">#{order.id.slice(0, 6)}</p>
        </div>
        {isOffline ? (
            <Badge variant="destructive" className="flex gap-1">
                <WifiOff className="w-3 h-3" /> Hors ligne
            </Badge>
        ) : (
             <Badge className="bg-green-600 flex gap-1">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" /> En ligne
            </Badge>
        )}
      </div>

      <div className="flex-1 p-4 space-y-6 flex flex-col">
        {/* Order Info Card */}
        <Card className="bg-gray-800 border-gray-700 text-gray-100">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-gray-400">Client</p>
                <p className="font-semibold text-lg">{order.orders?.customer_name || 'Client'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm text-gray-400">Adresse</p>
                <p className="font-medium text-lg leading-snug">{order.delivery_address || order.orders?.delivery_address}</p>
              </div>
            </div>

            {order.client_phone && (
                <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-1" />
                <div>
                    <p className="text-sm text-gray-400">Téléphone</p>
                    <a href={`tel:${order.client_phone}`} className="font-medium text-lg text-blue-400 underline">{order.client_phone}</a>
                </div>
                </div>
            )}
            
            <Button
              variant="outline"
              className="w-full mt-2 border-gray-600 hover:bg-gray-700"
              onClick={() => {
                const address = order.delivery_address || order.orders?.delivery_address;
                if (!address) return;
                const encoded = encodeURIComponent(address);
                // Ouvre Google Maps sur mobile, fallback navigateur
                const url = /iPhone|iPad|iPod/i.test(navigator.userAgent)
                  ? `maps://maps.apple.com/?daddr=${encoded}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
                window.open(url, '_blank');
              }}
            >
                <Navigation className="mr-2 h-4 w-4" /> Ouvrir GPS
            </Button>
          </CardContent>
        </Card>

        {/* Action Area - Takes remaining space */}
        <div className="flex-1 flex flex-col justify-end pb-8 gap-4">
            
            {/* Status Display */}
            <div className="text-center mb-4">
                <p className="text-gray-400 mb-1">Statut Actuel</p>
                <Badge className="text-xl py-2 px-6 bg-primary/20 text-primary border-primary/50">
                    {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
            </div>

            {/* BIG ACTION BUTTONS */}
            {order.status === 'assigned' && (
                 <Button 
                    className="w-full h-24 text-2xl font-bold bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-900/50"
                    onClick={() => updateDeliveryStatus('in_transit', 'livreur')}
                >
                    Démarrer la course 🚀
                </Button>
            )}

            {order.status === 'in_transit' && (
                <Button 
                    className="w-full h-24 text-2xl font-bold bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg shadow-green-900/50"
                    onClick={handleArrival}
                >
                    <MapPin className="mr-3 h-8 w-8" />
                    Arrivé chez le client
                </Button>
            )}

            {order.status === 'arrived' && (
                 <Button 
                    className="w-full h-24 text-2xl font-bold bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg shadow-green-900/50"
                    onClick={handleDelivered}
                >
                    <CheckCircle className="mr-3 h-8 w-8" />
                    Colis Remis
                </Button>
            )}

            {(order.status === 'delivered' || order.status === 'completed') && (
                 <div className="text-center p-8 bg-gray-800 rounded-2xl border border-green-900/50">
                    <CheckCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-green-400">Livraison Terminée</h2>
                    <p className="text-gray-400 mt-2">Bon travail !</p>
                    <Button variant="link" className="text-white mt-4" onClick={() => window.location.href = '/admin/delivery-orders'}>
                        Retour à la liste
                    </Button>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDriverPage;