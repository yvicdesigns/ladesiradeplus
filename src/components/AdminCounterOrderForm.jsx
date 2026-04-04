import React, { useState, useEffect } from 'react';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderItemSelector } from '@/components/clients/OrderItemSelector';
import { OrderSummary } from '@/components/clients/OrderSummary';
import { Loader2, Check, UserMinus, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { validateRestaurantIdBeforeOrderCreation } from '@/lib/restaurantValidation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { TableNumberSelector } from '@/components/TableNumberSelector';

export const AdminCounterOrderForm = ({ customer, onSuccess }) => {
  const { menuItems, loading, submitting, fetchMenuItems, submitOrder } = useCreateOrder();
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

  const { clients: customers, loading: loadingCustomers } = useClients({}, 1, 'all');

  const [cart, setCart] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customer?.id || '');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    const checkRestaurant = async () => {
      const validation = await validateRestaurantIdBeforeOrderCreation(restaurantId);
      if (validation.valid) {
        setValidationError(null);
        fetchMenuItems();
      } else {
        setValidationError(validation.error);
      }
    };
    checkRestaurant();
  }, [fetchMenuItems, restaurantId]);

  useEffect(() => {
    if (customer?.id && !selectedCustomerId) {
      setSelectedCustomerId(customer.id);
    }
  }, [customer, selectedCustomerId]);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast({ variant: "destructive", title: "Erreur", description: "Le panier est vide." });
      return;
    }

    if (validationError) {
      toast({ variant: "destructive", title: "Erreur", description: validationError });
      return;
    }

    const validation = await validateRestaurantIdBeforeOrderCreation(restaurantId);
    if (!validation.valid) {
       toast({ variant: "destructive", title: "Erreur", description: validation.error });
       setValidationError(validation.error);
       return;
    }

    let clientData = null;

    if (isAnonymous) {
      clientData = { name: 'Client Anonyme' };
    } else {
      if (!selectedCustomerId) {
        toast({ variant: "destructive", title: "Erreur", description: "Veuillez sélectionner un client ou activer le mode anonyme." });
        return;
      }
      clientData = customers.find(c => c.id === selectedCustomerId);
      if (!clientData && customer && customer.id === selectedCustomerId) {
        clientData = customer;
      }
    }

    const orderDetails = {
      order_type: 'dine_in',
      order_method: 'counter',
      restaurant_id: validation.restaurantId,
      table_id: selectedTableId || null
    };

    const result = await submitOrder(clientData, cart, orderDetails);

    if (result.success) {
      toast({
        title: "Commande validée",
        description: "La commande au comptoir a été créée avec succès.",
      });
      setCart([]);
      setSelectedCustomerId('');
      setSelectedTableId('');
      if (onSuccess) onSuccess(result.order);
    } else {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: result.error?.message || "Une erreur est survenue.",
      });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
      {/* Menu Selection */}
      <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="py-4 border-b bg-slate-50/50">
          <CardTitle className="text-lg">Sélection du Menu</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
          {validationError ? (
            <div className="p-6">
               <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                 <AlertCircle className="w-4 h-4 text-red-600" />
                 <AlertTitle className="font-bold text-red-800">Configuration Invalide</AlertTitle>
                 <AlertDescription>{validationError}</AlertDescription>
               </Alert>
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <OrderItemSelector menuItems={menuItems} cart={cart} setCart={setCart} />
          )}
        </CardContent>
      </Card>

      {/* Order Details & Cart */}
      <Card className="w-full lg:w-[400px] flex flex-col overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="py-4 border-b bg-slate-50/50">
          <CardTitle className="text-lg">Détails Comptoir</CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-6 bg-slate-50/30">
          {/* Customer Selection */}
          <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
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
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Associé *</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId} disabled={loadingCustomers}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
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
                    {customer && !customers.find(c => c.id === customer.id) && (
                      <SelectItem value={customer.id}>{customer.name}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {isAnonymous && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm text-slate-500 italic">La commande sera enregistrée sans associer de profil client.</p>
              </div>
            )}
          </div>

          <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
             <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Table Associée (Optionnel)</Label>
             <TableNumberSelector 
                value={selectedTableId} 
                onValueChange={setSelectedTableId} 
                restaurantId={restaurantId}
             />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <OrderSummary cart={cart} setCart={setCart} />
          </div>
        </CardContent>

        <div className="p-4 bg-white border-t border-slate-100 mt-auto">
          <Button 
            onClick={handleSubmit} 
            className="w-full h-14 font-bold text-lg rounded-xl shadow-md bg-green-600 hover:bg-green-700 text-white"
            disabled={cart.length === 0 || submitting || !!validationError}
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Création...</>
            ) : (
              <><Check className="mr-2 h-6 w-6" /> Encaisser & Lancer</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};