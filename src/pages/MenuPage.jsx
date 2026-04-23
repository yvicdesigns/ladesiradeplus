import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, ShoppingCart, MapPin, Search, Plus, Utensils, 
  Pizza, Coffee, Star, MessageSquarePlus, 
  AlertTriangle, RefreshCw, AlertCircle, Bug, ChevronDown, ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { SoundButtonWrapper as Button } from '@/components/SoundButtonWrapper';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';
import { useSound } from '@/hooks/useSound';
import { PromoBanner } from '@/components/PromoBanner';
import { useProductsWithRetry } from '@/hooks/useProductsWithRetry';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { ReviewModal } from '@/components/ReviewModal';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { getValidatedRestaurantId } from '@/lib/restaurantValidation';

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1701540747558-5513a8812dda",
  "https://images.unsplash.com/photo-1701540747569-46bf364bbbb0",
  "https://images.unsplash.com/photo-1696382194253-95fc72d14446"
];

// Using simple fetch queries for better performance instead of realtime subscriptions
export const MenuPage = () => {
  const navigate = useNavigate();
  const { addToCart, getItemCount } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { playSound } = useSound();
  const { restaurantId, settings: restaurantSettings } = useRestaurant();
  const cartCount = getItemCount();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const restaurantLocation = {
    address: restaurantSettings?.restaurant_address || '',
    city: restaurantSettings?.restaurant_city || '',
  };
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const [reviews, setReviews] = useState([]);

  const renderCountRef = useRef(0);
  renderCountRef.current++;

  // --- Network & Connection ---
  const { isConnected } = useConnectionStatus();

  // --- Data Fetching with Robust Retry ---
  const { 
    categories: fetchedCategories, 
    products: menuItems, 
    loading: itemsLoading, 
    error: fetchError, 
    retry, 
    isRetrying,
    retryCount
  } = useProductsWithRetry(); 

  // Simple one-time fetch for reviews instead of realtime subscription
  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        const validRestaurantId = getValidatedRestaurantId(restaurantId);

        const { data, error } = await supabase
          .from('reviews')
          .select('rating, menu_item_id')
          .eq('status', 'approved')
          .eq('restaurant_id', validRestaurantId);
        
        if (error) throw error;
        if (isMounted && data) {
          setReviews(data);
        }
      } catch (err) {
        logger.error('Error fetching reviews:', err);
      }
    };
    fetchReviews();
    return () => { isMounted = false; };
  }, [restaurantId]);

  useEffect(() => {
    logger.info('Page mounted: MenuPage', 'User:', user?.email || 'Guest');
  }, [user]);

  // --- Diagnostic Calculation ---
  const diagnostics = useMemo(() => {
    const totalItems = menuItems.length;
    const itemsMissingImage = menuItems.filter(i => !i.image_url).length;
    const itemsMissingPrice = menuItems.filter(i => i.price === null || i.price === undefined).length;
    const unavailableItems = menuItems.filter(i => !i.is_available).length;
    const itemsWithoutCategory = menuItems.filter(i => !i.category_id).length;
    const outOfStockItems = menuItems.filter(i => i.stock_quantity !== null && i.stock_quantity <= 0).length;

    return {
      totalItems,
      totalCategories: fetchedCategories.length,
      itemsMissingImage,
      itemsMissingPrice,
      unavailableItems,
      itemsWithoutCategory,
      outOfStockItems
    };
  }, [menuItems, fetchedCategories]);

  // --- Data Processing (Strict Categorization) ---
  const { processedCategories, itemsByCategory } = useMemo(() => {
    logger.debug(`[MenuPage] Grouping items...`);
    const validCatIds = new Set(fetchedCategories.map(c => c.id));
    const itemsGrouped = { all: [] };
    
    menuItems.forEach(item => {
      // Include in 'all'
      itemsGrouped['all'].push(item);
      
      // Categorize
      if (item.category_id && validCatIds.has(item.category_id)) {
          if (!itemsGrouped[item.category_id]) itemsGrouped[item.category_id] = [];
          itemsGrouped[item.category_id].push(item);
      }
    });
    
    const finalCategories = [...fetchedCategories].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    return { processedCategories: finalCategories, itemsByCategory: itemsGrouped };
  }, [menuItems, fetchedCategories]);

  useEffect(() => {
    if (selectedCategory !== 'all' && processedCategories.length > 0) {
      const catExists = processedCategories.some(c => c.id === selectedCategory);
      if (!catExists) setSelectedCategory('all');
    }
  }, [processedCategories, selectedCategory]);

  // --- Ratings ---
  const itemRatings = useMemo(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) return {};
    const ratings = {}; 
    reviews.forEach(review => {
      if (!review.menu_item_id) return;
      if (!ratings[review.menu_item_id]) ratings[review.menu_item_id] = { sum: 0, count: 0 };
      ratings[review.menu_item_id].sum += review.rating;
      ratings[review.menu_item_id].count += 1;
    });
    Object.keys(ratings).forEach(id => {
      ratings[id].average = (ratings[id].sum / ratings[id].count).toFixed(1);
    });
    return ratings;
  }, [reviews]);

  // --- Handlers ---
  const getDiscountedPrice = useCallback((price, discount) => {
    if (!discount || discount <= 0) return price;
    return price * (1 - discount / 100);
  }, []);

  const handleAddToCart = useCallback(async (e, item) => {
    e.stopPropagation();
    if (item.stock_quantity !== null && item.stock_quantity <= 0) {
       toast({ variant: "destructive", title: "Produit Épuisé", description: "Désolé, ce produit n'est plus disponible." });
       return;
    }
    const added = await addToCart({ ...item }); 
    if (added) {
        playSound('success'); 
        toast({ variant: "success", title: t('menu.added_to_cart'), description: `${item.name} a été ajouté à votre panier.`, duration: 3000 });
    }
  }, [addToCart, playSound, toast, t]);

  const openReviewModal = useCallback((e, item) => {
    e.stopPropagation();
    setReviewItem(item);
    setIsReviewModalOpen(true);
  }, []);

  const handleCategoryClick = useCallback((catId) => {
    playSound('click');
    setSelectedCategory(catId);
  }, [playSound]);

  // --- Rendering Prep ---
  const filteredItems = useMemo(() => {
    return itemsByCategory[selectedCategory] || [];
  }, [itemsByCategory, selectedCategory]);

  const getItemImage = useCallback((item, index) => {
    if (item.image_url) return item.image_url;
    if (index < 3 && selectedCategory === 'all') return PLACEHOLDER_IMAGES[index];
    return PLACEHOLDER_IMAGES[0];
  }, [selectedCategory]);

  const handleImageError = useCallback((e) => {
    e.target.onerror = null; 
    e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop"; 
  }, []);

  const getCategoryIcon = useCallback((cat) => {
    const name = cat.name?.toLowerCase() || '';
    if (name.includes('pizza')) return <Pizza className="w-4 h-4" />;
    if (name.includes('burger')) return <div className="w-4 h-4">🍔</div>;
    if (name.includes('drink') || name.includes('boisson')) return <Coffee className="w-4 h-4" />;
    return <Utensils className="w-4 h-4" />;
  }, []);

  const hasLocation = restaurantLocation.address || restaurantLocation.city;
  const displayAddress = hasLocation ? [restaurantLocation.address, restaurantLocation.city].filter(Boolean).join(', ') : "Localisation non configurée";

  return (
    <>
      <Helmet>
        <title>{t('menu.title')} - La Desirade Plus</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 font-sans">
        
        {/* Diagnostic Panel */}
        <AnimatePresence>
          {showDebug && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-slate-900 text-slate-300 text-xs px-4"
            >
              <div className="py-4 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
                  <h3 className="font-bold text-slate-100 flex items-center gap-2">
                    <Bug className="w-4 h-4" /> Menu Diagnostics
                  </h3>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-slate-400 hover:text-white" onClick={() => setShowDebug(false)}>
                    {t('common.close')}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800 p-2 rounded">
                    <span className="block text-slate-400">Total Items</span>
                    <span className="font-mono text-lg text-white">{diagnostics.totalItems}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <span className="block text-slate-400">Categories</span>
                    <span className="font-mono text-lg text-white">{diagnostics.totalCategories}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <span className="block text-slate-400">Missing Images</span>
                    <span className={`font-mono text-lg ${diagnostics.itemsMissingImage > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{diagnostics.itemsMissingImage}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <span className="block text-slate-400">Missing Prices</span>
                    <span className={`font-mono text-lg ${diagnostics.itemsMissingPrice > 0 ? 'text-red-400' : 'text-green-400'}`}>{diagnostics.itemsMissingPrice}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <span className="block text-slate-400">Unavailable</span>
                    <span className="font-mono text-lg text-white">{diagnostics.unavailableItems}</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <span className="block text-slate-400">No Category</span>
                    <span className={`font-mono text-lg ${diagnostics.itemsWithoutCategory > 0 ? 'text-yellow-400' : 'text-white'}`}>{diagnostics.itemsWithoutCategory}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-gray-50 px-4 py-4 mt-2">
          <div className="bg-white rounded-2xl p-4 flex items-center shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <MapPin className="w-5 h-5 text-[#D97706]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[#4b5563] font-medium uppercase tracking-wide">{t('menu.location')}</span>
              <span className="text-xs font-semibold text-[#111827] break-words">{displayAddress}</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="relative" onClick={() => navigate('/search')}>
            <Input 
              placeholder={t('menu.search_placeholder')}
              className="pl-4 pr-12 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-[#D97706] focus:ring-[#D97706] text-[#4b5563] text-sm pointer-events-none"
              readOnly
            />
            <Search className="absolute right-4 top-3.5 h-5 w-5 text-[#4b5563]" />
          </div>
        </div>

        <div className="px-4 py-4"><PromoBanner /></div>

        {/* ERROR STATE WITH FALLBACK UI */}
        {fetchError && !itemsLoading && (
           <div className="px-4 py-2 mb-4">
             <Alert variant="destructive" className="border-red-200 bg-white">
               <AlertCircle className="h-5 w-5" />
               <AlertTitle>{t('menu.connection_error')}</AlertTitle>
               <AlertDescription className="flex flex-col mt-2">
                 <span className="text-sm text-gray-600 mb-3">{t('menu.load_error_desc')} {retryCount >= 3 ? t('menu.max_retries') : ""}</span>
                 <Button onClick={retry} disabled={isRetrying} className="bg-red-600 hover:bg-red-700 text-white self-start">
                   <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                   {isRetrying ? t('menu.retrying') : t('menu.force_reconnect')}
                 </Button>
               </AlertDescription>
             </Alert>
           </div>
        )}

        {/* LOADING SKELETON */}
        {itemsLoading && processedCategories.length === 0 && !fetchError ? (
          <div className="px-4 space-y-6">
            <div className="flex gap-3 overflow-hidden">
              <Skeleton className="h-10 w-24 rounded-xl flex-shrink-0" />
              <Skeleton className="h-10 w-32 rounded-xl flex-shrink-0" />
              <Skeleton className="h-10 w-28 rounded-xl flex-shrink-0" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex justify-between items-center pt-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* CATEGORIES SECTION */}
            {processedCategories.length > 0 && (
              <div className="py-2">
                <div className="px-4 mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#111827]">{t('menu.categories')}</h3>
                </div>
                <div className="flex overflow-x-auto px-4 gap-3 no-scrollbar pb-2">
                  <button
                    onClick={() => handleCategoryClick('all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all flex-shrink-0 border ${
                      selectedCategory === 'all'
                        ? 'bg-[#D97706] text-white border-[#D97706] shadow-md shadow-black/20'
                        : 'bg-white text-[#111827] border-gray-200 shadow-sm'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    <span className="font-medium whitespace-nowrap text-sm">{t('menu.all_food')}</span>
                  </button>

                  {processedCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all flex-shrink-0 border ${
                        selectedCategory === cat.id
                          ? 'bg-[#D97706] text-white border-[#D97706] shadow-md shadow-black/20'
                          : 'bg-white text-[#111827] border-gray-200 shadow-sm'
                      }`}
                    >
                      {getCategoryIcon(cat)}
                      <span className="font-medium whitespace-nowrap text-sm">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* EMPTY MENU FALLBACK */}
            {!itemsLoading && menuItems.length === 0 && !fetchError && (
              <div className="px-4 py-16 text-center">
                 <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                   <Utensils className="w-10 h-10 text-gray-400" />
                 </div>
                 <h3 className="text-xl text-gray-900 font-bold mb-2">{t('menu.preparing_title')}</h3>
                 <p className="text-gray-500 text-sm max-w-[250px] mx-auto">{t('menu.preparing_desc')}</p>
              </div>
            )}

            {/* PRODUCTS SECTION */}
            {menuItems.length > 0 && (
              <div className="px-4 pt-4 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#111827]">
                      {selectedCategory === 'all' ? t('menu.popular') : processedCategories.find(c => c.id === selectedCategory)?.name || 'Produits'}
                  </h3>
                </div>

                <div className="space-y-4">
                   <AnimatePresence mode="popLayout">
                    {filteredItems.map((item, index) => {
                       const isPromo = item.is_promo;
                       const discount = item.promo_discount || 0;
                       const discountedPrice = getDiscountedPrice(item.price, discount);
                       const stats = itemRatings[item.id] || { average: 0, count: 0 };
                       
                       const stock = item.stock_quantity;
                       const isOutOfStock = stock !== null && stock <= 0;
                       const isLowStock = stock !== null && stock > 0 && stock < 5;
                       const showQuantity = stock !== null && stock > 0 && stock < 10;
                       
                       // Respect the is_available flag
                       const isUnavailable = !item.is_available;
                       const cannotOrder = isOutOfStock || isUnavailable;

                       return (
                        <motion.div
                          layout
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => !cannotOrder && navigate(`/product/${item.id}`)}
                          className={`bg-white p-3 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4 relative overflow-hidden group transition-opacity ${cannotOrder ? 'opacity-60 grayscale-[0.5] cursor-not-allowed' : 'cursor-pointer hover:border-amber-200 hover:shadow-md'}`}
                        >
                          {isPromo && !cannotOrder && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl z-10">
                              {t('menu.promo_badge', { discount })}
                            </div>
                          )}

                          {cannotOrder && (
                            <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center backdrop-blur-[1px]">
                               <span className="bg-red-600 text-white font-bold px-3 py-1 rounded-full text-xs shadow-lg transform -rotate-12">
                                  {isUnavailable ? t('menu.unavailable') : t('menu.out_of_stock')}
                               </span>
                            </div>
                          )}
                          
                          <div className="relative flex-shrink-0">
                            <img 
                              src={getItemImage(item, index)} 
                              alt={item.name} 
                              className="w-20 h-20 rounded-full object-cover shadow-sm bg-gray-100 border border-gray-100"
                              onError={handleImageError}
                            />
                          </div>

                          <div className="flex-1 min-w-0 py-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-[#111827] font-bold text-base truncate pr-2" title={item.name}>{item.name}</h4>
                              <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-[10px] font-bold text-yellow-700">
                                  {stats.count > 0 ? stats.average : t('product.new_label')}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col text-xs mb-2 mt-0.5">
                              <span className="text-[#4b5563] truncate">
                                {item.menu_categories?.name || t('menu.general_category')} • {item.preparation_time ? `${item.preparation_time} min` : t('menu.fast_prep')}
                              </span>

                              {!cannotOrder && showQuantity && (
                                 <span className={`font-bold mt-0.5 flex items-center gap-1 ${isLowStock ? 'text-yellow-600' : 'text-amber-600'}`}>
                                   {isLowStock && <AlertTriangle className="w-3 h-3" />}
                                   {t('menu.low_stock', { count: stock })}
                                 </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between relative z-20">
                              <div className="flex flex-col">
                                 {isPromo ? (
                                   <div className="flex flex-col">
                                     <span className="text-[#9ca3af] text-xs line-through font-medium">
                                        {formatCurrency(Number(item.price))}
                                     </span>
                                     <span className="text-[#D97706] font-bold text-base">
                                        {formatCurrency(discountedPrice)}
                                     </span>
                                   </div>
                                 ) : (
                                    <span className="text-[#D97706] font-bold text-base">
                                      {item.price !== null && item.price !== undefined ? formatCurrency(Number(item.price)) : 'Prix N/A'}
                                    </span>
                                 )}
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => openReviewModal(e, item)}
                                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm"
                                  title="Avis et Commentaires"
                                >
                                  <MessageSquarePlus className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={(e) => handleAddToCart(e, item)}
                                  disabled={cannotOrder || item.price === null}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${cannotOrder || item.price === null ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#D97706] text-white hover:bg-[#FCD34D]'}`}
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {!itemsLoading && filteredItems.length === 0 && menuItems.length > 0 && (
                    <div className="text-center py-10 text-[#4b5563] text-sm font-medium bg-white rounded-xl border border-gray-100 shadow-sm">
                      {t('menu.empty_category')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ReviewModal open={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} menuItem={reviewItem} />
    </>
  );
};

export default MenuPage;