import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { Utensils, ArrowRight, Truck, ShoppingBag, CreditCard, Banknote, Smartphone, Loader2, CheckCircle, AlertCircle, MapPin, Search, LocateFixed, Navigation, AlertTriangle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { SoundButtonWrapper as Button } from '@/components/SoundButtonWrapper';
import { supabase } from '@/lib/customSupabaseClient';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';
import { DeliveryDistanceService } from '@/lib/DeliveryDistanceService';
import { QUARTERS } from '@/lib/BrazzavilleQuarters';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useDeliveryDistance } from '@/hooks/useDeliveryDistance';
import { OrderSummary } from '@/components/OrderSummary';
import { PaymentProofUpload } from '@/components/PaymentProofUpload';
import { PromotionCalculationService } from '@/lib/PromotionCalculationService';
import { PromotionBreakdownComponent } from '@/components/promotions/PromotionBreakdownComponent';
import { validateRestaurantIdBeforeOrderCreation } from '@/lib/restaurantValidation';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableNumberSelector } from '@/components/TableNumberSelector';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { logger } from '@/lib/logger';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const locationState = useLocation().state || {};
  const searchParams = new URLSearchParams(useLocation().search);
  const preSelectedClientId = locationState.clientId || searchParams.get('clientId');

  const { cart, clearCart, tableInfo, setDeliveryInfo, deliveryInfo: contextDeliveryInfo } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { restaurantId } = useRestaurant();
  const { submitOrder } = useCreateOrder();
  const { invalidateCache } = useOrderHistory();
  
  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState(() => tableInfo?.id ? 'restaurant' : 'delivery');
  const [restaurantError, setRestaurantError] = useState(null);
  const [isValidatingRestaurant, setIsValidatingRestaurant] = useState(true);
  const [safeRestaurantId, setSafeRestaurantId] = useState(null);
  const [feedbackState, setFeedbackState] = useState(null);
  
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [mobileMoneyType, setMobileMoneyType] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState(null);
  const [mobileMoneyConfig, setMobileMoneyConfig] = useState({ mtn: '', airtel: '' });
  const [copiedNumber, setCopiedNumber] = useState(false);

  useEffect(() => {
    supabase.from('admin_config').select('config_key, config_value').then(({ data }) => {
      if (data) {
        const cfg = data.reduce((acc, r) => { acc[r.config_key] = r.config_value; return acc; }, {});
        setMobileMoneyConfig({ mtn: cfg.mtn_mobile_money || '', airtel: cfg.airtel_mobile_money || '' });
      }
    });
  }, []);

  const handleCopyMobileNumber = (number) => {
    navigator.clipboard.writeText(number).then(() => {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    });
  };

  const [activePromoCode, setActivePromoCode] = useState(locationState.promoCode || null);

  const [locationMode, setLocationMode] = useState('address');
  const [addressInput, setAddressInput] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');

  const { loading: distanceLoading, distanceInfo, calculateFees, setDistanceInfo } = useDeliveryDistance();
  const { location: gpsLocation, loading: gpsLoading, requestLocation } = useGeoLocation();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: 'Brazzaville',
    email: '',
    tableId: tableInfo?.id || '',
    source_client: 'app'
  });

  // Si tableInfo apparaît après le montage (navigation depuis QR), sync
  useEffect(() => {
    if (tableInfo?.id) {
      setOrderType('restaurant');
      setFormData(prev => ({ ...prev, tableId: tableInfo.id }));
    }
  }, [tableInfo?.id]);
  
  const [errors, setErrors] = useState({});

  const deliveryFee = useMemo(() => distanceInfo?.fee || 0, [distanceInfo]);
  
  // Calculate final totals - Pass orderType specifically to avoid phantom delivery fees on 'restaurant' orders
  const calculation = useMemo(() => {
     return PromotionCalculationService.calculateOrderTotals(cart, activePromoCode, deliveryFee, orderType);
  }, [cart, activePromoCode, deliveryFee, orderType]);

  useEffect(() => {
    const checkRestaurantId = async () => {
      setIsValidatingRestaurant(true);
      const validation = await validateRestaurantIdBeforeOrderCreation(restaurantId);
      if (validation.valid) {
        setSafeRestaurantId(validation.restaurantId);
        setRestaurantError(null);
      } else {
        setRestaurantError(validation.error);
        toast({ variant: 'destructive', title: 'Erreur', description: validation.error });
      }
      setIsValidatingRestaurant(false);
    };
    checkRestaurantId();
  }, [restaurantId, toast]);

  useEffect(() => {
    if (preSelectedClientId) {
       const fetchClient = async () => {
          const { data, error } = await supabase.from('customers').select('*').eq('id', preSelectedClientId).single();
          if (data && !error) {
             setFormData(prev => ({
                ...prev,
                fullName: data.name || prev.fullName,
                phone: data.phone || prev.phone,
                email: data.email || prev.email,
                address: data.address || prev.address,
                source_client: data.source_client || 'app'
             }));
             if (data.address) {
                setAddressInput(data.address);
                setLocationMode('address');
             }
             toast({ title: "Client sélectionné", description: `Informations de ${data.name || 'ce client'} pré-remplies.` });
          }
       };
       fetchClient();
    }
  }, [preSelectedClientId, toast]);

  useEffect(() => {
    if (contextDeliveryInfo && !distanceInfo.distance && !preSelectedClientId) {
      setDistanceInfo(contextDeliveryInfo);
      if (contextDeliveryInfo.method === 'address') {
        setLocationMode('address');
        setAddressInput(contextDeliveryInfo.address);
      } else if (contextDeliveryInfo.method === 'quarter') {
        setLocationMode('quarter');
        setSelectedQuarter(contextDeliveryInfo.quarterName);
      } else if (contextDeliveryInfo.method === 'gps') {
        setLocationMode('gps');
      }
    }
  }, [contextDeliveryInfo, setDistanceInfo, distanceInfo.distance, preSelectedClientId]);

  useEffect(() => {
    if (distanceInfo && distanceInfo.isAvailable) {
      setDeliveryInfo(distanceInfo);
    }
  }, [distanceInfo, setDeliveryInfo]);

  useEffect(() => {
    if (user && !preSelectedClientId) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('profiles').select('full_name, phone, email').eq('user_id', user.id).maybeSingle();
        if (data) {
          setFormData(prev => ({
            ...prev, fullName: data.full_name || prev.fullName, phone: data.phone || prev.phone, email: data.email || user.email || prev.email
          }));
        } else {
            setFormData(prev => ({ ...prev, email: user.email || '' }));
        }
      };
      fetchProfile();
    }
  }, [user, preSelectedClientId]);

  useEffect(() => {
    const handleGPSLogic = async () => {
      if (gpsLocation) {
        const dist = DeliveryDistanceService.getDistanceFromNkombo(gpsLocation);
        const feeInfo = DeliveryDistanceService.calculateDeliveryFeeByDistance(dist);
        
        const result = {
          ...feeInfo,
          distance: parseFloat(dist.toFixed(2)),
          address: "Position GPS détectée avec précision",
          method: 'gps',
          coordinates: gpsLocation,
          quarterName: null
        };
        
        setDistanceInfo(result);
        if (result.isAvailable) {
          toast({ title: "Position Détectée", description: `Distance estimée : ${result.distance} km (Zone : ${result.tier})` });
        } else {
           toast({ variant: "destructive", title: "Livraison Impossible", description: result.message });
        }
      }
    };
    if (gpsLocation) handleGPSLogic();
  }, [gpsLocation, toast, setDistanceInfo]);

  const handleLocateAddress = async () => {
    if (!addressInput.trim()) {
      toast({ variant: "destructive", title: "Adresse Requise", description: "Veuillez renseigner une adresse complète." });
      return;
    }
    const result = await calculateFees(addressInput);
    if (result && result.isAvailable) {
       toast({ title: "Adresse Validée", description: `Distance : ${result.distance} km | Frais calculés : ${formatCurrency(result.fee)}` });
    } else if (result) {
       toast({ variant: "destructive", title: "Zone Non Desservie", description: result.message });
    }
  };

  const handleQuarterSelect = async (quarterName) => {
    setSelectedQuarter(quarterName);
    try {
      const result = await DeliveryDistanceService.calculateFeeFromQuarter(quarterName);
      if (result) {
        const finalResult = { ...result, method: 'quarter' };
        setDistanceInfo(finalResult);
        toast({ title: "Quartier Enregistré", description: `Distance estimée : ${result.distance} km | Frais : ${formatCurrency(result.fee)}` });
      } else {
        toast({ variant: "destructive", title: "Erreur Système", description: "Impossible de calculer les frais de livraison pour ce quartier." });
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Erreur Inattendue", description: "Une erreur est survenue lors de la sélection du quartier." });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (orderType === 'delivery') {
      if (!formData.fullName || !formData.fullName.trim()) newErrors.fullName = t('checkout.form_incomplete');
      if (!formData.phone || !formData.phone.trim()) newErrors.phone = t('checkout.form_incomplete');
      if (!distanceInfo || !distanceInfo.isAvailable || distanceInfo.distance === null) newErrors.location = "Veuillez confirmer une adresse de livraison valide.";
    } else if (orderType === 'restaurant') {
      if (!formData.tableId) newErrors.tableId = "Veuillez sélectionner une table.";
    } else if (orderType === 'takeaway') {
      if (!formData.fullName || !formData.fullName.trim()) newErrors.fullName = t('checkout.form_incomplete');
      if (!formData.phone || !formData.phone.trim()) newErrors.phone = t('checkout.form_incomplete');
    }

    if (paymentMethod === 'mobile_money') {
      if (!mobileMoneyType) newErrors.mobileMoney = t('checkout.choose_operator');
      if (!paymentProofUrl) newErrors.paymentProof = "Le téléchargement d'une preuve de paiement est obligatoire.";
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    if (!isValid) {
        const msg = newErrors.location ? newErrors.location : newErrors.tableId ? newErrors.tableId : t('checkout.check_fields');
        toast({ variant: "destructive", title: t('checkout.form_incomplete'), description: msg });
    }
    return isValid;
  };

  const handleConfirmOrder = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: t('checkout.login_required'), description: t('checkout.login_desc') });
      navigate('/login');
      return;
    }

    if (cart.length === 0) return;
    if (!validateForm()) return;

    if (restaurantError || !safeRestaurantId) {
       toast({ variant: 'destructive', title: "Action impossible", description: "Le restaurant sélectionné est invalide ou n'existe pas." });
       return;
    }

    setLoading(true);
    setFeedbackState("Initialisation de la transaction atomique...");

    // Formatting payload for useCreateOrder
    // Ensure we do NOT pass a delivery_fee or distances to the DB if it is a restaurant order
    const isDelivery = orderType === 'delivery';
    const finalDeliveryFee = isDelivery ? calculation.deliveryFee : 0;
    
    const orderDetails = {
       restaurant_id: safeRestaurantId,
       order_type: orderType === 'takeaway' ? 'restaurant' : orderType,
       order_method: orderType === 'takeaway' ? 'takeaway' : (orderType === 'restaurant' ? 'dine_in' : 'online'),
       table_id: orderType === 'restaurant' ? formData.tableId : null,
       delivery_phone: isDelivery ? formData.phone : null,
       delivery_address: isDelivery ? distanceInfo?.address : null,
       product_discount_total: calculation.productDiscountTotal,
       promo_code_discount_total: calculation.promoCodeDiscountTotal,
       promo_code_id: activePromoCode ? activePromoCode.id : null,
       discount_breakdown: calculation.breakdown,
       payment_method: paymentMethod,
       mobile_money_type: paymentMethod === 'mobile_money' ? mobileMoneyType : null,
       payment_screenshot_url: paymentMethod === 'mobile_money' ? paymentProofUrl : null,
       delivery_fee: finalDeliveryFee,
       estimated_delivery_time_text: (isDelivery && distanceInfo?.distance) ? `${30 + Math.ceil(distanceInfo.distance * 2)} mins` : null,
       distance_km: isDelivery ? (distanceInfo?.distance || 0) : 0,
       calculated_delivery_fee: finalDeliveryFee,
       quarter_name: isDelivery ? distanceInfo?.quarterName : null,
       finalTotal: calculation.finalTotal
    };

    const client = {
       id: preSelectedClientId,
       user_id: user.id,
       name: formData.fullName || user.email,
       phone: formData.phone,
       email: formData.email || user.email
    };

    setFeedbackState("Traitement sécurisé de la commande...");
    
    // Utilize atomic RPC transaction process
    const itemsPayload = calculation.items.map(i => ({...i, id: i.itemId, price: i.finalPricePerUnit}));
    const result = await submitOrder(client, itemsPayload, orderDetails);
    
    if (result.success) {
      logger.info(`[CheckoutPage] Successful checkout, navigating to confirmation. Order ID: ${result.order.id}`);
      setFeedbackState("Commande validée avec succès !");
      invalidateCache(); // Clear history cache
      
      const orderedItems = [...cart];
      clearCart();
      
      navigate(`/order-confirmation/${result.order.id}`, { replace: true, state: { order: result.order, type: orderType, items: orderedItems, deliveryInfo: distanceInfo, calculation } });
    } else {
      logger.error(`[CheckoutPage] Checkout failed. No valid order ID generated.`);
      setFeedbackState(null);
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('checkout.title')} - La Desirade Plus</title>
      </Helmet>

      <div className="min-h-screen bg-[#ffffff] pb-24">
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 mb-6">
           <div className="container mx-auto max-w-5xl flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2" soundType="click">
                 <ArrowRight className="w-5 h-5 rotate-180" />
              </Button>
              <h1 className="text-lg font-bold">{t('checkout.title')}</h1>
           </div>
        </div>

        <main className="container mx-auto max-w-5xl px-4">
          
          {isValidatingRestaurant && (
            <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="font-medium">Vérification de la configuration du restaurant...</span>
            </div>
          )}

          {restaurantError && !isValidatingRestaurant && (
             <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
               <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
               <AlertTitle className="text-red-800 font-bold ml-2">Impossible de commander</AlertTitle>
               <AlertDescription className="text-red-700 ml-2 font-medium mt-1">
                 {restaurantError}
               </AlertDescription>
             </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4">{t('checkout.order_type')}</h3>
                <Tabs value={orderType} onValueChange={(val) => { setOrderType(val); setErrors({}); }} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-14 bg-gray-100 rounded-xl p-1">
                    <TabsTrigger value="delivery" className="h-full rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#D97706] data-[state=active]:shadow-sm font-bold gap-2">
                      <Truck className="h-4 w-4" /> {t('checkout.delivery')}
                    </TabsTrigger>
                    <TabsTrigger value="restaurant" className="h-full rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#D97706] data-[state=active]:shadow-sm font-bold gap-2">
                      <Utensils className="h-4 w-4" /> {t('checkout.dine_in')}
                    </TabsTrigger>
                    <TabsTrigger value="takeaway" className="h-full rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#D97706] data-[state=active]:shadow-sm font-bold gap-2">
                      <ShoppingBag className="h-4 w-4" /> À emporter
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {orderType === 'delivery' ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-[#D97706]" /> {t('checkout.delivery_info')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t('checkout.full_name')}</Label>
                      <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className={errors.fullName ? "border-red-500" : ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('checkout.phone')}</Label>
                      <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={errors.phone ? "border-red-500" : ""} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-dashed mt-2">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                       <Label className="text-sm font-bold">Adresse de Livraison Détaillée</Label>
                       <div className="flex gap-2 text-xs">
                          <button className={`px-2 py-1 rounded hover:bg-gray-100 ${locationMode === 'address' ? 'text-amber-600 font-bold' : 'text-gray-500'}`} onClick={() => setLocationMode('address')}>Recherche Libre</button>
                          <span className="text-gray-300">|</span>
                          <button className={`px-2 py-1 rounded hover:bg-gray-100 ${locationMode === 'quarter' ? 'text-amber-600 font-bold' : 'text-gray-500'}`} onClick={() => setLocationMode('quarter')}>Sélection par Quartier</button>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <Button type="button" variant="outline" onClick={() => { setLocationMode('gps'); requestLocation(); }} disabled={gpsLoading || distanceLoading} className={`w-full h-12 flex items-center justify-center gap-2 border-2 ${locationMode === 'gps' ? 'border-green-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`} soundType="click">
                         {gpsLoading || (locationMode === 'gps' && distanceLoading) ? <><Loader2 className="w-4 h-4 animate-spin" /> Localisation en cours de traitement...</> : <><LocateFixed className="w-4 h-4" /> 📍 Utiliser ma Position GPS Actuelle</>}
                      </Button>

                      <div className="relative">
                         {locationMode !== 'gps' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="bg-white px-2 text-xs text-gray-400 font-medium">OU</span></div>}
                         <div className="border-t border-gray-100 my-2"></div>
                      </div>

                      {locationMode === 'address' ? (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                          <div className="relative flex-1">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input placeholder="Saisissez votre adresse ou point de repère précis..." className={`pl-9 ${errors.location && (!distanceInfo || !distanceInfo.distance) ? 'border-red-500' : ''}`} value={addressInput} onChange={(e) => { setAddressInput(e.target.value); if (distanceInfo && distanceInfo.distance) setDistanceInfo({ ...distanceInfo, distance: null, fee: 0, isAvailable: false }); }} />
                          </div>
                          <Button onClick={handleLocateAddress} disabled={distanceLoading || !addressInput} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]" soundType="click">
                            {distanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2"/> Analyser</>}
                          </Button>
                        </div>
                      ) : locationMode === 'quarter' ? (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                          <Select onValueChange={handleQuarterSelect} value={selectedQuarter}>
                            <SelectTrigger className={errors.location && (!distanceInfo || !distanceInfo.distance) ? 'border-red-500' : ''}><SelectValue placeholder="Parcourez et sélectionnez votre quartier" /></SelectTrigger>
                            <SelectContent className="max-h-60">{QUARTERS.map(q => <SelectItem key={q.id} value={q.name}>{q.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ) : null}
                    </div>

                    {distanceInfo && distanceInfo.distance !== null && (
                      <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${distanceInfo.isAvailable ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                        {distanceInfo.isAvailable ? <CheckCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                           <h4 className={`text-sm font-bold ${distanceInfo.isAvailable ? 'text-amber-900' : 'text-red-900'}`}>{distanceInfo.isAvailable ? 'Service de Livraison Disponible' : 'Zone Géographique Non Desservie'}</h4>
                           <div className="mt-1 text-sm space-y-1">
                              {distanceInfo.address && <p className="font-medium text-gray-700">{distanceInfo.address}</p>}
                              <div className="flex flex-col gap-1 text-sm mt-2">
                                 <div className="flex items-center gap-2"><Navigation className="h-4 w-4 text-blue-600" /><span>Distance Approximative : <strong>{distanceInfo.distance} km</strong> | Frais Estimés : <strong>{formatCurrency(distanceInfo.fee)}</strong></span></div>
                                 <span className="text-xs text-gray-500">Classification de Zone : {distanceInfo.tier}</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : orderType === 'restaurant' ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-[#D97706]" /> {t('checkout.restaurant_info')}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="tableId" className={errors.tableId ? "text-red-500" : ""}>Numéro de Table</Label>
                    <div className={errors.tableId ? "ring-2 ring-red-500 rounded-md" : ""}>
                      <TableNumberSelector
                        value={formData.tableId}
                        onValueChange={(val) => setFormData({...formData, tableId: val})}
                        restaurantId={safeRestaurantId}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#D97706]" /> Informations de retrait
                  </h3>
                  <p className="text-sm text-muted-foreground">Votre commande sera prête à récupérer au restaurant. Nous vous contacterons quand elle sera prête.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className={errors.fullName ? "text-red-500" : ""}>{t('checkout.full_name')}</Label>
                      <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className={errors.fullName ? "border-red-500" : ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className={errors.phone ? "text-red-500" : ""}>{t('checkout.phone')}</Label>
                      <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={errors.phone ? "border-red-500" : ""} />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                 <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#D97706]" /> {t('checkout.payment_method')}
                  </h3>
                  
                  <RadioGroup value={paymentMethod} onValueChange={(val) => { setPaymentMethod(val); setErrors({}); }}>
                    <div className={`flex items-start space-x-3 border p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cash_on_delivery' ? 'border-[#D97706] bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <RadioGroupItem value="cash_on_delivery" id="pay-cash" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="pay-cash" className="cursor-pointer font-bold block">{orderType === 'delivery' ? t('checkout.pay_on_delivery') : t('checkout.pay_at_counter')}</Label>
                      </div>
                      <Banknote className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className={`flex flex-col border rounded-xl transition-all overflow-hidden ${paymentMethod === 'mobile_money' ? 'border-[#D97706] bg-amber-50/50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-start space-x-3 p-4 cursor-pointer" onClick={() => setPaymentMethod('mobile_money')}>
                        <RadioGroupItem value="mobile_money" id="pay-mm" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="pay-mm" className="cursor-pointer font-bold block">{t('checkout.pay_mobile_money')}</Label>
                        </div>
                        <Smartphone className="h-5 w-5 text-gray-400" />
                      </div>

                      {paymentMethod === 'mobile_money' && (
                         <div className="px-4 pb-4 space-y-6 animate-in slide-in-from-top-2 border-t mt-2 pt-4 bg-white/50">
                            <div className="space-y-3">
                              <Label className="text-sm font-bold text-gray-700 block">{t('checkout.choose_operator')}</Label>
                              <div className="grid grid-cols-2 gap-4">
                                <div onClick={() => setMobileMoneyType('mtn')} className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 flex flex-col items-center gap-3 text-center ${mobileMoneyType === 'mtn' ? 'border-[#ffcc00] bg-[#ffcc00]/10 shadow-md ring-1 ring-[#ffcc00]' : 'border-gray-100 bg-white hover:border-[#ffcc00]/50'}`}>
                                  <div className={`p-3 rounded-full transition-colors ${mobileMoneyType === 'mtn' ? 'bg-[#ffcc00] text-black' : 'bg-gray-100 text-gray-500'}`}><Smartphone className="h-6 w-6" /></div>
                                  <span className="block font-bold text-sm">MTN Mobile Money</span>
                                </div>

                                <div onClick={() => setMobileMoneyType('airtel')} className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 flex flex-col items-center gap-3 text-center ${mobileMoneyType === 'airtel' ? 'border-[#ff0000] bg-[#ff0000]/5 shadow-md ring-1 ring-[#ff0000]' : 'border-gray-100 bg-white hover:border-[#ff0000]/30'}`}>
                                  <div className={`p-3 rounded-full transition-colors ${mobileMoneyType === 'airtel' ? 'bg-[#ff0000] text-white' : 'bg-gray-100 text-gray-500'}`}><Smartphone className="h-6 w-6" /></div>
                                  <span className="block font-bold text-sm">Airtel Money</span>
                                </div>
                              </div>
                            </div>
                             {mobileMoneyType && (
                                <>
                                  {/* Numéro + bouton copier */}
                                  <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${mobileMoneyType === 'mtn' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">{mobileMoneyType === 'mtn' ? 'Numéro MTN Mobile Money' : 'Numéro Airtel Money'}</p>
                                      <span className={`text-xl font-mono font-bold tracking-widest ${mobileMoneyType === 'mtn' ? 'text-yellow-700' : 'text-red-700'}`}>
                                        {mobileMoneyType === 'mtn' ? mobileMoneyConfig.mtn : mobileMoneyConfig.airtel}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyMobileNumber(mobileMoneyType === 'mtn' ? mobileMoneyConfig.mtn : mobileMoneyConfig.airtel)}
                                      className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg transition-all ${copiedNumber ? 'bg-green-100 text-green-700' : mobileMoneyType === 'mtn' ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300' : 'bg-red-200 text-red-800 hover:bg-red-300'}`}
                                    >
                                      {copiedNumber ? '✓ Copié !' : '📋 Copier'}
                                    </button>
                                  </div>

                                  {/* Instructions étape par étape */}
                                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                                    <p className="text-sm font-bold text-gray-800">Comment procéder :</p>
                                    {mobileMoneyType === 'mtn' ? (
                                      <ol className="space-y-2 text-sm text-gray-700">
                                        <li className="flex gap-2 items-start"><span className="font-bold text-yellow-600 flex-shrink-0 bg-yellow-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>Composez <span className="font-mono font-bold mx-1">*105#</span> sur votre téléphone MTN</li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-yellow-600 flex-shrink-0 bg-yellow-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>Sélectionnez <span className="font-semibold mx-1">1 — Envoi d'argent</span></li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-yellow-600 flex-shrink-0 bg-yellow-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>Sélectionnez <span className="font-semibold mx-1">1 — Abonné Mobile Money</span></li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-yellow-600 flex-shrink-0 bg-yellow-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>Entrez le numéro : <span className="font-mono font-bold mx-1">{mobileMoneyConfig.mtn}</span></li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-yellow-600 flex-shrink-0 bg-yellow-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">5</span>Entrez le montant à envoyer</li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-yellow-600 flex-shrink-0 bg-yellow-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">6</span>Cliquez sur <span className="font-semibold mx-1">Envoyer / Send</span></li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-yellow-600 flex-shrink-0 bg-yellow-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">7</span>Prenez une capture d'écran du SMS et uploadez-la ci-dessous</li>
                                      </ol>
                                    ) : (
                                      <ol className="space-y-2 text-sm text-gray-700">
                                        <li className="flex gap-2 items-start"><span className="font-bold text-red-600 flex-shrink-0 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>Composez <span className="font-mono font-bold mx-1">*128#</span> sur votre téléphone Airtel</li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-red-600 flex-shrink-0 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>Sélectionnez <span className="font-semibold mx-1">2 — Envoyer / Retirer Argent</span></li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-red-600 flex-shrink-0 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>Sélectionnez <span className="font-semibold mx-1">1 — Envoyer de l'argent</span></li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-red-600 flex-shrink-0 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>Sélectionnez <span className="font-semibold mx-1">1 — Airtel Money</span></li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-red-600 flex-shrink-0 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">5</span>Saisissez le numéro : <span className="font-mono font-bold mx-1">{mobileMoneyConfig.airtel}</span></li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-red-600 flex-shrink-0 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">6</span>Saisissez le montant</li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-red-600 flex-shrink-0 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">7</span>Entrez votre <span className="font-semibold mx-1">code PIN</span></li>
                                        <li className="flex gap-2 items-start"><span className="font-bold text-red-600 flex-shrink-0 bg-red-100 rounded-full w-5 h-5 flex items-center justify-center text-xs">8</span>Prenez une capture d'écran du SMS et uploadez-la ci-dessous</li>
                                      </ol>
                                    )}
                                  </div>

                                  <div className="space-y-3 pt-2">
                                    <Label className="text-sm font-bold text-gray-700">Preuve de Paiement Valide (Obligatoire)</Label>
                                    <PaymentProofUpload onUploadSuccess={(url) => setPaymentProofUrl(url)} onRemove={() => setPaymentProofUrl(null)} initialUrl={paymentProofUrl} />
                                  </div>
                                </>
                             )}
                         </div>
                      )}
                    </div>
                  </RadioGroup>
              </div>

            </div>

            <div className="lg:col-span-5 space-y-4">
              <OrderSummary 
                cart={calculation.items.map(i => ({...i, id: i.itemId, price: i.finalPricePerUnit}))} 
                subtotal={calculation.subtotalAfterProductDiscounts} 
                deliveryFee={calculation.deliveryFee} 
                total={calculation.finalTotal} 
                orderType={orderType}
              />
              
              <PromotionBreakdownComponent calculation={calculation} />

              <div className="mt-6 sticky top-24">
                <Button
                  onClick={handleConfirmOrder}
                  disabled={loading || isValidatingRestaurant || !!restaurantError || (paymentMethod === 'mobile_money' && !paymentProofUrl) || (orderType === 'delivery' && (!distanceInfo || !distanceInfo.isAvailable))}
                  className="w-full bg-[#D97706] hover:bg-[#FCD34D] text-white rounded-xl h-14 font-bold text-base shadow-xl shadow-[#D97706]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  isLoading={loading}
                  soundType="order_placed"
                >
                  {loading ? (feedbackState || t('checkout.processing')) : `${t('checkout.confirm_btn')} (${formatCurrency(calculation.finalTotal)})`} 
                </Button>
                <p className="text-center text-[11px] text-gray-400 mt-3">{t('checkout.terms')}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CheckoutPage;