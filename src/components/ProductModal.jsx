import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { uploadImage } from '@/lib/imageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { SoundButtonWrapper as Button } from '@/components/SoundButtonWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Percent, AlertCircle, Plus, Trash2, FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { getValidatedRestaurantId } from '@/lib/restaurantValidation';
import { VariantsEditor } from '@/components/VariantsEditor';
import { useMenuItemVariants, saveVariants } from '@/hooks/useMenuItemVariants';
import { useMenuItemIngredients } from '@/hooks/useMenuItemIngredients';

export const ProductModal = ({ open, onClose, product = null, categories = [] }) => {
  const { t } = useTranslation();
  const { restaurantId } = useRestaurant();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPromo, setIsPromo] = useState(false);
  const [loyaltyOverride, setLoyaltyOverride] = useState('');
  const [rlsError, setRlsError] = useState(null);
  const [localVariants, setLocalVariants] = useState([]);
  const [localIngredients, setLocalIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const { variants: existingVariants } = useMenuItemVariants(product?.id);
  const { links: existingIngredientLinks, saveLinks } = useMenuItemIngredients(product?.id);
  const { toast } = useToast();

  const safeCategories = Array.isArray(categories) ? categories : [];

  useEffect(() => {
    if (product) {
      setValue('name', product.name || '');
      setValue('description', product.description || '');
      setValue('price', product.price || 0);
      setValue('preparation_time', product.preparation_time || 0);
      setValue('promo_discount', product.promo_discount || 0);
      
      setSelectedCategory(product.category_id || '');
      setIsAvailable(product.is_available ?? true);
      setIsPromo(product.is_promo || false);
      setPreviewUrl(product.image_url || '');
      setLoyaltyOverride(product.loyalty_discount_override !== null && product.loyalty_discount_override !== undefined
        ? String(product.loyalty_discount_override) : '');
    } else {
      reset();
      setSelectedCategory('');
      setIsAvailable(true);
      setIsPromo(false);
      setPreviewUrl('');
      setLoyaltyOverride('');
      setLocalVariants([]);
    }
    setImageFile(null);
    setRlsError(null);
  }, [product, open, reset, setValue]);

  useEffect(() => {
    setLocalVariants(existingVariants.map(v => ({
      ...v,
      options: v.menu_item_variant_options || []
    })));
  }, [existingVariants]);

  useEffect(() => {
    setLocalIngredients(existingIngredientLinks.map(l => ({
      ingredient_id: l.ingredient_id,
      name: l.ingredients?.name || '',
      quantity_per_serving: l.quantity_per_serving,
      unit: l.unit || l.ingredients?.unit || '',
      current_stock: l.ingredients?.current_stock,
    })));
  }, [existingIngredientLinks]);

  useEffect(() => {
    supabase.from('ingredients').select('id, name, unit, current_stock').order('name')
      .then(({ data }) => setAllIngredients(data || []));
  }, [open]);

  // Auto prep_time=0 when selected category is beverage
  const selectedCategoryObj = safeCategories.find(c => c.id === selectedCategory);
  useEffect(() => {
    if (selectedCategoryObj?.is_beverage) setValue('preparation_time', 0);
  }, [selectedCategory, selectedCategoryObj?.is_beverage, setValue]);

  const handleImageChange = (e) => {
    const file = e.target?.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('common.image_upload_error', { defaultValue: 'Erreur d\'image' }),
          description: t('common.image_size_error', { defaultValue: 'Image trop volumineuse' }),
          variant: "destructive"
        });
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setRlsError(null);
    if (!selectedCategory) {
      toast({ title: t('common.error', { defaultValue: 'Erreur' }), description: t('admin.product_modal.error_category', { defaultValue: 'Veuillez sélectionner une catégorie' }), variant: "destructive" });
      return;
    }

    const discountVal = parseFloat(data.promo_discount || 0);
    if (isPromo && (discountVal < 0 || discountVal > 100)) {
       toast({ title: t('common.error', { defaultValue: 'Erreur' }), description: t('admin.product_modal.error_discount', { defaultValue: 'Remise invalide' }), variant: "destructive" });
       return;
    }

    try {
      setLoading(true);

      const validRestaurantId = getValidatedRestaurantId(restaurantId);

      // Verify Auth Session before attempting operation
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        throw new Error("Session d'authentification invalide. Veuillez vous reconnecter.");
      }

      let imageUrl = product?.image_url || null;

      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile, 'menu-images', 'products');
        } catch (uploadErr) {
          toast({ 
            title: t('common.image_upload_error', { defaultValue: 'Erreur upload' }), 
            description: uploadErr.message || "Impossible de télécharger l'image.", 
            variant: "destructive" 
          });
          setLoading(false);
          return; 
        }
      }

      const payload = {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price),
        preparation_time: parseInt(data.preparation_time) || 0,
        category_id: selectedCategory,
        is_available: isAvailable,
        image_url: imageUrl,
        is_promo: isPromo,
        promo_discount: isPromo ? discountVal : 0,
        loyalty_discount_override: loyaltyOverride !== '' ? parseFloat(loyaltyOverride) : null,
        restaurant_id: validRestaurantId
      };

      let error;
      if (product && product.id) {
        const { error: updateError } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', product.id)
          .eq('restaurant_id', validRestaurantId); // Safety check
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('menu_items')
          .insert([payload]);
        error = insertError;
      }

      if (error) {
        console.error("Supabase Database Error:", error);
        if (error.code === '42501') {
           setRlsError(`Erreur de permission (RLS). Code 42501. L'opération a été bloquée par la base de données. ${error.message}`);
           throw new Error("Permission refusée (RLS). Vérifiez que vous êtes bien authentifié et autorisé pour ce restaurant.");
        }
        if (error.code === '23503') { // Foreign key violation
           setRlsError(`Erreur de contrainte FK (23503). Le restaurant ID: ${validRestaurantId} n'existe pas.`);
           throw new Error("Erreur: Restaurant non configuré ou invalide. Veuillez contacter l'administrateur.");
        }
        throw error;
      }

      // Save variants + ingredient links
      const savedId = product?.id || (await supabase.from('menu_items').select('id').eq('name', data.name).eq('restaurant_id', getValidatedRestaurantId(restaurantId)).maybeSingle().then(r => r.data?.id));
      if (savedId) {
        await saveVariants(savedId, localVariants);
        await saveLinks(savedId, localIngredients.filter(l => l.ingredient_id));
      }

      toast({
        title: t('admin.product_modal.success_title', { defaultValue: 'Succès' }),
        description: product ? t('admin.product_modal.success_msg_update', { defaultValue: 'Produit mis à jour' }) : t('admin.product_modal.success_msg_create', { defaultValue: 'Produit créé' }),
        variant: "default",
        className: "bg-amber-500 text-white"
      });
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: t('common.error', { defaultValue: 'Erreur' }),
        description: error.message || t('admin.category_modal.error_msg', { defaultValue: 'Une erreur est survenue' }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card text-foreground border-border max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>{product ? t('admin.product_modal.edit_title', { defaultValue: 'Modifier le produit' }) : t('admin.product_modal.create_title', { defaultValue: 'Nouveau produit' })}</DialogTitle>
          <DialogDescription>
            {product ? t('admin.product_modal.edit_desc', { defaultValue: 'Modifiez les informations ci-dessous.' }) : t('admin.product_modal.create_desc', { defaultValue: 'Remplissez les informations ci-dessous.' })}
          </DialogDescription>
        </DialogHeader>

        {rlsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur d'accès</AlertTitle>
            <AlertDescription className="text-xs break-words">{rlsError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('admin.product_modal.name_label', { defaultValue: 'Nom' })}</Label>
              <Input
                id="name"
                {...register('name', { required: t('common.required', { defaultValue: 'Requis' }) })}
                placeholder={t('admin.product_modal.name_placeholder', { defaultValue: 'Nom du produit' })}
                className="bg-background border-input text-foreground"
              />
              {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t('admin.product_modal.category_label', { defaultValue: 'Catégorie' })}</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder={t('admin.product_modal.category_placeholder', { defaultValue: 'Choisir' })} />
                </SelectTrigger>
                <SelectContent>
                  {safeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">{t('admin.product_modal.price_label', { defaultValue: 'Prix' })}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register('price', { required: t('common.required', { defaultValue: 'Requis' }), min: 0 })}
                placeholder="0.00"
                className="bg-background border-input text-foreground"
              />
              {errors.price && <span className="text-sm text-red-500">{errors.price.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prep_time">{t('admin.product_modal.prep_time_label', { defaultValue: 'Temps (min)' })}</Label>
              <Input
                id="prep_time"
                type="number"
                min="0"
                {...register('preparation_time')}
                placeholder="15"
                className="bg-background border-input text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('admin.product_modal.desc_label', { defaultValue: 'Description' })}</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('admin.product_modal.desc_placeholder', { defaultValue: 'Description optionnelle' })}
              className="bg-background border-input min-h-[100px] text-foreground"
            />
          </div>

          {/* Promotion Section */}
          <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-lg space-y-4">
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-amber-900">{t('admin.product_modal.promo_section', { defaultValue: 'Promotion' })}</Label>
                  <p className="text-xs text-amber-700/70">{t('admin.product_modal.promo_desc', { defaultValue: 'Activer une réduction sur ce produit' })}</p>
                </div>
                <Switch
                  checked={isPromo}
                  onCheckedChange={setIsPromo}
                  className="data-[state=checked]:bg-amber-500"
                />
             </div>

             {isPromo && (
               <div className="pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                  <Label htmlFor="promo_discount" className="text-sm font-medium text-amber-900">{t('admin.product_modal.promo_percent', { defaultValue: 'Pourcentage' })}</Label>
                  <div className="relative mt-1.5">
                    <Percent className="absolute left-3 top-2.5 h-4 w-4 text-amber-500" />
                    <Input
                      id="promo_discount"
                      type="number"
                      min="0"
                      max="100"
                      {...register('promo_discount', { min: 0, max: 100 })}
                      placeholder="Ex: 20"
                      className="pl-9 bg-white border-amber-200 focus:border-green-500 focus:ring-green-500 text-foreground"
                    />
                  </div>
                  {watch('price') && watch('promo_discount') > 0 && (
                      <p className="text-sm text-amber-700 mt-2 font-medium">
                        {t('admin.product_modal.new_price', { defaultValue: 'Nouveau prix' })}: <span className="line-through opacity-70">{parseFloat(watch('price') || 0).toLocaleString()}</span> 
                        {' '} → {' '}
                        <span className="font-bold">
                          {(parseFloat(watch('price') || 0) * (1 - (parseFloat(watch('promo_discount') || 0) / 100))).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </p>
                  )}
               </div>
             )}
          </div>

          <div className="p-4 border border-green-200 bg-green-50/50 rounded-lg space-y-3">
            <div>
              <Label className="text-base font-semibold text-green-900">Réduction fidélité (override)</Label>
              <p className="text-xs text-green-700/70 mt-0.5">Laisser vide = utiliser le % global. Mettre 0 = désactiver pour ce plat.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-28">
                <Percent className="absolute left-3 top-2.5 h-4 w-4 text-green-500" />
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={loyaltyOverride}
                  onChange={e => setLoyaltyOverride(e.target.value)}
                  placeholder="Global"
                  className="pl-9 bg-white border-green-200 text-foreground"
                />
              </div>
              <span className="text-xs text-green-700">% sur ce plat uniquement</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('admin.product_modal.image_label', { defaultValue: 'Image' })}</Label>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop";
                  }} />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer file:text-foreground file:bg-secondary file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-4 file:text-sm hover:file:bg-secondary/80"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.product_modal.image_hint', { defaultValue: 'Max 5MB' })}
                </p>
              </div>
            </div>
          </div>

          {/* Variants Section */}
          <div className="p-4 border border-blue-200 bg-blue-50/30 rounded-lg">
            <VariantsEditor variants={localVariants} onChange={setLocalVariants} />
          </div>

          {/* Ingredients Section */}
          <div className="p-4 border border-purple-200 bg-purple-50/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-purple-900 text-sm">Ingrédients partagés (Stock commun)</span>
              </div>
              <button
                type="button"
                onClick={() => setLocalIngredients(prev => [...prev, { ingredient_id: '', name: '', quantity_per_serving: 1, unit: '', current_stock: null }])}
                className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded-md transition-colors"
              >
                <Plus className="h-3 w-3" /> Ajouter
              </button>
            </div>
            <p className="text-xs text-purple-600/80">Liez les ingrédients partagés entre plats. Ex: "viande" partagée entre Mafé et Bouillon.</p>
            {localIngredients.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-2">Aucun ingrédient lié — ce plat a son propre stock indépendant.</p>
            )}
            <div className="space-y-2">
              {localIngredients.map((link, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg border border-purple-100 p-2">
                  <select
                    value={link.ingredient_id}
                    onChange={e => {
                      const ing = allIngredients.find(a => a.id === e.target.value);
                      setLocalIngredients(prev => prev.map((l, idx) => idx === i ? {
                        ...l, ingredient_id: e.target.value,
                        name: ing?.name || '', unit: ing?.unit || '', current_stock: ing?.current_stock ?? null
                      } : l));
                    }}
                    className="flex-1 text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  >
                    <option value="">-- Choisir un ingrédient --</option>
                    {allIngredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name} {ing.unit ? `(${ing.unit})` : ''} — stock: {ing.current_stock ?? '∞'}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={link.quantity_per_serving}
                    onChange={e => setLocalIngredients(prev => prev.map((l, idx) => idx === i ? { ...l, quantity_per_serving: e.target.value } : l))}
                    className="w-20 text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-400"
                    placeholder="Qté"
                  />
                  <span className="text-xs text-slate-500 w-10 truncate">{link.unit || 'unité'}</span>
                  <button
                    type="button"
                    onClick={() => setLocalIngredients(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-600 p-1 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-base">{t('admin.product_modal.availability_label', { defaultValue: 'Disponible' })}</Label>
              <p className="text-sm text-muted-foreground">
                {t('admin.product_modal.availability_desc', { defaultValue: 'Afficher ce produit sur le menu public' })}
              </p>
            </div>
            <Switch
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} soundType="click">
              {t('admin.product_modal.cancel', { defaultValue: 'Annuler' })}
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90" isLoading={loading} soundType="success">
              {product ? t('admin.product_modal.save', { defaultValue: 'Enregistrer' }) : t('admin.product_modal.create', { defaultValue: 'Créer' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};