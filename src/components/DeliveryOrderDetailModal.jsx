import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatDateTime, formatDeliveryStatusFR, getDeliveryStatusColor } from '@/lib/formatters';
import { MapPin, Mail, CreditCard, ExternalLink, Image as ImageIcon, XCircle, Loader2, Phone, Smartphone, Maximize2, CheckCircle, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PAYMENT_STATUSES, STATUS_CANCELLED, STATUS_PENDING, STATUS_REJECTED, getNextStatus, getActionLabel } from '@/lib/deliveryConstants';
import { useToast } from '@/components/ui/use-toast';

export const DeliveryOrderDetailModal = ({ order, open, onOpenChange, onUpdateStatus, onUpdatePayment, onDelete }) => {
  const [loadingAction, setLoadingAction] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && order) {
      console.log('[DEBUG] DeliveryOrderDetailModal opened. Complete order object:', order);
    }
  }, [open, order]);

  if (!order) return null;

  const deliveryData = order.delivery_orders?.[0] || order;
  const items = order.order_items || (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) || [];
  const nextStatus = getNextStatus(order.status);

  // CRITICAL FIX: Ensure we use orders.id (order_id) and not delivery_orders.id
  const targetOrderId = order.order_id || order.id;

  const handleStatusUpdate = async (status, action) => {
    setLoadingAction(action);
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(targetOrderId, status);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePaymentUpdate = async (status, action) => {
    console.log('--- PAYMENT UPDATE DEBUG FLOW ---');
    console.log(`[DEBUG] Target ID for payment update: ${targetOrderId}`);

    if (!targetOrderId) {
       console.error('[DEBUG] ERROR: Order ID is missing from order object!');
       toast({ variant: 'destructive', title: 'Erreur', description: 'ID de commande manquant ou invalide.' });
       return;
    }

    if (!onUpdatePayment) {
      console.error('[DEBUG] ERROR: onUpdatePayment prop is missing!');
      toast({ variant: 'destructive', title: 'Erreur Système', description: 'Fonction de mise à jour non définie.' });
      return;
    }

    setLoadingAction(action);
    try {
      await onUpdatePayment(targetOrderId, status);
    } catch (err) {
      console.error('[DEBUG] ERROR caught in modal during payment update:', err);
      toast({ variant: 'destructive', title: 'Échec de la mise à jour', description: err.message || 'Une erreur est survenue lors de la validation du paiement.' });
    } finally {
      setLoadingAction(null);
    }
  };

  const isPaymentConfirmed = deliveryData.payment_status === PAYMENT_STATUSES.CONFIRMED || deliveryData.payment_status === 'paid';
  const hasValidScreenshot = !!deliveryData.payment_screenshot_url;

  const getMobileMoneyLabel = (type) => {
    const types = { 'mtn': 'MTN Mobile Money', 'airtel': 'Airtel Money', 'orange': 'Orange Money' };
    return types[type] || type || 'Mobile Money';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => !loadingAction && onOpenChange(val)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-start pr-8">
              <div>
                <DialogTitle className="text-xl">Fiche de la Commande #{String(targetOrderId).slice(0, 8)}</DialogTitle>
                <DialogDescription>Enregistrée le {formatDateTime(order.created_at)}</DialogDescription>
              </div>
              <Badge className={getDeliveryStatusColor(order.status)}>
                {formatDeliveryStatusFR(order.status)}
              </Badge>
            </div>
          </DialogHeader>

          {order.status === STATUS_PENDING && (
            <Alert className="border-amber-400 bg-amber-50 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 font-semibold">
                Cette commande attend votre acceptation. Aucune préparation ne peut démarrer sans votre validation.
              </AlertDescription>
            </Alert>
          )}

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    <Mail className="h-4 w-4" /> Client Assigné
                  </div>
                  <p className="font-medium text-gray-900">{order.customer_name || order.client_email || order.orders?.customer_email || 'Client Anonyme'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                    <MapPin className="h-4 w-4" /> Adresse de Destination
                  </div>
                  <p className="font-medium text-gray-900">{order.delivery_address || 'Aucune adresse enregistrée'}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                     <Phone className="h-4 w-4" /> Numéro de Contact
                  </div>
                  <p className="font-medium text-gray-900">{order.customer_phone || order.orders?.customer_phone || 'Non renseigné'}</p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden bg-white shadow-sm border-gray-200">
                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                   <h4 className="font-bold text-sm flex items-center gap-2 text-gray-900 uppercase tracking-wider">
                     <CreditCard className="h-4 w-4 text-primary" /> Données de Facturation
                   </h4>
                   <Badge variant={isPaymentConfirmed ? 'default' : 'outline'} className={isPaymentConfirmed ? 'bg-green-600 hover:bg-green-700 text-white font-bold' : 'bg-yellow-100 text-yellow-800 border-yellow-200 font-bold'}>
                      {isPaymentConfirmed ? 'Paiement Confirmé' : 'En Attente de Validation'}
                   </Badge>
                </div>
                
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Méthode Utilisée</span>
                    <div className="flex items-center gap-2 mt-1">
                      {deliveryData.payment_method === 'mobile_money' ? (
                         <Smartphone className="h-4 w-4 text-primary" />
                      ) : (
                         <CreditCard className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="font-bold capitalize text-gray-900">
                        {deliveryData.payment_method === 'mobile_money' ? getMobileMoneyLabel(deliveryData.mobile_money_type) : (deliveryData.payment_method || 'Méthode Non Définie')}
                      </span>
                    </div>
                  </div>

                  {deliveryData.payment_method === 'mobile_money' && (
                     <div>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Opérateur Réseau</span>
                        <p className="font-bold text-gray-900 mt-1">{getMobileMoneyLabel(deliveryData.mobile_money_type)}</p>
                     </div>
                  )}

                  <div className="col-span-2 mt-2">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 block">Document Justificatif</span>
                    {hasValidScreenshot ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex gap-4 items-center transition-all hover:bg-gray-100 group">
                          <div className="relative w-24 h-24 bg-gray-200 rounded-md overflow-hidden border cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
                            <img src={deliveryData.payment_screenshot_url} alt="Aperçu du paiement" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                               <Maximize2 className="text-white opacity-0 group-hover:opacity-100 w-6 h-6 drop-shadow-md" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                             <div>
                                <p className="text-sm font-bold text-gray-900">Preuve de Transfert Réceptionnée</p>
                                <p className="text-xs text-muted-foreground">Cliquez sur la miniature pour inspecter le document.</p>
                             </div>
                             <div className="flex gap-2">
                               <Button variant="outline" size="sm" onClick={() => setIsImageModalOpen(true)} className="h-7 text-xs font-bold">
                                  <Maximize2 className="w-3 h-3 mr-1" /> Agrandir
                               </Button>
                               <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-blue-600 hover:text-blue-700 font-bold">
                                  <a href={deliveryData.payment_screenshot_url} target="_blank" rel="noreferrer">
                                      <ExternalLink className="w-3 h-3 mr-1"/> Ouvrir le Lien Original
                                  </a>
                               </Button>
                             </div>
                          </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-muted-foreground justify-center">
                         <ImageIcon className="h-5 w-5 opacity-40" />
                         <span className="text-sm font-medium">Aucun document justificatif n'a été fourni par le client.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3">Récapitulatif des Articles</h4>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {items && items.length > 0 ? items.map((item, idx) => {
                    const itemName = item.menu_items?.name || item.name || 'Produit Inconnu';
                    const itemPrice = item.price || item.menu_items?.price || 0;
                    const itemQuantity = item.quantity || 1;
                    
                    return (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <span className="bg-primary/10 text-primary font-bold px-2 py-1 rounded text-xs">
                            x{itemQuantity}
                          </span>
                          <span className="font-medium text-gray-800">{itemName}</span>
                        </div>
                        <span className="font-bold text-gray-900">{formatCurrency(itemPrice * itemQuantity)}</span>
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-gray-500 italic text-center py-2">La liste des articles associés à cette commande est vide ou inaccessible.</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-1 text-right">
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span className="text-gray-900 uppercase tracking-wider">Montant Total à Facturer</span>
                  <span className="text-primary text-xl">{formatCurrency(order.total || order.orders?.total || 0)}</span>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4 border-t pt-4">
            <div className="flex flex-wrap gap-2 w-full justify-between">
              <div>
                {onDelete && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onDelete}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {order.status === STATUS_PENDING ? (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate('confirmed', 'accept')}
                      disabled={!!loadingAction}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold"
                    >
                      {loadingAction === 'accept' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      Accepter la commande
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(STATUS_REJECTED, 'reject')}
                      disabled={!!loadingAction}
                      className="font-bold"
                    >
                      {loadingAction === 'reject' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      Refuser
                    </Button>
                  </>
                ) : (
                  <>
                    {order.status !== STATUS_CANCELLED && order.status !== 'delivered' && order.status !== STATUS_REJECTED && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusUpdate(STATUS_CANCELLED, 'cancel')}
                        disabled={!!loadingAction}
                        className="font-bold"
                      >
                        {loadingAction === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />} Annuler
                      </Button>
                    )}
                    {nextStatus && (
                      <Button
                        onClick={() => handleStatusUpdate(nextStatus, 'next')}
                        className="bg-primary text-white font-bold"
                        disabled={!!loadingAction}
                      >
                        {loadingAction === 'next' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {getActionLabel(nextStatus)}
                      </Button>
                    )}
                  </>
                )}

                {!isPaymentConfirmed && order.status !== STATUS_CANCELLED && (
                  <Button 
                    onClick={() => handlePaymentUpdate(PAYMENT_STATUSES.CONFIRMED, 'pay')}
                    disabled={!!loadingAction}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold min-w-[120px]"
                  >
                     {loadingAction === 'pay' ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : <><CheckCircle className="h-4 w-4 mr-2" /> Valider</>}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-hidden bg-black/95 border-none">
           <div className="relative w-full h-full flex items-center justify-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full z-50" 
                onClick={() => setIsImageModalOpen(false)}
              >
                  <XCircle className="w-8 h-8" />
              </Button>
              {hasValidScreenshot && (
                  <img 
                    src={deliveryData.payment_screenshot_url} 
                    alt="Document Justificatif Plein Écran" 
                    className="max-w-full max-h-full object-contain"
                  />
              )}
           </div>
        </DialogContent>
      </Dialog>
    </>
  );
};