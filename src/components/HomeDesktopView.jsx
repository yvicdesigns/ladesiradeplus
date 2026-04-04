import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, Utensils, ShoppingCart, Download } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useProductsWithRetry } from '@/hooks/useProductsWithRetry';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { PromoBanner } from '@/components/PromoBanner';
import { DownloadAppModal } from '@/components/DownloadAppModal';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

export const HomeDesktopView = () => {
  const navigate = useNavigate();
  const { addToCart, cartItems, getItemCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const { categories: fetchedCategories, products: menuItems, loading } = useProductsWithRetry();
  const cartCount = getItemCount();

  const { processedCategories, itemsByCategory } = useMemo(() => {
    const validCatIds = new Set(fetchedCategories.map(c => c.id));
    const grouped = { all: [] };
    menuItems.forEach(item => {
      grouped['all'].push(item);
      if (item.category_id && validCatIds.has(item.category_id)) {
        if (!grouped[item.category_id]) grouped[item.category_id] = [];
        grouped[item.category_id].push(item);
      }
    });
    const sorted = [...fetchedCategories].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    return { processedCategories: sorted, itemsByCategory: grouped };
  }, [menuItems, fetchedCategories]);

  const getItemQty = (itemId) => {
    const found = cartItems?.find(c => c.id === itemId);
    return found?.quantity || 0;
  };

  // For single category view
  const displayItems = selectedCategory === 'all' ? [] : (itemsByCategory[selectedCategory] || []);

  // For "all" view — sections per category
  const categorySections = useMemo(() => {
    if (selectedCategory !== 'all') return null;
    return processedCategories
      .map(cat => ({ cat, items: itemsByCategory[cat.id] || [] }))
      .filter(s => s.items.length > 0);
  }, [selectedCategory, processedCategories, itemsByCategory]);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">

      {/* ── CATEGORY FILTER TABS ── */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
            {/* Download app button — far left */}
            <button
              onClick={() => setShowDownloadModal(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-all mr-3 border border-gray-200"
            >
              <Download className="h-3.5 w-3.5" />
              Obtenir l'app
            </button>

            <div className="w-px h-5 bg-gray-200 flex-shrink-0 mr-3" />

            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#D97706] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tout le menu
            </button>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-full flex-shrink-0" />
                ))
              : processedCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-[#D97706] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">

        {/* Promo banner */}
        <div className="mb-8">
          <PromoBanner />
        </div>

        {loading ? (
          <div className="space-y-10">
            {Array.from({ length: 2 }).map((_, si) => (
              <div key={si}>
                <Skeleton className="h-7 w-48 rounded-lg mb-5" />
                <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : selectedCategory === 'all' && categorySections ? (

          /* ── ALL CATEGORIES — stacked sections like Bolt Food ── */
          <div className="space-y-12">
            {categorySections.map(({ cat, items }) => (
              <section key={cat.id}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-extrabold text-gray-900">{cat.name}</h2>
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-1 text-sm font-semibold text-[#D97706] hover:underline"
                  >
                    Tout voir <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                  {items.slice(0, 5).map(item => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      qty={getItemQty(item.id)}
                      onAdd={() => addToCart(item)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

        ) : (

          /* ── SINGLE CATEGORY VIEW ── */
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-gray-900">
                {processedCategories.find(c => c.id === selectedCategory)?.name || 'Menu'}
              </h2>
              <span className="text-sm text-gray-400 font-medium">{displayItems.length} article{displayItems.length !== 1 ? 's' : ''}</span>
            </div>
            {displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <Utensils className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">Aucun article dans cette catégorie</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                {displayItems.map(item => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    qty={getItemQty(item.id)}
                    onAdd={() => addToCart(item)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DOWNLOAD APP MODAL ── */}
      <DownloadAppModal isOpen={showDownloadModal} onClose={() => setShowDownloadModal(false)} />

      {/* ── FLOATING CART BUTTON (when items in cart) ── */}
      {cartCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
        >
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-3 bg-[#D97706] hover:bg-[#B45309] text-white font-bold px-6 py-4 rounded-2xl shadow-xl shadow-amber-300/40 transition-all"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Voir le panier</span>
            <span className="bg-white/20 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
              {cartCount}
            </span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

/* ── PRODUCT CARD ── */
const ProductCard = ({ item, qty, onAdd }) => {
  const navigate = useNavigate();
  const isAvailable = item.is_available !== false && (item.stock_quantity === null || item.stock_quantity > 0);

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.10)' }}
      transition={{ duration: 0.18 }}
      className={`bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col cursor-pointer ${!isAvailable ? 'opacity-55' : ''}`}
      onClick={() => navigate(`/product/${item.id}`)}
    >
      {/* Image */}
      <div className="relative h-44 bg-gray-100 flex-shrink-0">
        <img
          src={item.image_url || PLACEHOLDER}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">Indisponible</span>
          </div>
        )}
        {qty > 0 && (
          <div className="absolute top-2.5 right-2.5 bg-[#D97706] text-white text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
            {qty}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{item.name}</p>
        {item.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <span className="font-extrabold text-[#D97706] text-base">{formatCurrency(item.price)}</span>
          {isAvailable && (
            <button
              onClick={e => { e.stopPropagation(); onAdd(); }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                qty > 0
                  ? 'bg-[#D97706] text-white shadow-sm'
                  : 'bg-amber-50 text-[#D97706] hover:bg-amber-100'
              }`}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default HomeDesktopView;
