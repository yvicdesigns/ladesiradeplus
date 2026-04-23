import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  formatCurrency, 
  formatDateTime, 
  formatPaymentMethod, 
  getRestaurantOrderStatusColor, 
  formatRestaurantOrderStatus,
  getOrderMethodLabel,
  getValidActionsForOrderMethod
} from '@/lib/formatters';
import { getValidStatusTransitionsForOrderMethod } from '@/lib/orderStatusValidation';
import { Utensils, Mail, Wallet, CheckCircle, XCircle, BellRing, Image, MapPin, Clock, CreditCard, User, WrapText as ReceiptText, Loader2, Bug, Store, Gift } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const RestaurantOrderDetailModal = ({ order, open, onOpenChange, onUpdateStatus, onUpdatePaymentStatus }) => {
  const { getZoneDetails } = useDeliveryZones();
  const [isPaymentUpdating, setIsPaymentUpdating] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [fetchedItems, setFetchedItems] = useState([]);

  useEffect(() => {
    if (!open || !order?.order_id && !order?.id) return;
    const orderId = order.order_id || order.id;
    supabase
      .from('order_items')
      .select('id, quantity, price, notes, selected_variants, menu_item_id, menu_items(name, image_url, description)')
      .eq('order_id', orderId)
      .eq('is_deleted', false)
      .then(({ data }) => { if (data) setFetchedItems(data); });
  }, [open, order?.order_id, order?.id]);
  
  // Robust orderMethod extraction with fallback
  const orderMethod = order?.order_method || order?.orders?.order_method || 'unknown';
  const isCounter = orderMethod.toLowerCase() === 'counter';

  useEffect(() => {
    if (open && order) {
      console.log('=== MODAL OPENED ===');
      console.log('Order ID:', order.id);
      console.log('Detected Order Method:', orderMethod);
      console.log('Current Status:', order.status);
      
      if (order.id === '24c667eb-92f9-4563-942f-00e09c1f20b4') {
         console.log('>>> TARGET TEST ORDER IDENTIFIED (Counter check) <<<');
      }

      console.log('Valid transitions:', getValidStatusTransitionsForOrderMethod(order.status, orderMethod));
      console.log('Rendered buttons:', getValidActionsForOrderMethod(orderMethod, order.status));
    }
  }, [open, order, orderMethod]);
  
  if (!order) return null;

  const rawItems = order.order_items?.length ? order.order_items
    : (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) || [];
  const items = fetchedItems.length > 0 ? fetchedItems : rawItems;
  const showPaymentProofSection = order.payment_screenshot_url;
  const isDelivery = order.type === 'delivery'; 
  const zoneInfo = order.zone_id ? getZoneDetails(order.zone_id) : null;

  const handleMarkAsPaid = async () => {
    if (!onUpdatePaymentStatus) return;
    setIsPaymentUpdating(true);
    try {
      await onUpdatePaymentStatus(order.id, 'paid');
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaymentUpdating(false);
    }
  };

  const handleStatusAction = async (newStatus) => {
    console.log(`[Modal Action] Attempting to set status to ${newStatus} for order ${order.id} (Method: ${orderMethod})`);
    
    setIsStatusUpdating(true);
    try {
      await onUpdateStatus(order.id, newStatus, order.status, orderMethod);
    } catch (err) {
      console.error(err);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Get exactly the actions permitted for this specific order type
  const actionButtons = getValidActionsForOrderMethod(orderMethod, order.status);
  
  // Separate the cancel button from the primary workflow buttons for UI layout
  const cancelAction = actionButtons.find(btn => btn.isCancel);
  const primaryActions = actionButtons.filter(btn => !btn.isCancel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="border-b p-6 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-3">
                 {isDelivery ? `Livraison #${order.id.slice(0, 8)}` : `Commande #${order.id.slice(0, 8)}`}
                 <Badge variant="outline" className={`flex items-center gap-1.5 ${isCounter ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-700"}`}>
                    <Store className="w-3 h-3" />
                    {getOrderMethodLabel(orderMethod)}
                 </Badge>
              </DialogTitle>
              <DialogDescription className="mt-2 flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-slate-500"><Clock className="w-4 h-4" /> {formatDateTime(order.created_at)}</span>
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${getRestaurantOrderStatusColor(order.status)} px-3 py-1 text-sm border shadow-sm`}>
                {formatRestaurantOrderStatus(order.status).toUpperCase()}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-slate-400" onClick={() => setShowDebug(!showDebug)}>
                 <Bug className="w-3 h-3 mr-1" /> Debug
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 bg-slate-50/50">
          <div className="space-y-6">
            
            {/* Complimentary banner */}
            {order.is_complimentary && (
              <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                <Gift className="w-6 h-6 text-purple-600 shrink-0" />
                <div>
                  <p className="font-bold text-purple-800 text-sm">Commande offerte</p>
                  {order.complimentary_reason && (
                    <p className="text-sm text-purple-600">Pour : <span className="font-semibold">{order.complimentary_reason}</span></p>
                  )}
                </div>
              </div>
            )}

            {showDebug && (
              <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto">
                 <p className="font-bold text-white mb-2 border-b border-slate-700 pb-1">=== DIAGNOSTIC DEBUG ===</p>
                 <p><span className="text-slate-400">Order ID:</span> {order.id}</p>
                 <p><span className="text-slate-400">Extracted Method:</span> {orderMethod}</p>
                 <p><span className="text-slate-400">Current Status:</span> {order.status}</p>
                 <p><span className="text-slate-400">Valid Transitions:</span> {JSON.stringify(getValidStatusTransitionsForOrderMethod(order.status, orderMethod))}</p>
                 <p><span className="text-slate-400">Generated Primary Buttons:</span> {JSON.stringify(primaryActions.map(b => b.action))}</p>
                 <p><span className="text-slate-400">Has Cancel Action:</span> {cancelAction ? 'YES' : 'NO'}</p>
              </div>
            )}

            {/* 3-Column Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Client Info */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <User className="w-4 h-4 text-slate-500" /> Client
                </h3>
                <div className="space-y-1">
                  <p className="font-medium text-base text-slate-900">{order.customer_name || 'Client Anonyme'}</p>
                  {order.customer_email && <p className="text-sm text-slate-600 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {order.customer_email}</p>}
                  {order.customer_phone && <p className="text-sm text-slate-600 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400 opacity-0" /> {order.customer_phone}</p>}
                </div>
              </div>

              {/* Order Info (Table/Location) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Utensils className="w-4 h-4 text-slate-500" /> Emplacement
                </h3>
                <div className="space-y-1">
                  {isDelivery ? (
                    <>
                      <p className="font-medium text-sm">{order.delivery_address || 'Adresse non spécifiée'}</p>
                      {zoneInfo && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 mt-2">
                           Zone: {zoneInfo.name}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-start gap-2">
                       <span className="text-sm text-slate-500">{isCounter ? 'Mode de service' : 'Service à la'}</span>
                       <span className={`font-bold text-lg px-3 py-1 rounded-lg ${isCounter ? 'text-amber-700 bg-amber-50' : 'text-blue-700 bg-blue-50'}`}>
                         {isCounter ? 'Au Comptoir' : `Table ${order.table_number || 'N/A'}`}
                       </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-slate-500" /> Paiement
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-slate-500">Méthode:</span>
                     <span className="text-sm font-medium">{formatPaymentMethod(order.payment_method)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-slate-500">Statut:</span>
                     <Badge className={order.payment_status === 'paid' ? 'bg-amber-100 text-amber-800 border-amber-200 shadow-sm' : 'bg-red-50 text-red-800 border-red-200 shadow-sm'}>
                       {order.payment_status === 'paid' ? <><CheckCircle className="w-3 h-3 mr-1" /> Payé</> : 'Non payé'}
                     </Badge>
                  </div>
                  
                  {order.payment_status !== 'paid' && (
                    <Button 
                      size="sm" 
                      onClick={handleMarkAsPaid} 
                      disabled={isPaymentUpdating}
                      className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white transition-all shadow-sm"
                    >
                      {isPaymentUpdating ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mise à jour...</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 mr-2" /> Marquer payé</>
                      )}
                    </Button>
                  )}

                  {showPaymentProofSection && (
                    <a 
                      href={order.payment_screenshot_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1 mt-2 transition-colors"
                    >
                      <Image className="w-3 h-3" /> Voir preuve
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Zone Info (If Delivery) */}
            {isDelivery && zoneInfo && (
               <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                     <span className="text-xs text-blue-600 font-semibold flex items-center gap-1"><MapPin className="w-3 h-3"/> Zone</span>
                     <p className="font-medium text-blue-900">{zoneInfo.name}</p>
                  </div>
                  <div className="space-y-1">
                     <span className="text-xs text-blue-600 font-semibold flex items-center gap-1"><Wallet className="w-3 h-3"/> Frais</span>
                     <p className="font-bold text-blue-900">{formatCurrency(order.delivery_fee || 0)}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                     <span className="text-xs text-blue-600 font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/> Estimation</span>
                     <p className="font-medium text-blue-900">{order.estimated_delivery_time_text || '30-45min'}</p>
                  </div>
               </div>
            )}

            {/* Order Items */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-slate-500" />
                <h4 className="font-semibold text-slate-800">Détail de la Commande ({items?.length || 0} articles)</h4>
              </div>
              <div className="p-5 space-y-4">
                {items && items.map((item, idx) => {
                  const itemName = item.menu_items?.name || item.name || 'Produit Inconnu';
                  const itemImage = item.menu_items?.image_url;
                  const variants = item.selected_variants
                    ? (typeof item.selected_variants === 'string' ? JSON.parse(item.selected_variants) : item.selected_variants)
                    : [];
                  return (
                    <div key={idx} className="flex justify-between items-start text-sm border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        {itemImage ? (
                          <img src={itemImage} alt={itemName} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-slate-100 shadow-sm" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
                            <span className="text-2xl">🍽️</span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{itemName}</p>
                          <span className="bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded text-xs">x{item.quantity}</span>
                          {variants.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {variants.map((v, vi) => (
                                <span key={vi} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                  {v.variantName}: {v.optionLabel}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.notes && <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded">Note: {item.notes}</p>}
                        </div>
                      </div>
                      <span className="font-bold text-slate-700 whitespace-nowrap ml-4">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-slate-50 p-5 border-t border-slate-200 flex flex-col gap-2">
                {isDelivery && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Sous-total:</span>
                    <span>{formatCurrency(order.total - (order.delivery_fee || 0))}</span>
                  </div>
                )}
                {isDelivery && (
                   <div className="flex justify-between text-sm text-slate-600">
                    <span>Frais de livraison:</span>
                    <span>{formatCurrency(order.delivery_fee || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-bold text-xl text-slate-900 pt-3 mt-1 border-t border-slate-200 border-dashed">
                  <span>Total à payer:</span>
                  {order.is_complimentary ? (
                    <span className="flex items-center gap-1.5 text-purple-600">
                      <Gift className="w-5 h-5" /> Offert
                    </span>
                  ) : (
                    <span className="text-amber-600">{formatCurrency(order.total)}</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Action Footer */}
        <DialogFooter className="bg-white px-6 py-4 border-t flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          
          <TooltipProvider>
            {/* Dynamically render Cancel button based on valid actions */}
            {cancelAction ? (
              <Button 
                variant="ghost" 
                className={`w-full sm:w-auto ${cancelAction.className}`} 
                disabled={isStatusUpdating}
                onClick={() => handleStatusAction(cancelAction.action)}
              >
                <XCircle className="h-4 w-4 mr-2" /> {cancelAction.label}
              </Button>
            ) : (
              <div></div> // Empty div to keep flex layout balanced if no cancel
            )}

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              {/* Dynamic rendering based on order method and status */}
              {primaryActions.map((btn, idx) => (
                 <Button 
                    key={idx}
                    onClick={() => handleStatusAction(btn.action)} 
                    className={`${btn.className} shadow-sm w-full sm:w-auto`}
                    disabled={isStatusUpdating}
                  >
                    {isStatusUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                    {btn.label}
                 </Button>
              ))}

              {/* Informative tooltip if no primary buttons are shown and it's pending (for counter orders edge cases) */}
              {isCounter && order.status === 'pending' && primaryActions.length > 0 && !primaryActions.some(b => b.action === 'preparing') && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-slate-400 italic cursor-help">
                      (Bypass préparation)
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Les commandes au comptoir passent directement de 'En attente' à 'Servie'.</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};