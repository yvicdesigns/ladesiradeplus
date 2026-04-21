import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatDateTime, formatOrderStatus } from '@/lib/formatters';
import { Utensils, Truck, User, Phone, MapPin, AlignLeft, Calendar, Receipt, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const OrderDetailModal = ({ order, open, onClose }) => {
  const [fetchedItems, setFetchedItems] = useState([]);

  useEffect(() => {
    if (!open || !order?.id) return;
    supabase
      .from('order_items')
      .select('id, quantity, price, notes, selected_variants, menu_item_id, menu_items(name, image_url)')
      .eq('order_id', order.id)
      .eq('is_deleted', false)
      .then(({ data }) => { if (data) setFetchedItems(data); });
  }, [open, order?.id]);

  if (!order) return null;

  const isDelivery = order.order_type === 'delivery' || order.type === 'delivery';
  const isCounter = order.order_method === 'counter';

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 relative">
          <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
            <Badge className={`${formatOrderStatus(order.status)} px-3 py-1 text-sm font-semibold shadow-sm`}>
              {order.status}
            </Badge>
            <Badge variant="outline" className={`px-2 py-0.5 text-xs border ${isCounter ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600'}`}>
              {isCounter ? "Vente Comptoir" : (order.order_method === 'qr_code' ? "QR Code" : "En Ligne")}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Commande #{order.id.slice(0, 8)}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-2 text-slate-500">
            <Calendar className="w-4 h-4" /> {formatDateTime(order.created_at)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-6">
            
            {/* Order Type Banner */}
            <div className={`p-4 rounded-xl flex items-center gap-4 ${isDelivery ? 'bg-blue-50 border border-blue-100' : (isCounter ? 'bg-purple-50 border border-purple-100' : 'bg-amber-50 border border-green-100')}`}>
              <div className={`p-3 rounded-full ${isDelivery ? 'bg-blue-100 text-blue-600' : (isCounter ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600')}`}>
                {isDelivery ? <Truck className="w-6 h-6" /> : (isCounter ? <Store className="w-6 h-6" /> : <Utensils className="w-6 h-6" />)}
              </div>
              <div>
                <p className={`font-bold text-lg ${isDelivery ? 'text-blue-900' : (isCounter ? 'text-purple-900' : 'text-amber-900')}`}>
                  {isDelivery ? 'Livraison' : (isCounter ? 'Comptoir' : 'Sur place')}
                </p>
                {isDelivery ? (
                  <div className="text-sm text-blue-700 mt-1 space-y-1">
                    <p className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {order.delivery_address || 'Adresse non spécifiée'}</p>
                    {order.delivery_phone && <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {order.delivery_phone}</p>}
                    {order.delivery_notes && <p className="flex items-start gap-1 mt-2"><AlignLeft className="w-3.5 h-3.5 mt-0.5 shrink-0" /> <span className="italic">"{order.delivery_notes}"</span></p>}
                  </div>
                ) : (
                  <p className={`text-sm mt-1 flex items-center gap-1 ${isCounter ? 'text-purple-700' : 'text-amber-700'}`}>
                    {!isCounter ? (
                      <>Table: <strong className={`${isCounter ? 'text-purple-900' : 'text-amber-900'} text-base ml-1`}>{order.table_id || 'Non assignée'}</strong></>
                    ) : (
                      "Commande passée directement au comptoir."
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
                <User className="w-4 h-4 text-slate-500" /> Informations Client
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Nom</p>
                  <p className="text-slate-900 font-medium">{order.customer_name || 'Invité'}</p>
                </div>
                {order.customer_phone && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Téléphone</p>
                    <p className="text-slate-900 font-medium">{order.customer_phone}</p>
                  </div>
                )}
                {order.customer_email && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Email</p>
                    <p className="text-slate-900 font-medium">{order.customer_email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
                <Receipt className="w-4 h-4 text-slate-500" /> Détails des articles
              </h3>
              
              {(() => {
                const rawItems = order.items || [];
                const displayItems = fetchedItems.length > 0 ? fetchedItems : rawItems;
                return (
                  <div className="space-y-3">
                    {displayItems.length > 0 ? (
                      displayItems.map((item, idx) => {
                        const itemName = item.menu_items?.name || item.name || item.menu_item?.name || 'Produit';
                        const itemImage = item.menu_items?.image_url;
                        const variants = item.selected_variants
                          ? (typeof item.selected_variants === 'string' ? JSON.parse(item.selected_variants) : item.selected_variants)
                          : [];
                        return (
                          <div key={idx} className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
                            <div className="flex gap-3">
                              {itemImage ? (
                                <img src={itemImage} alt={itemName} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-slate-100" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
                                  <span className="text-xl">🍽️</span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-slate-900">{itemName}</p>
                                <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-xs">{item.quantity}x</span>
                                {variants.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {variants.map((v, vi) => (
                                      <span key={vi} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                        {v.variantName}: {v.optionLabel}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.notes && <p className="text-xs text-slate-500 italic mt-0.5">Note: {item.notes}</p>}
                              </div>
                            </div>
                            <span className="font-semibold text-slate-700 whitespace-nowrap ml-2">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-slate-500 text-sm italic">
                        Détails des articles non disponibles dans cette vue.
                      </div>
                    )}
                  </div>
                );
              })()}
              </div>
              
              <div className="flex justify-between items-center pt-4 bg-slate-50 p-4 rounded-xl mt-4 border border-slate-100">
                <span className="font-bold text-slate-700 text-lg">Total</span>
                <span className={`font-bold text-2xl ${isDelivery ? 'text-blue-600' : (isCounter ? 'text-purple-600' : 'text-[#D97706]')}`}>
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

          </div>
        </ScrollArea>
        
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <Button variant="outline" onClick={onClose} className="bg-white">Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};