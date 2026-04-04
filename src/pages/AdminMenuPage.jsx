import React, { useState, useMemo, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useProductsWithRetry } from '@/hooks/useProductsWithRetry';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CategoryModal } from '@/components/CategoryModal';
import { ProductModal } from '@/components/ProductModal';
import { DeleteWithReasonModal } from '@/components/DeleteWithReasonModal';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Edit, Trash2, Tag, Utensils, ImageOff, Activity, AlertCircle, Package, ExternalLink, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { useManagerPermissions } from '@/hooks/useManagerPermissions';
import { ENTITY_TYPES } from '@/lib/managerPermissions';
import { useTranslation } from 'react-i18next'; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useSoftDelete } from '@/hooks/useSoftDelete';
import { getValidatedRestaurantId } from '@/lib/restaurantValidation';

// Phase 2 Components
import { ProductFiltersPanel } from '@/components/products/ProductFiltersPanel';
import { ProductStatisticsPanel } from '@/components/products/ProductStatisticsPanel';
import { ProductExportPanel } from '@/components/products/ProductExportPanel';

export const AdminMenuPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth(); 
  const { restaurantId } = useRestaurant();
  const { canAccess, canDelete } = useManagerPermissions(ENTITY_TYPES.MENU);

  const { deleteRecord: deleteProduct, loading: productDeleting } = useSoftDelete('menu_items');
  const { deleteRecord: deleteCategory, loading: categoryDeleting } = useSoftDelete('menu_categories');

  const { 
    products = [], 
    loading: productsLoading, 
    error: productsError, 
    retry: retryProducts, 
    isRetrying 
  } = useProductsWithRetry({ includeCategories: true }); 

  const { 
    categories = [], 
    loading: categoriesLoading, 
    error: categoriesError,
    refetch: retryCategories 
  } = useCategories();

  const dataLoading = productsLoading || categoriesLoading;
  const dataError = productsError || categoriesError;

  const retryAll = useCallback(() => {
    retryProducts();
    retryCategories();
  }, [retryProducts, retryCategories]);

  // STATE
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Phase 2 Filters
  const [advancedFilters, setAdvancedFilters] = useState({
    category: 'all',
    priceMin: '',
    priceMax: '',
    stockMin: '',
    stockMax: '',
    status: 'all'
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteType, setDeleteType] = useState('product'); 

  // Safe arrays
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const handleResetFilters = () => {
    setSearchTerm('');
    setAdvancedFilters({
      category: 'all',
      priceMin: '',
      priceMax: '',
      stockMin: '',
      stockMax: '',
      status: 'all'
    });
  };

  const filteredProducts = useMemo(() => {
    let result = [...safeProducts]; 
    
    // Search
    if (searchTerm) {
      result = result.filter(p => p?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p?.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    // Phase 2 Filters
    if (advancedFilters.category && advancedFilters.category !== 'all') {
      result = result.filter(p => p && p.category_id === advancedFilters.category);
    }
    if (advancedFilters.priceMin) {
      result = result.filter(p => (p?.price || 0) >= Number(advancedFilters.priceMin));
    }
    if (advancedFilters.priceMax) {
      result = result.filter(p => (p?.price || 0) <= Number(advancedFilters.priceMax));
    }
    if (advancedFilters.stockMin) {
      result = result.filter(p => (p?.stock_quantity || 0) >= Number(advancedFilters.stockMin));
    }
    if (advancedFilters.stockMax) {
      result = result.filter(p => (p?.stock_quantity || 0) <= Number(advancedFilters.stockMax));
    }
    if (advancedFilters.status && advancedFilters.status !== 'all') {
      if (advancedFilters.status === 'active') result = result.filter(p => p?.is_available);
      if (advancedFilters.status === 'inactive') result = result.filter(p => !p?.is_available);
      if (advancedFilters.status === 'out_of_stock') result = result.filter(p => (p?.stock_quantity || 0) <= 0);
    }
    
    // Sort
    if (sortBy === 'price_asc') result.sort((a, b) => (a?.price || 0) - (b?.price || 0));
    else if (sortBy === 'price_desc') result.sort((a, b) => (b?.price || 0) - (a?.price || 0));
    else if (sortBy === 'name_asc') result.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    else if (sortBy === 'category') result.sort((a, b) => (a?.menu_categories?.name || '').localeCompare(b?.menu_categories?.name || ''));
    
    return result;
  }, [safeProducts, searchTerm, advancedFilters, sortBy]);

  // Handlers
  const handleEditCategory = useCallback((category) => { setSelectedItem(category); setIsCategoryModalOpen(true); }, []);
  const handleEditProduct = useCallback((product) => { setSelectedItem(product); setIsProductModalOpen(true); }, []);
  
  const handleDeleteClick = useCallback((item, type) => { 
    if (canDelete) { 
      setSelectedItem(item); 
      setDeleteType(type); 
      setIsDeleteModalOpen(true); 
    }
  }, [canDelete]);

  const executeDelete = useCallback(async (reason) => {
    if (!selectedItem) return;
    let success = false;
    
    if (deleteType === 'product') {
       const res = await deleteProduct(selectedItem.id, reason);
       success = res.success;
    } else {
       const res = await deleteCategory(selectedItem.id, reason);
       success = res.success;
    }
    
    if (success) {
      setIsDeleteModalOpen(false);
      retryAll();
    }
  }, [deleteType, selectedItem, deleteProduct, deleteCategory, retryAll]);

  const handleToggleAvailability = useCallback(async (product) => {
    if (!product || !product.id) return;
    
    if (!session) {
      toast({ title: t('common.error', { defaultValue: 'Erreur' }), description: "Session expirée, veuillez vous reconnecter.", variant: "destructive" });
      return;
    }

    try {
      const validRestaurantId = getValidatedRestaurantId(restaurantId);

      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !product.is_available })
        .eq('id', product.id)
        .eq('restaurant_id', validRestaurantId); // Enforce tenant isolation
      
      if (error) {
        if (error.code === '42501') {
          throw new Error("Erreur de permission (RLS) : Vous n'avez pas les droits de modifier la disponibilité de ce produit pour ce restaurant.");
        }
        throw error;
      }

      toast({ title: t('admin.menu.updated', { defaultValue: 'Mis à jour' }), description: t('admin.menu.avail_success', { defaultValue: `Disponibilité modifiée avec succès.` }) });
      retryProducts();
    } catch (error) { 
      console.error("Error toggling availability:", error);
      toast({ title: t('common.error', { defaultValue: 'Erreur' }), description: error.message || "Une erreur inattendue s'est produite", variant: "destructive" }); 
    }
  }, [toast, t, retryProducts, session, restaurantId]);

  const handleImageError = useCallback((e) => {
    e.target.onerror = null; 
    e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop";
  }, []);

  if (!canAccess) {
    return <AdminLayout><div className="p-8 text-center"><Alert><AlertTitle>Accès refusé</AlertTitle><AlertDescription>Vous n'avez pas les permissions nécessaires.</AlertDescription></Alert></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5 md:mb-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{t('admin.menu.title', { defaultValue: 'Menu' })}</h1>
              {!dataError ? (
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 gap-1.5 text-[10px] md:text-xs py-0.5 md:py-1 px-2 md:px-2.5">
                  <Activity className="h-3 w-3 md:h-3.5 md:w-3.5" /> <span className="hidden sm:inline">Connecté</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 gap-1.5 text-[10px] md:text-xs py-0.5 md:py-1 px-2 md:px-2.5">
                   <AlertCircle className="h-3 w-3" />
                   <span className="hidden sm:inline">Erreur</span>
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs md:text-sm">{t('admin.menu.subtitle', { defaultValue: 'Gérez vos produits et catégories' })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Phase 2: Export Component */}
            {activeTab === 'products' && (
              <ProductExportPanel products={filteredProducts} disabled={dataLoading} />
            )}
            
            <Button onClick={() => navigate('/admin/stock')} variant="outline" className="gap-2 text-primary border-primary/20 hover:bg-primary/10 shadow-sm min-h-[44px]">
              <Package className="h-4 w-4" /> <span className="hidden sm:inline">Stocks</span> <ExternalLink className="h-3.5 w-3.5 opacity-50 hidden sm:block" />
            </Button>
            <Button onClick={() => { setSelectedItem(null); setIsCategoryModalOpen(true); }} variant="secondary" className="gap-2 shadow-sm min-h-[44px]">
              <Tag className="h-4 w-4" /> {t('admin.menu.add_category', { defaultValue: 'Catégorie' })}
            </Button>
            <Button onClick={() => { setSelectedItem(null); setIsProductModalOpen(true); }} className="gap-2 shadow-sm min-h-[44px]">
              <Plus className="h-4 w-4" /> {t('admin.menu.add_product', { defaultValue: 'Produit' })}
            </Button>
          </div>
        </div>

        {/* Global Error Banner */}
        {dataError && !dataLoading && (
           <Alert variant="destructive" className="animate-in fade-in zoom-in-95 bg-white">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Erreur de synchronisation</AlertTitle>
             <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
               <span>Impossible de récupérer les données récentes. Veuillez vérifier votre connexion.</span>
               <Button variant="outline" size="sm" onClick={retryAll} disabled={isRetrying} className="w-fit bg-background text-foreground shrink-0 border-destructive-foreground/20 hover:bg-destructive hover:text-destructive-foreground">
                 <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} /> 
                 {isRetrying ? 'Tentative...' : 'Réessayer'}
               </Button>
             </AlertDescription>
           </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-card border border-border p-1 md:p-1.5 w-full md:w-auto h-auto rounded-lg shadow-sm grid grid-cols-2 md:inline-flex">
            <TabsTrigger value="products" className="text-sm gap-2 py-2.5 px-4 rounded-md min-h-[44px] md:min-h-[auto]"><Utensils className="h-4 w-4" /> {t('admin.menu.tabs_products', { defaultValue: 'Produits' })}</TabsTrigger>
            <TabsTrigger value="categories" className="text-sm gap-2 py-2.5 px-4 rounded-md min-h-[44px] md:min-h-[auto]"><Tag className="h-4 w-4" /> {t('admin.menu.tabs_categories', { defaultValue: 'Catégories' })}</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            
            {/* Phase 2: Statistics */}
            <ProductStatisticsPanel products={filteredProducts} />

            {/* Phase 2: Filters */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-3 md:p-4 rounded-lg border border-border shadow-sm">
                <div className="relative w-full md:flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder={t('admin.menu.search_products', { defaultValue: 'Rechercher un produit...' })} 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-10 text-sm bg-background border-border text-foreground w-full"
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[180px] text-sm bg-background min-h-[44px] text-foreground">
                      <SelectValue placeholder={t('admin.menu.sort_by', { defaultValue: 'Trier par' })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{t('admin.menu.sort_newest', { defaultValue: 'Récents' })}</SelectItem>
                      <SelectItem value="price_asc">{t('admin.menu.sort_price_asc', { defaultValue: 'Prix Croissant' })}</SelectItem>
                      <SelectItem value="price_desc">{t('admin.menu.sort_price_desc', { defaultValue: 'Prix Décroissant' })}</SelectItem>
                      <SelectItem value="name_asc">Nom (A-Z)</SelectItem>
                      <SelectItem value="category">Catégorie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ProductFiltersPanel 
                filters={advancedFilters}
                onFilterChange={setAdvancedFilters}
                onReset={handleResetFilters}
                categories={safeCategories}
              />
            </div>

            {dataLoading && safeProducts.length === 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                 {Array.from({ length: 8 }).map((_, i) => (
                   <Card key={i} className="overflow-hidden flex flex-col h-full border-border">
                     <Skeleton className="h-40 md:h-48 w-full rounded-none" />
                     <CardHeader className="p-3 md:p-4 pb-2">
                       <Skeleton className="h-5 w-3/4 mb-2" />
                       <Skeleton className="h-4 w-1/4" />
                     </CardHeader>
                     <CardContent className="p-3 md:p-4 pt-0">
                       <Skeleton className="h-4 w-full mb-1" />
                       <Skeleton className="h-4 w-2/3 mb-3" />
                       <Skeleton className="h-6 w-20 rounded-full" />
                     </CardContent>
                     <CardFooter className="p-3 border-t flex justify-between mt-auto">
                       <Skeleton className="h-6 w-16" />
                       <div className="flex gap-2">
                         <Skeleton className="h-9 w-9 rounded-md" />
                         <Skeleton className="h-9 w-9 rounded-md" />
                       </div>
                     </CardFooter>
                   </Card>
                 ))}
               </div>
            ) : filteredProducts.length === 0 ? (
               <div className="text-center py-16 md:py-20 bg-muted/30 rounded-xl border border-dashed border-border">
                 <Utensils className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
                 <h3 className="text-base md:text-lg font-medium text-foreground">{t('admin.menu.no_products', { defaultValue: 'Aucun produit trouvé' })}</h3>
                 <p className="text-muted-foreground mt-1 text-sm md:text-base">Ajustez vos filtres ou ajoutez un nouveau produit.</p>
               </div> 
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence>
                  {filteredProducts.map((product) => (
                    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={product?.id || Math.random()}>
                      <Card className="overflow-hidden group h-full flex flex-col border-border hover:shadow-md hover:border-primary/30 transition-all">
                        <div className="relative h-40 md:h-48 bg-muted overflow-hidden">
                          {product?.image_url ? (
                            <img src={product.image_url} alt={product?.name || 'Produit'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={handleImageError} />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground"><ImageOff className="h-8 w-8 md:h-10 md:w-10 opacity-30" /></div>
                          )}
                          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                            <Badge variant={product?.is_available ? "default" : "secondary"} className={`text-[10px] md:text-xs px-2 md:px-2.5 py-0.5 md:py-1 ${product?.is_available ? 'bg-primary text-primary-foreground' : 'bg-background/90 text-muted-foreground backdrop-blur-sm shadow-sm'}`}>{product?.is_available ? t('admin.menu.available', { defaultValue: 'Disponible' }) : t('admin.menu.unavailable', { defaultValue: 'Indisponible' })}</Badge>
                            {product?.stock_quantity <= 0 && <Badge variant="destructive" className="text-[10px] md:text-xs px-2 md:px-2.5 py-0.5 md:py-1 shadow-sm">Rupture</Badge>}
                          </div>
                        </div>
                        <CardHeader className="p-3 md:p-4 pb-2">
                           <div className="flex justify-between items-start gap-2 md:gap-3">
                              <CardTitle className="text-base md:text-lg line-clamp-1" title={product?.name}>{product?.name}</CardTitle>
                              <span className="font-bold text-sm md:text-base text-primary whitespace-nowrap">{formatCurrency(product?.price || 0)}</span>
                           </div>
                           <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 min-h-[2rem] md:min-h-[2.5rem] mt-1.5 md:mt-2 leading-relaxed">{product?.description}</p>
                        </CardHeader>
                        <CardContent className="p-3 md:p-4 pt-0 md:pt-2 flex-grow">
                           <div className="flex justify-between items-center">
                             <Badge variant="secondary" className="text-[10px] md:text-xs font-medium bg-secondary text-secondary-foreground truncate max-w-[150px]">
                               {product?.menu_categories?.name || 'Non catégorisé'}
                             </Badge>
                             <span className="text-xs font-medium text-slate-500">Stock: {product?.stock_quantity || 0}</span>
                           </div>
                        </CardContent>
                        <CardFooter className="p-2 md:p-3 border-t border-border/50 flex items-center justify-between mt-auto bg-muted/10">
                          <div className="flex items-center gap-2 ml-1">
                             <Switch checked={!!product?.is_available} onCheckedChange={() => handleToggleAvailability(product)} className="scale-90 md:scale-100" />
                             <span className="text-[10px] md:text-xs font-medium text-muted-foreground">Actif</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-9 w-9 md:h-10 md:w-10 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEditProduct(product)}><Edit className="h-4 w-4" /></Button>
                            {canDelete && <Button size="icon" variant="ghost" className="h-9 w-9 md:h-10 md:w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeleteClick(product, 'product'); }}><Trash2 className="h-4 w-4" /></Button>}
                          </div>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            {dataLoading && safeCategories.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden flex flex-row sm:flex-col h-24 sm:h-auto border-border">
                    <Skeleton className="h-24 w-24 sm:h-40 sm:w-full flex-shrink-0 rounded-none" />
                    <div className="flex flex-col flex-1 p-3">
                      <Skeleton className="h-5 w-3/4 sm:hidden mb-2" />
                      <div className="mt-auto flex justify-end gap-2 border-t pt-2 sm:border-t-0 sm:pt-0">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : safeCategories.length === 0 ? (
               <div className="text-center py-16 md:py-20 bg-muted/30 rounded-xl border border-dashed border-border">
                 <Tag className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4 opacity-40" />
                 <h3 className="text-base md:text-lg font-medium text-foreground">{t('admin.menu.no_categories', { defaultValue: 'Aucune catégorie trouvée' })}</h3>
                 <p className="text-muted-foreground mt-1 text-sm md:text-base">Créez votre première catégorie pour organiser le menu.</p>
               </div> 
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {safeCategories.map((category) => (
                  <Card key={category?.id || Math.random()} className="overflow-hidden group hover:shadow-md hover:border-primary/30 transition-all flex flex-row sm:flex-col border-border">
                    <div className="relative h-24 w-24 sm:h-40 sm:w-full bg-muted overflow-hidden flex-shrink-0">
                       {category?.image_url ? (
                         <img src={category.image_url} alt={category?.name || 'Catégorie'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={handleImageError} />
                       ) : (
                         <div className="flex items-center justify-center h-full text-muted-foreground"><Tag className="h-6 w-6 sm:h-8 sm:w-8 opacity-30" /></div>
                       )}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2 sm:p-4 hidden sm:flex">
                         <h3 className="text-white font-bold text-sm sm:text-lg">{category?.name}</h3>
                       </div>
                    </div>
                    <div className="flex flex-col flex-1">
                        <div className="p-3 sm:hidden border-b flex-1 flex items-center">
                            <h3 className="font-bold text-base line-clamp-2">{category?.name}</h3>
                        </div>
                        <CardFooter className="p-2 sm:p-3 flex justify-end gap-1 sm:gap-2 bg-card border-t-0 sm:border-t border-border mt-auto">
                           <Button size="sm" variant="ghost" className="h-8 md:h-9 text-xs sm:text-sm px-2 sm:px-3 text-muted-foreground hover:text-primary hover:bg-primary/10 flex-1 sm:flex-none" onClick={() => handleEditCategory(category)}>
                             <Edit className="h-3.5 w-3.5 sm:mr-2" /> <span className="hidden sm:inline">Modifier</span>
                           </Button>
                           {canDelete && (
                             <Button size="sm" variant="ghost" className="h-8 md:h-9 text-xs sm:text-sm px-2 sm:px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-1 sm:flex-none" onClick={(e) => { e.stopPropagation(); handleDeleteClick(category, 'category'); }}>
                               <Trash2 className="h-3.5 w-3.5 sm:mr-2" /> <span className="hidden sm:inline">Supprimer</span>
                             </Button>
                           )}
                        </CardFooter>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <CategoryModal open={isCategoryModalOpen} onClose={() => { setIsCategoryModalOpen(false); retryCategories(); }} category={selectedItem} />
        <ProductModal open={isProductModalOpen} onClose={() => { setIsProductModalOpen(false); retryProducts(); }} product={selectedItem} categories={safeCategories} />
        
        {canDelete && (
          <DeleteWithReasonModal 
            open={isDeleteModalOpen} 
            onClose={() => setIsDeleteModalOpen(false)} 
            onConfirm={executeDelete} 
            loading={productDeleting || categoryDeleting} 
            requireReason={true}
            title={`Supprimer ${deleteType === 'product' ? 'le produit' : 'la catégorie'}`}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMenuPage;