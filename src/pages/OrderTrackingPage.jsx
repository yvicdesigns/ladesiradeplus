import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRealtimeDeliveryOrders } from '@/hooks/useRealtimeDeliveryOrders';
import { OrderTrackingTimeline } from '@/components/OrderTrackingTimeline';
import { SoundButtonWrapper as Button } from '@/components/SoundButtonWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, MapPin, CheckCircle, Navigation, AlertCircle, Home, Receipt, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { 
  formatCurrency, 
  formatDeliveryStatusFR, 
  formatPaymentMethod, 
  getPaymentMethodColor 
} from '@/lib/formatters';
import { Helmet } from 'react-helmet';
import { STATUS_DELIVERED, STATUS_CANCELLED, STATUS_ARRIVED_AT_CUSTOMER } from '@/lib/deliveryConstants';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { SoundLink } from '@/components/SoundLink';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { debugLogger, LOG_EVENTS } from '@/lib/debugLogger';
import { useDeliveryVoiceNotification } from '@/hooks/useDeliveryVoiceNotification';
import { executeWithResilience } from '@/lib/supabaseErrorHandler';
import { createDeliveryTracking } from '@/services/DeliveryService';
import { isValidUUID } from '@/lib/deliveryValidation';
import { formatOrderIdForDisplay } from '@/lib/orderIdVerification';

export const OrderTrackingPage = () => {
  const { id, orderId } = useParams();
  const paramOrderId = id || orderId; // This is the orders.id
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [resolvedOrderId, setResolvedOrderId] = useState(null);
  const [isResolving, setIsResolving] = useState(true);
  const [resolveError, setResolveError] = useState(null);

  const voiceNotification = useDeliveryVoiceNotification();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  useEffect(() => {
    const resolveId = async () => {
      setIsResolving(true);
      setResolveError(null);

      if (paramOrderId && isValidUUID(paramOrderId)) {
        console.log(`[OrderTrackingPage] Using exact URL parameter ID (orders.id): ${paramOrderId}`);
        setResolvedOrderId(paramOrderId);
        setIsResolving(false);
        return;
      }

      try {
        await executeWithResilience(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ID de commande invalide et aucun utilisateur connecté.");

            const { data, error } = await supabase
              .from('orders')
              .select('id')
              .eq('user_id', user.id)
              .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'en_route', 'arrived_at_customer'])
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (error) throw new Error("Aucune commande active trouvée.");
            if (data && data.id) {
               console.log(`[OrderTrackingPage] Fallback resolved to latest order ID: ${data.id}`);
               setResolvedOrderId(data.id);
            }
        }, { context: 'Resolve Tracking Order ID', retry: true });
      } catch (err) {
        setResolveError(err.message);
      } finally {
        setIsResolving(false);
      }
    };

    resolveId();
  }, [paramOrderId]);

  useEffect(() => {
     try {
       debugLogger.log('OrderTrackingPage', LOG_EVENTS.MOUNT, { resolvedOrderId });
     } catch (e) { console.warn(e); }
     
     return () => {
        try {
          debugLogger.log('OrderTrackingPage', LOG_EVENTS.UNMOUNT);
          if (voiceNotification && typeof voiceNotification.stop === 'function') {
            voiceNotification.stop();
          }
        } catch (e) { console.warn(e); }
     };
  }, [resolvedOrderId, voiceNotification]);

  // Hook must query using the orders.id
  const {
    orders,
    loading: dataLoading,
    error: dataError,
    connectionStatus,
    refresh,
    retry
  } = useRealtimeDeliveryOrders({ orderId: resolvedOrderId });

  const loading = isResolving || dataLoading;
  const error = resolveError || dataError;
  const order = orders && orders.length > 0 ? orders[0] : null;

  // Fallback: if no delivery order found, check orders table directly and redirect if it's a restaurant order
  useEffect(() => {
    if (!loading && !order && resolvedOrderId && !error) {
      supabase
        .from('orders')
        .select('id, type, order_method')
        .eq('id', resolvedOrderId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const isRestaurant = data.type === 'dine_in' || data.order_method === 'counter';
            if (isRestaurant) {
              navigate(`/track-restaurant-order/${resolvedOrderId}`, { replace: true });
            }
            // If delivery type but no delivery_orders row yet, just show the "not found" state
          }
        });
    }
  }, [loading, order, resolvedOrderId, error, navigate]);

  useEffect(() => {
    if (order) {
       console.log(`[OrderTrackingPage] Fetched order ID: ${order.id}. Matches resolved ID: ${order.id === resolvedOrderId || order.order_id === resolvedOrderId}`);
    }
  }, [order, resolvedOrderId]);

  useEffect(() => {
    if (order) {
      const isRestaurantOrder = order.order_method === 'counter' || order.orders?.type === 'dine_in' || order.type === 'restaurant';
      if (isRestaurantOrder && resolvedOrderId) {
        navigate(`/track-restaurant-order/${resolvedOrderId}`, { replace: true });
      }
    }
  }, [order, navigate, resolvedOrderId]);

  const [updating, setUpdating] = useState(false);
  const { getZoneDetails } = useDeliveryZones();
  
  const lastStatusRef = useRef(null);
  const lastPaymentStatusRef = useRef(null);

  useEffect(() => {
    if (order) {
      if (lastStatusRef.current && lastStatusRef.current !== order.status) {
        toast({
            title: "Mise à Jour",
            description: `Le statut de votre commande : ${formatDeliveryStatusFR(order.status)}`,
            className: "bg-blue-50 border-blue-200"
        });

        try {
          if (voiceNotification && voiceNotification.isSupported && voiceEnabled && typeof voiceNotification.playNotification === 'function') {
            voiceNotification.playNotification(order.status);
          }
        } catch (e) {
          console.warn("OrderTrackingPage: Voice notification failed softly", e);
        }
      }
      lastStatusRef.current = order.status;
      lastPaymentStatusRef.current = order.payment_status;
    }
  }, [order, toast, voiceNotification, voiceEnabled]);

  const handleConfirmArrival = async () => {
    if (!order) return;
    const mainOrderId = order.order_id || order.id; 
    const deliveryOrderId = order.order_id ? order.id : (order.delivery_orders?.[0]?.id || null);
    
    setUpdating(true);
    
    try {
      await executeWithResilience(async () => {
          if (isValidUUID(deliveryOrderId)) {
              const { error: deliveryError } = await supabase
                .from('delivery_orders')
                .update({
                    status: STATUS_DELIVERED,
                    updated_at: new Date().toISOString()
                })
                .eq('id', deliveryOrderId);

              if (deliveryError) throw deliveryError;
              
              const trackingResult = await createDeliveryTracking(
                deliveryOrderId,
                STATUS_DELIVERED,
                null,
                'Livraison confirmée par le client',
                mainOrderId,
                order.customer_id || order.orders?.user_id
              );

              if (!trackingResult.success) {
                console.warn("Warning: Tracking history not recorded:", trackingResult.error);
              }
          }

          const { error: updateError } = await supabase
            .from('orders')
            .update({ 
                status: STATUS_DELIVERED,
                updated_at: new Date().toISOString()
            })
            .eq('id', mainOrderId);

          if (updateError) throw updateError;
      }, { context: 'Confirm Arrival', retry: true });

      toast({ 
          title: "Réussie", 
          description: "La réception a été confirmée.",
          className: "bg-green-600 text-white border-green-700"
      });
      refresh();
    } catch (err) {
      toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: err.message || "Impossible de confirmer la réception." 
      });
    } finally {
      setUpdating(false);
    }
  };

  const isConnected = connectionStatus === 'realtime';

  if (loading && !order) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4 text-center flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-medium">Chargement des détails de la commande...</p>
                <Skeleton className="h-48 w-full rounded-xl" />
            </div>
        </div>
      );
  }

  if (error || !order) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-red-100 shadow-lg">
                <CardContent className="pt-6 px-4 py-6 flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Commande introuvable</h2>
                        <p className="text-sm text-gray-500 mt-2">
                           {error?.friendlyMessage || error?.message || error || "Nous n'avons pas pu charger les détails de cette commande. Le lien est peut-être expiré ou invalide."}
                        </p>
                    </div>
                    <div className="flex gap-3 w-full pt-2">
                        <Button variant="outline" className="flex-1" asChild>
                            <Link to="/"><Home className="w-4 h-4 mr-2" /> Accueil</Link>
                        </Button>
                        <Button onClick={retry || (() => window.location.reload())} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold">
                            <CheckCircle className="w-4 h-4 mr-2" /> Réessayer
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      );
  }

  const isDelivered = order.status === STATUS_DELIVERED;
  const isCancelled = order.status === STATUS_CANCELLED;
  const isArrived = order.status === STATUS_ARRIVED_AT_CUSTOMER;
  
  const zoneName = order.delivery_zones?.name || (order.zone_id && getZoneDetails ? getZoneDetails(order.zone_id)?.name : 'Zone Standard');
  const deliveryFee = order.calculated_delivery_fee || order.delivery_fee || 0;
  const estimatedTime = order.estimated_delivery_time_text || '30 à 45 minutes';
  const distanceKm = order.distance_km;

  return (
    <>
      <Helmet><title>Suivi de Commande #{resolvedOrderId ? formatOrderIdForDisplay(resolvedOrderId) : ''}</title></Helmet>
      
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-16">
        <div className="bg-white border-b sticky top-0 z-50 shadow-sm h-16 flex items-center px-4 transition-all duration-300">
           <div className="container max-w-3xl mx-auto flex justify-between items-center w-full">
              <Button variant="ghost" size="icon" asChild className="-ml-2" soundType="click">
                 <SoundLink to="/"><ArrowLeft className="w-5 h-5"/></SoundLink>
              </Button>
              <div className="flex flex-col items-center">
                 <h1 className="font-bold text-lg text-gray-900">Suivi de Commande</h1>
                 <ConnectionStatus isConnected={isConnected} onRetry={refresh} />
              </div>
              <div className="flex items-center gap-2">
                 {voiceNotification && voiceNotification.isSupported && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className="text-gray-500 hover:text-primary"
                    >
                       {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </Button>
                 )}
              </div>
           </div>
        </div>

        <main className="container max-w-3xl mx-auto px-4 py-6 space-y-5">
           <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={order.status} className="text-center space-y-3">
              <div className="inline-block bg-white px-3 py-1 rounded-full border text-sm font-mono shadow-sm text-gray-600 font-medium break-all">
                 Commande #{formatOrderIdForDisplay(resolvedOrderId)}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                 {isDelivered ? "Votre commande est terminée" : isCancelled ? "Votre commande a été annulée" : formatDeliveryStatusFR(order.status)}
              </h2>
              <div className="mt-2">
                 <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getPaymentMethodColor(order.payment_method)}`}>
                     {formatPaymentMethod(order.payment_method)}
                 </span>
              </div>
           </motion.div>

           <AnimatePresence>
               {isArrived && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <Card className="border-amber-200 bg-amber-50 shadow-md">
                          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-1 animate-bounce">
                                  <MapPin className="w-8 h-8" />
                              </div>
                              <h3 className="font-bold text-xl text-amber-900">Le livreur est arrivé !</h3>
                              <Button 
                                size="sm" 
                                onClick={handleConfirmArrival} 
                                disabled={updating}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm h-12"
                              >
                                  {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5 mr-2" /> Confirmer la Réception</>}
                              </Button>
                          </CardContent>
                      </Card>
                  </motion.div>
               )}
           </AnimatePresence>

           <Card className="border-none shadow-sm ring-1 ring-gray-200 overflow-hidden">
            <CardContent className="p-6">
               <OrderTrackingTimeline 
                 status={order.status} 
                 createdAt={order.created_at} 
                 updatedAt={order.updated_at} 
                 orderMethod="delivery" 
                 orderType="delivery" 
               />
            </CardContent>
           </Card>
           
           <Card className="border-blue-100 bg-blue-50/50 shadow-sm">
             <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="w-full">
                        <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-blue-600"/> Infos Livraison
                        </h4>
                        <p className="text-blue-800 break-words font-medium">{distanceKm ? `${distanceKm} km` : zoneName}</p>
                    </div>
                    <div className="flex gap-10 w-full sm:w-auto mt-2 sm:mt-0">
                        <div>
                            <span className="block text-sm text-blue-600 font-bold uppercase tracking-wider">Frais</span>
                            <span className="font-bold text-blue-900 text-lg">{formatCurrency(deliveryFee)}</span>
                        </div>
                        <div>
                            <span className="block text-sm text-blue-600 font-bold uppercase tracking-wider">Temps</span>
                            <span className="font-bold text-blue-900 text-lg">{estimatedTime}</span>
                        </div>
                    </div>
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm ring-1 ring-gray-200">
             <CardContent className="p-6 space-y-5">
               <div className="flex items-start gap-3">
                 <MapPin className="w-6 h-6 text-gray-400 mt-0.5" />
                 <div>
                   <p className="font-bold text-gray-900">Adresse de Livraison</p>
                   <p className="text-gray-600 line-clamp-2 leading-relaxed font-medium">{order.orders?.delivery_address || order.delivery_address || 'Aucune adresse spécifiée'}</p>
                 </div>
               </div>
               
               <div className="border-t pt-4">
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-gray-900">
                      <Receipt className="w-5 h-5 text-gray-400"/> Détails
                  </h4>
                  <div className="space-y-3 text-gray-600">
                     {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center">
                              <span className="truncate max-w-[70%] font-medium"><span className="font-bold text-gray-900">{item.quantity}x</span> {item.menu_items?.name || 'Produit'}</span>
                              <span className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                           </div>
                        ))
                     ) : (
                        <p className="italic text-gray-400">Articles non disponibles.</p>
                     )}
                  </div>
               </div>

               <div className="flex justify-between items-center pt-4 border-t font-bold text-xl">
                  <span className="text-gray-900">Montant Total</span>
                  <span className="text-primary">{formatCurrency(order.total || order.orders?.total)}</span>
               </div>
             </CardContent>
           </Card>
        </main>
      </div>
    </>
  );
};

export default OrderTrackingPage;