import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Minus, Plus, Loader2, ShoppingCart, ArrowLeft, Star, Flame, Clock, MessageSquarePlus } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { ReviewModal } from '@/components/ReviewModal';
import { ReviewsDisplay } from '@/components/ReviewsDisplay';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

export const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  const { addToCart, getItemCount } = useCart();
  const { toast } = useToast();
  const cartItemCount = getItemCount();

  // Fetch reviews for rating calc
  const { data: reviews } = useRealtimeSubscription('reviews', {
    filter: { menu_item_id: id, status: 'approved' }
  });

  const ratingStats = useMemo(() => {
    if (!reviews || reviews.length === 0) return { average: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: (sum / reviews.length).toFixed(1),
      count: reviews.length
    };
  }, [reviews]);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, menu_categories(name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Produit introuvable' });
      navigate('/menu');
    } finally {
      setLoading(false);
    }
  };

  const getDiscountedPrice = (price, discount) => {
    if (!discount || discount <= 0) return price;
    return price * (1 - discount / 100);
  };

  const handleAddToCart = async () => {
    // We pass the product and the exact quantity to the addToCart function.
    // This replaces the previous implementation which looped and called it multiple times,
    // which caused race conditions with the React state updates inside the CartContext.
    const added = await addToCart(product, quantity);
    
    if (added) {
      toast({
        variant: 'success',
        title: 'Ajouté au panier !',
        description: `${quantity}x ${product.name} ajouté au panier`,
        duration: 4000,
      });
    }
  };

  const handlePlaceOrder = async () => {
    const added = await addToCart(product, quantity);
    if (added) {
      navigate('/checkout');
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
      <Loader2 className="h-10 w-10 animate-spin text-[#D97706]" />
    </div>
  );

  if (!product) return null;

  const isPromo = product.is_promo;
  const discount = product.promo_discount || 0;
  const discountedPrice = getDiscountedPrice(product.price, discount);

  return (
    <>
      <Helmet>
        <title>{product.name} - La Desirade Plus</title>
      </Helmet>

      <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans pb-24">
        
        {/* Header Section */}
        <header className="flex items-center justify-between px-6 py-6 sticky top-0 bg-[#F5F5F5] z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="hover:bg-gray-200/50 rounded-full w-10 h-10 -ml-2"
          >
            <ArrowLeft className="h-6 w-6 text-[#111827]" />
          </Button>
          <h1 className="text-xl font-bold text-[#111827]">Détails du Produit</h1>
          <div className="relative" onClick={() => navigate('/cart')}>
            <Button variant="ghost" size="icon" className="hover:bg-gray-200/50 rounded-full w-10 h-10 -mr-2">
              <ShoppingCart className="h-6 w-6 text-[#111827]" />
            </Button>
            {cartItemCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#D97706] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white">
                {cartItemCount}
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Main Card Container */}
          <div className="mx-6 bg-white rounded-[32px] p-6 shadow-sm mb-6 relative">
             {isPromo && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-2xl rounded-tr-[32px] z-10">
                  Promo -{discount}%
                </div>
             )}
            
            {/* Image Section */}
            <div className="flex justify-center mb-8 relative">
              <div className="w-56 h-56 rounded-full overflow-hidden shadow-lg shadow-black/10">
                <img 
                  src={product.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>

               {/* Quantity Controls */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#F5F5F5] rounded-[16px] px-2 py-2 flex items-center gap-4 shadow-sm border border-gray-200">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#111827] hover:text-[#D97706] shadow-sm transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-base font-bold text-[#111827] w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full bg-white text-[#111827] hover:text-[#D97706] flex items-center justify-center shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Product Info Section */}
            <div className="pt-4 flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-[#111827] leading-tight mb-1">{product.name}</h2>
                <p className="text-sm text-[#4b5563]">La Desirade Plus Restaurant</p>
              </div>
              <div className="flex flex-col items-end">
                {isPromo ? (
                    <>
                        <span className="text-sm text-gray-400 line-through font-medium mb-0.5">
                            {formatCurrency(Number(product.price))}
                        </span>
                        <div className="text-2xl font-bold text-[#D97706]">
                            {formatCurrency(discountedPrice)}
                        </div>
                    </>
                ) : (
                    <div className="text-2xl font-bold text-[#D97706]">
                        {formatCurrency(Number(product.price))}
                    </div>
                )}
              </div>
            </div>

            {/* Badges Section */}
            <div className="flex justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-[16px] px-4 py-3 flex-1 justify-center min-w-[90px]">
                <Star className={`w-4 h-4 ${ratingStats.count > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                <span className="font-medium text-[#4b5563] text-xs">
                  {ratingStats.count > 0 ? ratingStats.average : 'New'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-[16px] px-4 py-3 flex-1 justify-center min-w-[100px]">
                <Flame className="w-4 h-4 text-amber-500 fill-green-500" />
                <span className="font-medium text-[#4b5563] text-xs">123 Kcal</span>
              </div>
              <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-[16px] px-4 py-3 flex-1 justify-center min-w-[100px]">
                <Clock className="w-4 h-4 text-[#D97706] fill-[#D97706]" />
                <span className="font-medium text-[#4b5563] text-xs">{product.preparation_time || 30} min</span>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="px-6 mb-8">
            <h3 className="font-bold text-base text-[#111827] mb-2">Détails</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {product.description || "Aucune description disponible pour ce produit."}
            </p>
          </div>

          {/* Reviews Section */}
          <div className="px-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#111827]">Avis Clients</h3>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 text-[#D97706] border-[#D97706] hover:bg-amber-50"
                onClick={() => setIsReviewModalOpen(true)}
              >
                <MessageSquarePlus className="h-4 w-4" />
                Écrire un avis
              </Button>
            </div>
            
            <ReviewsDisplay menuItemId={product.id} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#F5F5F5] border-t border-gray-200 z-40">
          <div className="flex gap-3">
            <Button 
              onClick={handleAddToCart}
              className="flex-1 h-[56px] rounded-[24px] bg-white border border-[#D97706] text-[#D97706] hover:bg-amber-50 font-bold text-sm tracking-wide uppercase shadow-none"
            >
              Ajouter
            </Button>
            <Button 
              onClick={handlePlaceOrder}
              className="flex-1 h-[56px] rounded-[24px] bg-[#D97706] hover:bg-[#FCD34D] text-white font-bold text-sm tracking-wide uppercase shadow-lg shadow-black/20 border-0"
            >
              Commander
            </Button>
          </div>
        </div>

        <ReviewModal 
          open={isReviewModalOpen} 
          onClose={() => setIsReviewModalOpen(false)} 
          menuItem={product}
          onSuccess={() => {
            // Realtime handles update
          }}
        />
      </div>
    </>
  );
};

export default ProductDetailsPage;