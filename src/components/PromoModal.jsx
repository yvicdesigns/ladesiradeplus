import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Tag, Sparkles, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { calculateDiscountedPrice } from '@/lib/promoUtils';
import { formatCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';

const Confetti = () => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const colors = ['#D97706', '#F59E0B', '#FCD34D', '#fdba74', '#ffffff', '#fbbf24'];
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      scale: 0.5 + Math.random() * 0.5,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: p.color, left: `${p.x}%`, top: `${p.y}%` }}
          initial={{ y: 0, opacity: 1, rotate: p.rotation, scale: p.scale }}
          animate={{ 
            y: '120vh', 
            opacity: [1, 1, 0],
            rotate: p.rotation + 360,
          }}
          transition={{ 
            duration: p.duration, 
            delay: p.delay,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

export const PromoModal = ({ banner, onClose, isOpen }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  if (!banner) return null;

  const hasProduct = banner.product || banner.linked_product_id;
  const productPrice = banner.product?.price || banner.original_price;
  const isPercentage = banner.discount_type === 'percentage' || banner.discount_percentage > 0;
  const discountValue = isPercentage ? (banner.discount_percentage || banner.discount_value) : banner.discount_value;
  
  const pricing = productPrice && discountValue 
    ? calculateDiscountedPrice(productPrice, isPercentage ? 'percentage' : 'fixed_amount', discountValue)
    : null;

  const bgStyle = {
    background: banner.background_color_type === 'gradient' 
      ? `linear-gradient(${banner.background_gradient_direction === 'to-bottom-right' ? '135deg' : 'to bottom'}, ${banner.background_gradient_color1 || '#D97706'}, ${banner.background_gradient_color2 || '#9a3412'})`
      : banner.background_color_solid || '#D97706'
  };

  const handleAction = () => {
    if (banner.link_url) {
      navigate(banner.link_url);
    } else if (banner.linked_product_id || banner.product_id) {
      navigate(`/product/${banner.linked_product_id || banner.product_id}`);
    } else {
      navigate('/menu');
    }
    onClose();
  };

  const handleOrder = async () => {
    if (!banner.product) return;
    
    try {
      const productToCart = {
        id: banner.product.id,
        name: banner.product.name,
        price: banner.product.price,
        image_url: banner.product.image_url,
        is_promo: true,
        promo_discount: discountValue,
        discount_type: isPercentage ? 'percentage' : 'fixed_amount'
      };

      const success = await addToCart(productToCart, 1);
      
      if (success) {
        toast({
          title: "Succès",
          description: "Produit ajouté au panier",
          className: "bg-amber-50 text-amber-900 border-amber-200"
        });
        
        // Immediately close modal and navigate to ensure robust flow without timeouts
        onClose();
        navigate('/cart');
      }
    } catch (error) {
      console.error("Error handling promo order:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout au panier."
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col"
          >
            <Confetti />
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Hero Image Section */}
            <div className="relative w-full h-56 sm:h-64 bg-muted">
              <div className="absolute inset-0" style={bgStyle} />
              
              {(banner.active_image_url || banner.image_url) && (
                <img 
                  src={banner.active_image_url || banner.image_url} 
                  alt={banner.title || 'Promotion'} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              
              {/* Gradient Overlay for text readability if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Discount Badge */}
              {discountValue > 0 && (
                <motion.div 
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: -10 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="absolute top-6 left-4 bg-yellow-400 text-yellow-900 font-black px-4 py-2 rounded-xl shadow-lg border-2 border-white flex flex-col items-center justify-center z-20"
                >
                  <span className="text-xs uppercase tracking-widest leading-none opacity-80">Remise</span>
                  <span className="text-2xl leading-none tracking-tighter">
                    -{discountValue}{isPercentage ? '%' : ' XAF'}
                  </span>
                </motion.div>
              )}

              {/* Title overlaying image */}
              <div className="absolute bottom-0 left-0 w-full p-6 pb-4">
                <motion.h2 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md"
                  style={{ color: banner.text_color || '#ffffff' }}
                >
                  {banner.title || 'Offre Spéciale !'}
                </motion.h2>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 pt-4 flex flex-col flex-1 bg-white">
              
              {/* Product Info if available */}
              {hasProduct && banner.product && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4 flex items-start gap-4"
                >
                  {banner.product.image_url && (
                    <img 
                      src={banner.product.image_url} 
                      alt={banner.product.name}
                      className="w-16 h-16 rounded-xl object-cover shadow-sm border border-green-100"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{banner.product.name}</h3>
                    {pricing && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-amber-600">{pricing.formatted}</span>
                        <span className="text-sm text-gray-400 line-through decoration-red-500 decoration-2 font-medium">
                          {formatCurrency(pricing.original)}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* General Description */}
              {!hasProduct && banner.description && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 mb-6 text-sm leading-relaxed"
                >
                  {banner.description}
                </motion.p>
              )}

              {/* Badges/Highlights */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-2 mb-8 mt-2"
              >
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-green-100">
                  <Sparkles className="w-3 h-3 mr-1" /> Exclusif
                </Badge>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-green-100">
                  <Tag className="w-3 h-3 mr-1" /> Offre Limitée
                </Badge>
              </motion.div>

              <div className="mt-auto"></div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                {hasProduct && banner.product ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={handleAction}
                      variant="outline"
                      className="w-full h-12 rounded-xl text-sm font-bold shadow-sm"
                    >
                      Détails
                    </Button>
                    <Button 
                      onClick={handleOrder}
                      className="w-full h-12 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all"
                      style={{ 
                        backgroundColor: banner.button_color || '#D97706',
                        color: banner.button_text_color || '#ffffff'
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Commander
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleAction}
                    size="lg"
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transition-all group overflow-hidden relative"
                    style={{ 
                      backgroundColor: banner.button_color || '#D97706',
                      color: banner.button_text_color || '#ffffff'
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {banner.button_text || 'Profiter de l\'offre'}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                )}
              </motion.div>
              
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};