import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronRight, Package, Utensils, Truck, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useVoice } from '@/hooks/useVoice';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { ConnectionStatusBadge, CONNECTION_STATUS } from '@/components/ConnectionStatusBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// REALTIME ESSENTIAL: Realtime is intentionally used here for live order tracking and immediate status updates for the client
export const OrdersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    orders, 
    loading, 
    connectionState, 
    lastUpdated, 
    retryConnection, 
    refresh,
    isPolling 
  } = useRealtimeOrders(user ? { userId: user.id } : {}, 1, 50);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const previousOrdersRef = useRef([]);
  
  const voiceHook = useVoice('client');
  const { 
      speakOrderPending,
      speakOrderReceived,
      speakOrderPreparing,
      speakOrderReady,
      speakOrderSent,
      speakOrderDelivered,
      isSupported
  } = voiceHook || {}; 

  useEffect(() => {
    if (orders && orders.length > 0) {
      try {
        orders.forEach(currentOrder => {
          const prevOrder = previousOrdersRef.current.find(o => o.id === currentOrder.id);
          
          if (prevOrder && prevOrder.status !== currentOrder.status) {
             handleStatusVoice(currentOrder.status);
             
             setNewOrderIds(prev => new Set(prev).add(currentOrder.id));
             setTimeout(() => {
                 setNewOrderIds(prev => {
                     const next = new Set(prev);
                     next.delete(currentOrder.id);
                     return next;
                 });
             }, 5000);

             toast({
               title: "Statut mis à jour",
               description: `Votre commande est maintenant: ${currentOrder.status}`,
               className: "bg-blue-50 border-blue-200"
             });
          }
        });
      } catch (e) {
        console.warn("OrdersPage: Error processing order updates", e);
      }
      
      previousOrdersRef.current = orders;
    }
  }, [orders, toast]);

  const handleStatusVoice = (status) => {
      if (!voiceHook || !isSupported) return;
      try {
        switch (status) {
            case 'pending': speakOrderPending?.(); break;
            case 'confirmed': speakOrderReceived?.(); break;
            case 'preparing': speakOrderPreparing?.(); break;
            case 'ready': speakOrderReady?.(); break;
            case 'in_transit': speakOrderSent?.(); break;
            case 'delivered': speakOrderDelivered?.(); break;
            default: break; 
        }
      } catch (e) {
        console.warn("Failed to play voice notification", e);
      }
  };

  const getStatusBadge = (status, type) => {
    const isDineIn = type === 'dine_in';
    const statusMap = {
      pending: { label: 'En attente', style: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Annulé', style: 'bg-red-100 text-red-800' },
      preparing: { label: 'En préparation', style: 'bg-blue-100 text-blue-800' },
      in_transit: { label: 'En livraison', style: 'bg-amber-100 text-amber-800' },
      delivered: { label: 'Livré', style: 'bg-amber-100 text-amber-800' },
      'en cuisine': { label: 'En cuisine', style: 'bg-blue-100 text-blue-800' },
      servie: { label: 'Servie', style: 'bg-amber-100 text-amber-800' },
      clôturée: { label: 'Terminée', style: 'bg-gray-100 text-gray-800' },
      ready: { label: 'Prêt', style: 'bg-amber-100 text-amber-800' },
      confirmed: { label: 'Confirmé', style: 'bg-indigo-100 text-indigo-800' }
    };
    
    let displayStatus = status;
    if (isDineIn && status === 'pending') displayStatus = 'en cuisine'; 
    
    const config = statusMap[status] || { label: status, style: 'bg-gray-100 text-gray-600' };

    return (
      <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${config.style} transition-all duration-300`}>
        {config.label}
      </span>
    );
  };

  if (loading && orders.length === 0) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-[#D97706]" /></div>;

  return (
    <>
      <Helmet>
        <title>Mes Commandes - La Desirade Plus</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 px-4 pb-24">
        <div className="container mx-auto max-w-2xl space-y-4 pt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
             <h1 className="text-2xl font-bold text-gray-900">Mes Commandes</h1>
             <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="h-8 shadow-sm">
                  <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} /> Forcer Sync.
               </Button>
               <ConnectionStatusBadge 
                 status={connectionState} 
                 lastUpdate={lastUpdated} 
                 onReconnect={retryConnection} 
               />
             </div>
          </div>

          {isPolling && (
             <Alert className="bg-amber-50 border-amber-200 mb-4 py-2">
               <AlertCircle className="h-4 w-4 text-amber-600" />
               <AlertDescription className="text-xs text-amber-800 ml-2">
                 Données en mode synchronisation périodique (Realtime indisponible). Rafraîchissement automatique toutes les 5s.
               </AlertDescription>
             </Alert>
          )}
          
          {orders.length === 0 && !loading ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-[#4b5563] text-sm">Aucune commande passée</p>
            </div>
          ) : (
            <AnimatePresence>
            {orders.map((order, i) => (
              <Dialog key={order.id}>
                <DialogTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${newOrderIds.has(order.id) ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${order.type === 'dine_in' ? 'bg-[#D97706]' : 'bg-blue-500'}`} />
                    
                    {newOrderIds.has(order.id) && (
                        <motion.div 
                           initial={{ opacity: 0.2 }}
                           animate={{ opacity: 0 }}
                           transition={{ duration: 2, repeat: Infinity }}
                           className="absolute inset-0 bg-blue-100 pointer-events-none"
                        />
                    )}

                    <div className="flex justify-between items-start mb-2 pl-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${order.type === 'dine_in' ? 'bg-amber-100 text-[#D97706]' : 'bg-blue-100 text-blue-600'}`}>
                          {order.type === 'dine_in' ? <Utensils className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-base text-[#111827]">
                              {order.type === 'dine_in' && order.tables?.table_number 
                                ? `Table ${order.tables.table_number}` 
                                : 'Livraison'}
                            </p>
                            {order.type === 'dine_in' && (
                              <Badge variant="outline" className="text-[10px] h-5 border-amber-200 text-amber-700 bg-amber-50">Sur Place</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-[#4b5563]">{new Date(order.created_at).toLocaleDateString()} à {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                      {getStatusBadge(order.status, order.type)}
                    </div>
                    
                    <div className="border-t border-gray-50 mt-3 pt-3 flex justify-between items-center pl-3 relative z-10">
                       <span className="text-[#4b5563] text-sm">{order.order_items?.length} articles</span>
                       <div className="flex items-center gap-2">
                         <span className="font-bold text-[#D97706] text-base">{order.total?.toLocaleString()} FCFA</span>
                         <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#D97706]" />
                       </div>
                    </div>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="rounded-2xl w-[90%] max-w-md shadow-lg border-gray-200 bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-lg text-[#111827] flex items-center gap-2">
                      {order.type === 'dine_in' ? <Utensils className="w-5 h-5 text-[#D97706]" /> : <Truck className="w-5 h-5 text-blue-500" />}
                      Détails de la commande
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                     <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center shadow-sm">
                        <span className="text-sm font-medium text-[#111827]">Statut actuel</span>
                        {getStatusBadge(order.status, order.type)}
                     </div>

                     {order.type === 'dine_in' && order.tables && (
                       <div className="bg-amber-50 p-3 rounded-xl border border-green-100 text-center">
                         <p className="text-sm text-amber-800 font-medium">Table {order.tables.table_number}</p>
                         <p className="text-xs text-amber-600">Service à table</p>
                       </div>
                     )}
                     
                     {order.type !== 'dine_in' && (
                       <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                         <p className="text-xs text-blue-600 uppercase font-bold mb-1">Adresse de livraison</p>
                         <p className="text-sm text-blue-900">{order.delivery_address}</p>
                       </div>
                     )}

                     <div className="space-y-3">
                        <h4 className="font-bold text-sm text-[#111827] border-b pb-1">Articles</h4>
                        <div className="max-h-[200px] overflow-y-auto pr-1 space-y-2">
                          {order.order_items?.map(item => (
                            <div key={item.id} className="flex justify-between text-sm items-start">
                              <span className="text-[#4b5563] text-sm flex-1">
                                <span className="font-bold mr-1">{item.quantity}x</span> 
                                {item.menu_items?.name}
                              </span>
                              <span className="font-medium text-sm text-[#111827]">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                            </div>
                          ))}
                        </div>
                     </div>
                     <div className="border-t border-gray-100 pt-3 space-y-2">
                        {order.type !== 'dine_in' && (
                           <div className="flex justify-between items-center text-sm text-gray-500">
                              <span>Frais de livraison</span>
                              <span>1,500 FCFA</span>
                           </div>
                        )}
                        <div className="flex justify-between items-center">
                           <span className="font-bold text-base text-[#111827]">Total</span>
                           <span className="font-bold text-lg text-[#D97706]">{order.total?.toLocaleString()} FCFA</span>
                        </div>
                     </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );
};

export default OrdersPage;