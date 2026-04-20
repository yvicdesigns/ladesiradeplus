import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, X, AlertTriangle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { SoundButtonWrapper as Button } from '@/components/SoundButtonWrapper';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';
import { useSound } from '@/hooks/useSound';
import { PromotionCalculationService } from '@/lib/PromotionCalculationService';
import { PromotionBreakdownComponent } from '@/components/promotions/PromotionBreakdownComponent';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { validateRestaurantExists } from '@/lib/validateRestaurantExists';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLoyaltyDiscount } from '@/hooks/useLoyaltyDiscount';

export const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { t } = useTranslation();
  const { playSound } = useSound();
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();
  
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [activePromoCode, setActivePromoCode] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);
  
  const [stockIssues, setStockIssues] = useState([]);
  const [isValidating, setIsValidating] = useState(true);
  const [restaurantError, setRestaurantError] = useState(null);
  const { settings: loyaltySettings } = useLoyaltyDiscount();

  const deliveryFeeForCalculation = 0;
  const calculation = PromotionCalculationService.calculateOrderTotals(cart, activePromoCode, deliveryFeeForCalculation, 'delivery', loyaltySettings);

  useEffect(() => {
    const validateCartStock = async () => {
      if (cart.length === 0) {
        setIsValidating(false);
        return;
      }
      
      setIsValidating(true);
      try {
        const itemIds = cart.map(i => i.id);
        const { data, error } = await supabase
          .from('menu_items')
          .select('id, name, stock_quantity, is_available')
          .in('id', itemIds);
          
        if (error) throw error;
        
        const issues = [];
        data.forEach(dbItem => {
          const cartItem = cart.find(c => c.id === dbItem.id);
          if (!cartItem) return;
          
          if (!dbItem.is_available) {
             issues.push(t('cart.unavailable_product', { name: dbItem.name }));
          } else if (dbItem.stock_quantity !== null && cartItem.quantity > dbItem.stock_quantity) {
             issues.push(t('cart.insufficient_stock', { name: dbItem.name, count: dbItem.stock_quantity }));
             if (dbItem.stock_quantity === 0) {
                 removeFromCart(cartItem.id);
             } else {
                 updateQuantity(cartItem.id, dbItem.stock_quantity);
             }
          }
        });
        
        setStockIssues(issues);
      } catch (err) {
        console.error("Erreur lors de la validation du panier:", err);
      } finally {
        setIsValidating(false);
      }
    };
    
    validateCartStock();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length, cart.map(i => `${i.id}:${i.quantity}`).join(',')]);

  const handleUpdateQuantity = (id, qty) => {
    playSound('click');
    updateQuantity(id, qty);
  };

  const handleRemove = (id) => {
    playSound('warning');
    removeFromCart(id);
  };

  const handleApplyCode = async () => {
    if (!promoCodeInput.trim()) return;
    setLoadingCode(true);
    
    try {
        const { data, error } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', promoCodeInput.trim())
            .maybeSingle();

        if (error || !data) {
            toast({ variant: "destructive", title: t('cart.invalid_code_title'), description: t('cart.invalid_code_desc') });
            setActivePromoCode(null);
        } else {
            const validation = PromotionCalculationService.validatePromoCode(data, calculation.subtotalAfterProductDiscounts);
            if (validation.isValid) {
                setActivePromoCode(data);
                toast({ title: t('cart.code_applied_title'), description: t('cart.code_applied_desc') });
            } else {
                toast({ variant: "destructive", title: t('cart.code_not_applicable'), description: validation.error });
                setActivePromoCode(null);
            }
        }
    } catch (err) {
        console.error(err);
        toast({ variant: "destructive", title: t('cart.system_error'), description: t('cart.promo_error_desc') });
    } finally {
        setLoadingCode(false);
    }
  };

  const clearPromoCode = () => {
      setActivePromoCode(null);
      setPromoCodeInput('');
  };

  const handleProceedToCheckout = async () => {
    setIsValidating(true);
    setRestaurantError(null);
    
    // Task 4: Validate restaurant_id when user attempts checkout
    const { exists } = await validateRestaurantExists(restaurantId);
    
    if (!exists) {
      setRestaurantError(t('cart.select_restaurant'));
      setIsValidating(false);
      return;
    }
    
    navigate('/checkout', { state: { promoCode: activePromoCode } });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Helmet><title>{t('cart.title')} - La Desirade Plus</title></Helmet>
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-xs w-full">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-[#D97706]" />
          </div>
          <h2 className="text-xl font-bold text-[#111827] mb-2">{t('cart.empty_title')}</h2>
          <p className="text-[#4b5563] mb-8 text-sm">{t('cart.empty_desc')}</p>
          <Button onClick={() => navigate('/menu')} className="w-full bg-[#D97706] hover:bg-[#FCD34D] text-white rounded-xl h-12 font-bold shadow-sm" soundType="click">{t('cart.view_menu')}</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('cart.title')} - La Desirade Plus</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 pb-40 pt-4">
        <div className="container mx-auto px-4 max-w-2xl space-y-4">
          
          {restaurantError && (
             <Alert variant="destructive" className="bg-red-50 border-red-200">
               <AlertTriangle className="h-4 w-4 text-red-600" />
               <AlertTitle className="text-red-800 font-bold ml-2">{t('cart.invalid_restaurant')}</AlertTitle>
               <AlertDescription className="text-red-700 ml-2 font-medium">
                 {restaurantError}
               </AlertDescription>
             </Alert>
          )}

          {stockIssues.length > 0 && (
            <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 ml-2 font-medium">
                <ul className="list-disc pl-4 space-y-1">
                  {stockIssues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                </ul>
                <span className="block mt-2 text-xs italic">{t('cart.stock_adjusted')}</span>
              </AlertDescription>
            </Alert>
          )}

          <AnimatePresence>
            {calculation.items.map((item) => (
              <motion.div
                key={item.itemId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex gap-4"
              >
                <div className="h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  {cart.find(c => c.id === item.itemId)?.image_url && (
                    <img src={cart.find(c => c.id === item.itemId).image_url} alt={item.name} className="h-full w-full object-cover" />
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base text-[#111827] line-clamp-1">{item.name}</h3>
                    <button 
                      onClick={() => handleRemove(item.itemId)}
                      className="text-[#4b5563] hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-base ${item.hasPromo ? 'text-amber-600' : 'text-[#D97706]'}`}>
                        {formatCurrency(item.finalPricePerUnit)}
                    </p>
                    {item.hasPromo && (
                        <span className="text-xs text-gray-400 line-through">
                            {formatCurrency(item.originalPricePerUnit)}
                        </span>
                    )}
                    {item.hasPromo && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            -{item.discountPercent}%
                        </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-gray-50 rounded-lg p-1">
                      <button 
                        onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-[#111827] hover:text-[#D97706] border border-gray-200"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-[#111827]">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center bg-[#D97706] text-white rounded-md shadow-sm hover:bg-[#FCD34D]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
             <label className="text-sm font-bold text-gray-700 mb-2 block">{t('cart.promo_code_label')}</label>
             <div className="flex gap-2">
                 <div className="relative flex-1">
                     <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                     <Input
                        placeholder={t('cart.promo_placeholder')}
                        className="pl-9"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        disabled={!!activePromoCode}
                     />
                 </div>
                 {activePromoCode ? (
                     <Button variant="destructive" size="icon" onClick={clearPromoCode}>
                         <X className="w-4 h-4" />
                     </Button>
                 ) : (
                     <Button
                        onClick={handleApplyCode}
                        disabled={loadingCode || !promoCodeInput}
                        className="bg-gray-900 text-white"
                     >
                        {loadingCode ? t('common.processing') : t('common.apply')}
                     </Button>
                 )}
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-6 space-y-3">
             <PromotionBreakdownComponent calculation={calculation} />

            {calculation.loyaltyDiscountTotal > 0 && (
              <div className="flex justify-between text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                <span className="font-medium">🎁 Réduction fidélité ({loyaltySettings.percent}%)</span>
                <span className="font-bold">-{formatCurrency(calculation.loyaltyDiscountTotal)}</span>
              </div>
            )}

            <div className="flex justify-between text-[#4b5563] text-sm mt-3">
              <span>{t('cart.subtotal')} ({t('cart.after_discount')})</span>
              <span>{formatCurrency(calculation.subtotalAfterProductDiscounts)}</span>
            </div>

            <div className="flex justify-between text-[#4b5563] text-sm italic">
                <span>{t('cart.delivery_fee')}</span>
                <span>{t('cart.delivery_next_step')}</span>
            </div>

            <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-[#111827] text-sm">{t('cart.total_label')}</span>
              <span className="text-lg font-bold text-[#D97706]">{formatCurrency(calculation.finalTotal)}</span>
            </div>
            
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
          <div className="container mx-auto max-w-2xl space-y-3">
            <Button
              onClick={handleProceedToCheckout}
              disabled={isValidating}
              className="w-full bg-[#D97706] hover:bg-[#FCD34D] text-white rounded-xl h-14 font-bold text-base shadow-lg shadow-black/20 flex items-center justify-between px-6 disabled:opacity-50"
              soundType="click"
            >
              <span>{t('cart.pay')}</span>
              <div className="flex items-center gap-2">
                <span>{formatCurrency(calculation.finalTotal)}</span>
                <ArrowRight className="h-5 w-5 bg-white/20 rounded-full p-1 box-content" />
              </div>
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/menu')}
              className="w-full text-[#4b5563] hover:bg-gray-50 font-medium text-sm"
              soundType="click"
            >
              {t('cart.continue_shopping')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartPage;