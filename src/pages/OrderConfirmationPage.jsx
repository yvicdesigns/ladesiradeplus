import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Utensils, ShoppingBag, Truck, ExternalLink, MapPin, Phone, AlignLeft, Store, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { useTranslation } from 'react-i18next';
import { PromotionBreakdownComponent } from '@/components/promotions/PromotionBreakdownComponent';
import { supabase } from '@/lib/customSupabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import { validateRestaurantExists } from '@/lib/validateRestaurantExists';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { formatOrderIdForDisplay } from '@/lib/orderIdVerification';

export const OrderConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = useParams(); // This is the orders.id generated from useCreateOrder
  const { t } = useTranslation();
  
  const { order: stateOrder, type, items: stateItems, deliveryInfo, calculation } = location.state || {};
  
  const [order, setOrder] = useState(stateOrder);
  const [items, setItems] = useState(stateItems);
  const [deliveryOrder, setDeliveryOrder] = useState(null);
  const [loading, setLoading] = useState(!stateOrder && !!orderId);
  const [restaurantValid, setRestaurantValid] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*, tables(table_number)')
          .eq('id', orderId)
          .maybeSingle();
          
        if (orderData) {
          setOrder(orderData);
          
          if (orderData.restaurant_id) {
            const { exists } = await validateRestaurantExists(orderData.restaurant_id);
            if (!exists) {
               setRestaurantValid(false);
            }
          }
          
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*, menu_items(name)')
            .eq('order_id', orderId);
            
          if (itemsData) {
            setItems(itemsData.map(i => ({
              ...i,
              name: i.menu_items?.name || 'Produit inconnu'
            })));
          }

          // Fetch delivery details specifically to get the fee
          const { data: deliveryData } = await supabase
            .from('delivery_orders')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle();
          
          if (deliveryData) {
            setDeliveryOrder(deliveryData);
          }
        }
      } catch (err) {
        console.error("Error fetching order confirmation:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!order && orderId) {
      fetchOrder();
    } else if (order?.id) {
      // If we already have the order but need delivery details
      const fetchDeliveryOnly = async () => {
        const { data: deliveryData } = await supabase
          .from('delivery_orders')
          .select('*')
          .eq('order_id', order.id)
          .maybeSingle();
        if (deliveryData) setDeliveryOrder(deliveryData);
      };
      fetchDeliveryOnly();

      if (order.restaurant_id) {
        validateRestaurantExists(order.restaurant_id).then(({ exists }) => {
          if (!exists) setRestaurantValid(false);
        });
      }
      if (order?.table_id && !order?.tables) {
         supabase.from('tables').select('table_number').eq('id', order.table_id).maybeSingle()
           .then(({data}) => {
             if (data) {
                setOrder(prev => ({...prev, tables: data}));
             }
           });
      }
    }
  }, [orderId, order?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 space-y-4">
        <Skeleton className="w-full max-w-md h-[400px] rounded-[32px]" />
      </div>
    );
  }

  if (!restaurantValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md w-full bg-white border-red-200 shadow-xl">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
          <AlertTitle className="text-red-800 font-bold ml-2 text-lg">Données Indisponibles</AlertTitle>
          <AlertDescription className="ml-2 mt-2">
            <p className="text-gray-600 mb-6">Informations du restaurant indisponibles pour cette commande.</p>
            <Button onClick={() => navigate('/')} className="w-full bg-red-600 hover:bg-red-700 text-white h-11">
              Retour à l'accueil
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!order && !orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-xs w-full">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-[#111827] mb-2">{t('confirmation.no_recent')}</h2>
          <Button onClick={() => navigate('/')} className="w-full bg-[#D97706] hover:bg-[#FCD34D] text-white rounded-xl h-12 font-bold shadow-sm">
            {t('confirmation.back_home')}
          </Button>
        </div>
      </div>
    );
  }

  const effectiveOrder = order || { id: orderId, total: 0, status: 'unknown' };
  const isDelivery = effectiveOrder.order_type === 'delivery' || effectiveOrder.type === 'delivery';
  const isCounter = effectiveOrder.order_method === 'counter';

  const deliveryFee = deliveryOrder?.delivery_fee || deliveryOrder?.calculated_delivery_fee || calculation?.deliveryFee || 0;
  
  // Strict checking to prevent phantom fees on confirmation display if they weren't in the DB payload
  const displayTotal = effectiveOrder.total || calculation?.finalTotal || 0; 
  const displayTableNumber = effectiveOrder.tables?.table_number || (effectiveOrder.table_id ? 'Assignée' : 'N/A');

  // MATCH THE ROUTES IN App.jsx -> /track-order/:id AND /track-restaurant-order/:id
  const trackingLink = isDelivery 
     ? `/track-order/${effectiveOrder.id}` 
     : `/track-restaurant-order/${effectiveOrder.id}`;

  const handleTrackingNavigation = () => {
    if (effectiveOrder && effectiveOrder.id) {
      console.log(`[OrderConfirmationPage] Navigating to tracking link with ID: ${effectiveOrder.id}`);
      navigate(trackingLink);
    }
  };

  return (
    <>
      <Helmet>
        <title>Confirmation - La Desirade Plus</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-12">
        <div className="bg-white rounded-[32px] shadow-xl p-6 md:p-10 max-w-md w-full text-center space-y-8 relative overflow-hidden border border-slate-100">
          
          <div className={`absolute top-0 left-0 w-full h-2 ${isDelivery ? 'bg-blue-500' : (isCounter ? 'bg-purple-500' : 'bg-[#D97706]')} rounded-t-[32px]`} />

          <div className="space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ring-8 ${isCounter ? 'bg-purple-50 ring-purple-50/50' : 'bg-amber-50 ring-green-50/50'}`}>
              <CheckCircle className={`h-10 w-10 ${isCounter ? 'text-purple-600' : 'text-amber-600'}`} />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                {isCounter ? "Commande Prête !" : "Commande Confirmée"}
              </h1>
              <p className="text-gray-500 mt-2 text-sm max-w-[250px] mx-auto">
                {isCounter 
                  ? "Votre commande a été enregistrée et est prête à être récupérée." 
                  : "Votre commande a été enregistrée avec succès et est en cours de traitement."}
              </p>
              <div className="mt-4 inline-block bg-slate-100 px-4 py-1.5 rounded-lg font-mono text-slate-700 font-semibold tracking-wider break-all">
                #{formatOrderIdForDisplay(effectiveOrder.id)}
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl text-left border ${isDelivery ? 'bg-blue-50/50 border-blue-100' : (isCounter ? 'bg-purple-50/50 border-purple-100' : 'bg-amber-50/50 border-green-100')}`}>
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-black/5">
              <div className={`p-2 rounded-full ${isDelivery ? 'bg-blue-100 text-blue-600' : (isCounter ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600')}`}>
                {isDelivery ? <Truck className="w-5 h-5" /> : (isCounter ? <Store className="w-5 h-5" /> : <Utensils className="w-5 h-5" />)}
              </div>
              <h2 className={`font-bold text-lg ${isDelivery ? 'text-blue-900' : (isCounter ? 'text-purple-900' : 'text-amber-900')}`}>
                {isDelivery ? 'Livraison à domicile' : (isCounter ? 'Retrait au Comptoir' : 'Consommation sur place')}
              </h2>
            </div>
            
            <div className="space-y-2.5">
              {isDelivery ? (
                <>
                  <div className="flex gap-2 text-sm text-blue-900">
                    <MapPin className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                    <span className="font-medium leading-snug">{effectiveOrder.delivery_address || (deliveryInfo && deliveryInfo.address) || 'Adresse non spécifiée'}</span>
                  </div>
                  {effectiveOrder.delivery_phone && (
                    <div className="flex gap-2 text-sm text-blue-900">
                      <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="font-medium">{effectiveOrder.delivery_phone}</span>
                    </div>
                  )}
                  {effectiveOrder.delivery_notes && (
                    <div className="flex gap-2 text-sm text-blue-900 mt-2 p-2 bg-white/60 rounded-lg">
                      <AlignLeft className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span className="italic text-blue-800">{effectiveOrder.delivery_notes}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className={`flex items-center justify-between ${isCounter ? 'text-purple-900' : 'text-amber-900'}`}>
                  <span className="text-sm font-medium">{isCounter ? "Lieu de retrait" : "Numéro de Table"}</span>
                  <span className={`text-xl font-black bg-white px-3 py-1 rounded-lg shadow-sm ${isCounter ? 'text-purple-700' : ''}`}>
                    {isCounter ? "Comptoir" : displayTableNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4 border border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Détails des articles</h3>
            
            <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
              {items ? items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <span className="text-slate-600 font-medium">
                    <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-xs mr-2">{item.quantity}x</span>
                    {item.name}
                  </span>
                  <span className="font-semibold text-slate-900">
                      {calculation 
                          ? formatCurrency(calculation.items.find(i => i.itemId === item.id)?.finalTotal || item.price * item.quantity)
                          : formatCurrency(item.price * item.quantity)
                      }
                  </span>
                </div>
              )) : (
                  <p className="text-sm text-slate-400 text-center italic">Chargement des articles...</p>
              )}

              {/* Delivery Fee Line */}
              {isDelivery && (
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 border-dashed">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-700 font-medium italic">Frais de Livraison</span>
                  </div>
                  <span className="font-semibold text-blue-900">
                    {deliveryFee === 0 ? "Gratuite" : formatCurrency(deliveryFee)}
                  </span>
                </div>
              )}
            </div>
            
            {calculation && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                    <PromotionBreakdownComponent calculation={calculation} />
                </div>
            )}

            <div className="border-t border-slate-200 pt-4 flex justify-between items-end">
               <span className="font-bold text-slate-600 uppercase text-xs tracking-wider">Total à payer</span>
               <span className="font-black text-2xl text-slate-900">
                 {formatCurrency(displayTotal)}
               </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 pt-2">
             {!isCounter && (
               <Button 
                  variant="outline"
                  className={`w-full border-2 rounded-2xl h-14 font-bold flex items-center gap-2 justify-center text-lg
                    ${isDelivery ? 'border-blue-200 text-blue-600 hover:bg-blue-50' : 'border-amber-200 text-amber-600 hover:bg-amber-50'}`}
                  onClick={handleTrackingNavigation}
               >
                  Suivre ma commande <ExternalLink className="w-5 h-5 ml-1" />
               </Button>
             )}

             <Button 
                onClick={() => navigate('/menu')} 
                className={`w-full hover:bg-slate-800 text-white rounded-2xl h-12 font-bold ${isCounter ? 'bg-purple-600' : 'bg-slate-900'}`}
             >
                Continuer mes achats
             </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderConfirmationPage;