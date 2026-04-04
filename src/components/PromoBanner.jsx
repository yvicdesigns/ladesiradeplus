import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { ChevronRight, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export const PromoBanner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('promo_banners')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        if (mounted) {
          setBanners(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching banners:", err);
        if (mounted) setLoading(false);
      }
    };

    fetchBanners();

    const subscription = supabase
      .channel('public:promo_banners_component')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_banners' }, () => {
        fetchBanners();
      })
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); 

    return () => clearInterval(timer);
  }, [banners.length, isHovered]);

  const handleBannerClick = (banner) => {
    if (banner.linked_product_id || banner.product_id) {
      navigate(`/product/${banner.linked_product_id || banner.product_id}`);
    } else if (banner.link_url) {
      if (banner.link_url.startsWith('http') || banner.link_url.startsWith('www')) {
        window.open(banner.link_url.startsWith('http') ? banner.link_url : `https://${banner.link_url}`, '_blank');
      } else {
        navigate(banner.link_url);
      }
    }
  };

  const getBackgroundStyle = (banner) => {
    const style = { 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };

    const imgUrl = banner.active_image_url || banner.image_url;

    if (imgUrl && banner.show_image !== false && (banner.banner_type === 'image_only' || banner.banner_type === 'image_text')) {
      style.backgroundImage = `url(${imgUrl})`;
    } else {
      if (banner.background_color_type === 'gradient') {
        const directionMap = {
          'to-bottom': 'to bottom',
          'to-right': 'to right',
          'to-bottom-right': '135deg',
          'to-bottom-left': '225deg'
        };
        const dir = directionMap[banner.background_gradient_direction] || '135deg';
        style.background = `linear-gradient(${dir}, ${banner.background_gradient_color1 || '#F59E0B'}, ${banner.background_gradient_color2 || '#D97706'})`;
      } else {
        style.backgroundColor = banner.background_color_solid || '#D97706';
      }
    }
    return style;
  };

  if (loading) {
    return (
      <div className="w-full max-w-sm mx-auto mb-6 h-40 sm:h-44 rounded-2xl overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const imgUrl = currentBanner.active_image_url || currentBanner.image_url;

  return (
    <div 
      className="w-full max-w-sm mx-auto mb-6 relative group z-0 h-40 sm:h-44"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          onClick={() => handleBannerClick(currentBanner)}
          className="rounded-2xl shadow-lg cursor-pointer absolute inset-0 overflow-hidden"
        >
          {/* Background */}
          <div style={getBackgroundStyle(currentBanner)} />
          
          {/* Dark Overlay for Text Readability */}
          {(imgUrl && currentBanner.banner_type === 'image_text' && currentBanner.show_image) && (
            <div className="absolute inset-0 bg-black/40" />
          )}

          {/* Content */}
          <div className="relative z-10 h-full w-full p-5 flex items-center justify-between">
            {/* Left Content */}
            <div className="flex flex-col justify-center h-full max-w-[65%] space-y-2">
              {currentBanner.show_text !== false && (
                <h3 
                  className="text-xl sm:text-2xl font-bold leading-tight drop-shadow-md"
                  style={{ color: currentBanner.text_color || '#ffffff' }}
                >
                  {currentBanner.title}
                </h3>
              )}
              
              {currentBanner.discount_percentage > 0 && (
                 <Badge className="w-fit bg-white text-amber-600 hover:bg-white text-xs font-bold px-2 py-0.5 shadow-sm">
                   <Percent className="w-3 h-3 mr-1" />
                   -{currentBanner.discount_percentage}% OFF
                 </Badge>
              )}

              {currentBanner.show_button !== false && (
                <Button 
                  size="sm" 
                  className="mt-1 h-8 px-4 rounded-full font-bold text-xs shadow-md transition-transform hover:scale-105 w-fit"
                  style={{ 
                    backgroundColor: currentBanner.button_color || '#ffffff', 
                    color: currentBanner.button_text_color || '#D97706' 
                  }}
                >
                  {currentBanner.button_text || 'Commander'} <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>

            {/* Right Image */}
            {currentBanner.product_image_url && (
              <div className="absolute right-[-10px] bottom-[-10px] sm:right-2 sm:bottom-2 w-32 h-32 sm:w-36 sm:h-36">
                <img 
                  src={currentBanner.product_image_url} 
                  alt="Promo Product" 
                  className="w-full h-full object-cover rounded-full border-4 border-white/20 shadow-xl"
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Indicators */}
      {banners.length > 1 && (
        <div className="absolute -bottom-5 left-0 right-0 flex justify-center gap-1.5 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === currentIndex ? "bg-amber-500 w-6" : "bg-gray-300 w-1.5 hover:bg-gray-400"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};