import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, User, Check, MapPin, Phone, AlignLeft, AlertCircle, UserMinus, RefreshCw, Gift } from 'lucide-react';
import { OrderItemSelector } from './OrderItemSelector';
import { OrderSummary } from './OrderSummary';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { OrderTypeSelector } from './OrderTypeSelector';
import { supabase } from '@/lib/customSupabaseClient';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/components/ui/use-toast';
import { verifyOrderCreationData } from '@/lib/orderDiagnostics';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useClients } from '@/hooks/useClients';
import { validateRestaurantIdBeforeOrderCreation, getRestaurantIdWithFallback } from '@/lib/restaurantValidation';
import { TableNumberSelector } from '@/components/TableNumberSelector';

export const CreateOrderModal = ({ open, onClose, client, restaurant_id, onSuccess }) => {
  const { menuItems, loading, submitting, fetchMenuItems, submitOrder } = useCreateOrder();
  const { restaurantId: contextRestaurantId } = useRestaurant();
  const { toast } = useToast();
  
  const initialRestaurantId = restaurant_id || contextRestaurantId;
  const [activeRestaurantId, setActiveRestaurantId] = useState(initialRestaurantId);
  const [isRestaurantValid, setIsRestaurantValid] = useState(true);
  
  // Use specialized hook to guarantee we get all active clients
  const { clients: fetchedCustomers, loading: loadingCustomers, error: fetchCustomerError, refresh: fetchCustomers } = useClients({}, 1, 'all');
  const customers = Array.isArray(fetchedCustomers) ? fetchedCustomers : [];
  
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine_in');
  const [submitError, setSubmitError] = useState(null);
  
  // Delivery fields
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  
  // Dine-in fields
  const [selectedTable, setSelectedTable] = useState('');

  // Customer selection
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Complimentary
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [complimentaryReason, setComplimentaryReason] = useState('');

  useEffect(() => {
    if (open) {
      // Validate restaurant immediately when modal opens
      const checkRestaurant = async () => {
        const validation = await validateRestaurantIdBeforeOrderCreation(initialRestaurantId);
        if (validation.valid) {
          setActiveRestaurantId(validation.restaurantId);
          setIsRestaurantValid(true);
          fetchMenuItems();
        } else {
          setIsRestaurantValid(false);
          setSubmitError(validation.error);
        }
      };
      
      checkRestaurant();
      
      setCart([]);
      setOrderType('dine_in');
      setSubmitError(null);
      setDeliveryAddress(client?.address || '');
      setDeliveryPhone(client?.phone || '');
      setDeliveryNotes('');
      setSelectedTable('');
      setSelectedCustomerId('');
      setIsAnonymous(false);
    }
  }, [open, client, fetchMenuItems, initialRestaurantId]);

  const handleSubmit = async () => {
    setSubmitError(null);
    
    if (!isRestaurantValid) {
       setSubmitError("Erreur: Le restaurant n'existe pas. Veuillez contacter le support.");
       return;
    }
    
    // Determine Client
    let clientData = client;
    if (!client) {
      if (isAnonymous) {
        clientData = { name: 'Client Anonyme' };
      } else {
        if (!selectedCustomerId) {
          setSubmitError("Veuillez sélectionner un client ou activer le mode anonyme.");
          return;
        }
        clientData = customers.find(c => c.id === selectedCustomerId);
      }
    }
    
    // Validations
    if (orderType === 'delivery') {
      if (!deliveryAddress.trim()) {
        setSubmitError("L'adresse de livraison est requise.");
        return;
      }
      if (!deliveryPhone.trim()) {
        setSubmitError("Le numéro de téléphone est requis pour la livraison.");
        return;
      }
    } else if (orderType === 'dine_in') {
      if (!selectedTable) {
        setSubmitError("Veuillez sélectionner une table pour la commande sur place.");
        return;
      }
    }

    // Final pre-flight validation
    const validation = await validateRestaurantIdBeforeOrderCreation(activeRestaurantId);
    if (!validation.valid) {
      setSubmitError(validation.error);
      return;
    }

    const orderDetails = {
      order_type: orderType,
      table_id: selectedTable,
      delivery_address: deliveryAddress,
      delivery_phone: deliveryPhone,
      delivery_notes: deliveryNotes,
      restaurant_id: validation.restaurantId,
      is_complimentary: isComplimentary,
      complimentary_reason: isComplimentary ? complimentaryReason : null,
    };

    const result = await submitOrder(clientData, cart, orderDetails);
    
    if (result.success) {
      await verifyOrderCreationData(result.order.id, orderType, validation.restaurantId);

      toast({
        title: "Commande validée",
        description: "La commande a été créée avec succès.",
      });
      onClose();
      if (onSuccess) onSuccess(result.order);
    } else {
      const errorMsg = result.error?.message || "Une erreur est survenue lors de la création de la commande.";
      setSubmitError(errorMsg);
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: errorMsg,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-6xl h-[95vh] md:h-[90vh] p-0 flex flex-col gap-0 overflow-hidden bg-gray-50 rounded-2xl border-none">
        <DialogHeader className="p-4 md:p-6 border-b bg-white shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>Nouvelle Commande</span>
            {client && (
              <Badge variant="outline" className="bg-slate-100 text-slate-700 text-sm py-1 px-3 font-normal border-slate-200">
                <User className="h-4 w-4 mr-2" /> {client.name}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="hidden">Formulaire de création de commande</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Side: Menu Items */}
          <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col bg-white lg:border-r border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Sélection du Menu</h3>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : !isRestaurantValid ? (
              <div className="flex-1 flex items-center justify-center text-center p-6 text-red-500">
                Impossible de charger le menu car l'identifiant du restaurant est invalide.
              </div>
            ) : (
              <OrderItemSelector menuItems={menuItems} cart={cart} setCart={setCart} />
            )}
          </div>

          {/* Right Side: Order Details & Form */}
          <div className="w-full lg:w-[450px] flex flex-col bg-gray-50 overflow-y-auto">
            <div className="p-4 md:p-6 flex-1 space-y-6">
              
              {submitError && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800 font-bold">Erreur</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {fetchCustomerError && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 mb-4">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800 font-bold">Erreur de chargement</AlertTitle>
                  <AlertDescription>Impossible de charger la liste des clients.</AlertDescription>
                  <Button variant="outline" size="sm" onClick={fetchCustomers} className="mt-2 w-full bg-white">Réessayer</Button>
                </Alert>
              )}

              {/* Customer Selection (Only if no client provided via props) */}
              {!client && isRestaurantValid && (
                <div className="space-y-4 bg-white p-4 rounded-xl border shadow-sm border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="anonymous-mode" className="text-sm font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                      <UserMinus className="w-4 h-4 text-slate-500" />
                      Mode Client Anonyme
                    </Label>
                    <Switch 
                      id="anonymous-mode" 
                      checked={isAnonymous} 
                      onCheckedChange={setIsAnonymous} 
                    />
                  </div>

                  {!isAnonymous && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Client Associé <span className="text-red-500">*</span>
                        </Label>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs flex items-center gap-1" onClick={fetchCustomers} disabled={loadingCustomers}>
                          <RefreshCw className={`w-3 h-3 ${loadingCustomers ? 'animate-spin' : ''}`} />
                          Actualiser
                        </Button>
                      </div>
                      
                      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId} disabled={loadingCustomers}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 text-gray-900 w-full">
                          <SelectValue placeholder={loadingCustomers ? "Chargement..." : "Sélectionner un client"} />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.length === 0 && !loadingCustomers ? (
                            <div className="p-2 text-sm text-center text-slate-500 italic">Aucun client disponible</div>
                          ) : (
                            customers.map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name || 'Sans nom'} {c.phone ? `(${c.phone})` : ''}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Type Selector */}
              {isRestaurantValid && (
                <div className="space-y-3 bg-white p-4 rounded-xl border shadow-sm border-gray-100">
                  <Label className="text-sm font-bold text-slate-800 uppercase tracking-wider">Type de commande</Label>
                  <OrderTypeSelector value={orderType} onChange={setOrderType} />
                </div>
              )}

              {/* Conditional Fields based on Type */}
              {isRestaurantValid && (
                <div className="bg-white p-4 rounded-xl border shadow-sm border-gray-100 space-y-4">
                  {orderType === 'dine_in' ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        Sélectionner la Table <span className="text-red-500">*</span>
                      </Label>
                      <TableNumberSelector 
                        value={selectedTable} 
                        onValueChange={setSelectedTable} 
                        restaurantId={activeRestaurantId}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-500" /> Adresse de livraison <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          placeholder="Adresse complète..." 
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="bg-white border-slate-200 focus-visible:ring-blue-500 text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-500" /> Téléphone de contact <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          placeholder="Numéro pour le livreur..." 
                          value={deliveryPhone}
                          onChange={(e) => setDeliveryPhone(e.target.value)}
                          className="bg-white border-slate-200 focus-visible:ring-blue-500 text-gray-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Complimentary toggle */}
              {isRestaurantValid && (
                <div className={`space-y-3 p-4 rounded-xl border shadow-sm transition-colors ${isComplimentary ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="complimentary-mode-modal" className="text-sm font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                      <Gift className={`w-4 h-4 ${isComplimentary ? 'text-purple-600' : 'text-slate-400'}`} />
                      Offrir cette commande
                    </Label>
                    <Switch
                      id="complimentary-mode-modal"
                      checked={isComplimentary}
                      onCheckedChange={(v) => { setIsComplimentary(v); if (!v) setComplimentaryReason(''); }}
                    />
                  </div>
                  {isComplimentary && (
                    <div className="pt-2 border-t border-purple-200 space-y-1">
                      <Label className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Pour qui ? (nom de la personne)</Label>
                      <Input
                        placeholder="ex: Jean Pierre, Famille Dupont, VIP..."
                        value={complimentaryReason}
                        onChange={e => setComplimentaryReason(e.target.value)}
                        className="border-purple-200 focus:border-purple-400 bg-white"
                      />
                      <p className="text-xs text-purple-600 italic">Le stock sera déduit mais aucun paiement requis.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Cart Summary */}
              {isRestaurantValid && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <OrderSummary cart={cart} setCart={setCart} />
                </div>
              )}

            </div>

            <div className="p-4 md:p-6 bg-white border-t border-gray-200 mt-auto">
              <Button
                onClick={handleSubmit}
                className={`w-full h-14 font-bold text-lg rounded-xl shadow-md transition-all active:scale-[0.98] ${
                  isComplimentary
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : orderType === 'delivery'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'
                }`}
                disabled={cart.length === 0 || submitting || !isRestaurantValid}
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Création en cours...</>
                ) : isComplimentary ? (
                  <><Gift className="mr-2 h-6 w-6" /> Offrir la commande</>
                ) : (
                  <><Check className="mr-2 h-6 w-6" /> Confirmer la Commande</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};