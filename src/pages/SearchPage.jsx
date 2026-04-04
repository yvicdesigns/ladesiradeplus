import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Loader2, Plus, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';

export const SearchPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('menu_categories').select('*');
    if (data) setCategories(data);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, menu_categories(name)')
        .ilike('name', `%${searchTerm}%`)
        .eq('is_available', true);

      if (!error) {
        setResults(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    addToCart(item);
    toast({
      title: 'Ajouté',
      description: `${item.name} ajouté au panier`,
      className: "bg-amber-100 text-amber-800 border-amber-200"
    });
  };

  return (
    <>
      <Helmet>
        <title>Recherche - La Desirade Plus</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Search Header */}
        <div className="bg-white p-4 sticky top-16 z-30 shadow-sm">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#4b5563]" />
            <Input 
              autoFocus
              placeholder="Rechercher un plat..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl border-gray-300 bg-gray-50 focus:bg-white focus:border-[#D97706] focus:ring-[#D97706] transition-all text-sm text-[#111827]"
            />
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {loading ? (
             <div className="flex justify-center py-10">
               <Loader2 className="h-8 w-8 animate-spin text-[#D97706]" />
             </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#4b5563] uppercase tracking-wider mb-4">
                {results.length} Résultat(s)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/product/${item.id}`)}
                    className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 flex gap-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="font-bold text-base text-[#111827]">{item.name}</h3>
                        <p className="text-xs text-[#4b5563] line-clamp-2 mt-1">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-[#D97706] text-base">{formatCurrency(item.price)}</span>
                        <Button 
                          size="sm" 
                          className="h-8 w-8 rounded-full p-0 bg-[#D97706] hover:bg-[#FCD34D] text-white"
                          onClick={(e) => handleAddToCart(e, item)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : searchTerm ? (
            <div className="text-center py-20">
              <p className="text-[#4b5563] text-sm">Aucun résultat trouvé pour "{searchTerm}"</p>
            </div>
          ) : (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-[#111827] mb-4">Catégories Populaires</h3>
              <div className="flex flex-wrap gap-3">
                {categories.slice(0, 6).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      navigate('/menu');
                      // In a real app we'd pass the category filter
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-[#111827] hover:border-[#D97706] hover:text-[#D97706] transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchPage;