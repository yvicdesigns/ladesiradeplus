import React, { useEffect } from 'react';
import { useRealtimeDeliveryOrders } from '@/hooks/useRealtimeDeliveryOrders';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Package, ArrowRight, RefreshCw, Clock } from 'lucide-react';
import { formatCurrency, formatDeliveryStatusFR, getDeliveryStatusColor } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { debugLogger, LOG_EVENTS } from '@/lib/debugLogger';

const DeliveryOrdersPage = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    debugLogger.log('DeliveryOrdersPage', LOG_EVENTS.MOUNT, { userId: user?.id });
    return () => debugLogger.log('DeliveryOrdersPage', LOG_EVENTS.UNMOUNT);
  }, [user]);

  const { 
    orders, 
    loading, 
    error, 
    refresh 
  } = useRealtimeDeliveryOrders({ 
    userId: user?.id,
    limit: 20
  });

  useEffect(() => {
    if (orders.length > 0) {
        debugLogger.log('DeliveryOrdersPage', LOG_EVENTS.DATA_UPDATE, { count: orders.length });
    }
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Mes Livraisons
          </h1>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <div className="flex-1">
              <p className="font-medium">Erreur lors du chargement</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} className="border-red-200 hover:bg-red-100">
              Réessayer
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {loading && orders.length === 0 ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between mb-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Aucune commande</h3>
              <p className="text-gray-500 mt-2 mb-6">Vous n'avez pas encore effectué de commande en livraison.</p>
              <Button asChild>
                <Link to="/menu">Commander maintenant</Link>
              </Button>
            </div>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow group overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-0">
                  <Link to={`/tracking/${order.order_id}`} className="block p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-500">#{order.order_id.slice(0, 8)}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(order.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">
                           {formatCurrency(order.orders?.total || 0)}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {order.orders?.delivery_address || 'Adresse non spécifiée'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                        <Badge className={`${getDeliveryStatusColor(order.status)} px-3 py-1 text-sm`}>
                          {formatDeliveryStatusFR(order.status)}
                        </Badge>
                        <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryOrdersPage;