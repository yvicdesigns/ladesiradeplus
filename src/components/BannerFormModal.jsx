import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Upload, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { BannerPreviewCard } from '@/components/BannerPreviewCard';
import { calculateDiscountedPrice, formatPrice } from '@/lib/promoUtils';

// Define robust default values to avoid null/undefined errors
const DEFAULT_BANNER = {
  title: '',
  discount_percentage: 0,
  banner_type: 'image_text',
  show_text: true,
  show_button: true,
  show_image: true,
  is_active: true,
  display_order: 0,
  background_color_type: 'solid',
  background_color_solid: '#FF6B35',
  background_gradient_color1: '#FF6B35',
  background_gradient_color2: '#EA580C',
  background_gradient_direction: 'to-bottom-right',
  text_color: '#FFFFFF',
  button_color: '#000000', 
  button_text: 'Commande', 
  button_text_color: '#FFFFFF',
  active_image_url: '', 
  product_image_url: '',
  link_url: '',
  product_id: 'none',
  discount_type: 'percentage',
  discount_value: 0,
  original_price: 0
};

export const BannerFormModal = ({ open, onClose, banner = null, onSave }) => {
  const [formData, setFormData] = useState(DEFAULT_BANNER);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pricePreview, setPricePreview] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (banner) {
        setFormData({
          ...DEFAULT_BANNER,
          ...banner,
          // Ensure we use active_image_url, fallback to image_url only if active is missing (legacy data)
          active_image_url: banner.active_image_url || banner.image_url || '',
          product_id: banner.product_id || banner.linked_product_id || 'none',
          discount_type: banner.discount_type || 'percentage',
          discount_value: Number(banner.discount_value) || Number(banner.discount_percentage) || 0,
          original_price: Number(banner.original_price) || 0,
          button_text: banner.button_text || 'Commande', 
          button_color: banner.button_color || '#000000'
        });
      } else {
        setFormData({ ...DEFAULT_BANNER });
      }
      fetchProducts();
    }
  }, [open, banner]);

  useEffect(() => {
    // Real-time calculation for preview
    if (formData.product_id && formData.product_id !== 'none' && formData.original_price) {
      const calculated = calculateDiscountedPrice(formData.original_price, formData.discount_type, formData.discount_value);
      setPricePreview({
        original: formatPrice(formData.original_price),
        final: calculated.formatted
      });
    } else {
      setPricePreview(null);
    }
  }, [formData.original_price, formData.discount_type, formData.discount_value, formData.product_id]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, price, image_url')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger la liste des produits" });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (productId) => {
    handleChange('product_id', productId);
    
    if (productId !== 'none') {
      const product = products.find(p => p.id === productId);
      if (product) {
        setFormData(prev => ({
          ...prev,
          product_id: productId,
          original_price: product.price,
          product_image_url: product.image_url || prev.product_image_url,
          title: prev.title || `Promo sur ${product.name}`,
          // Set sensible defaults if choosing a product
          discount_type: prev.discount_type || 'percentage',
          discount_value: prev.discount_value || 10,
          discount_percentage: prev.discount_type === 'percentage' ? prev.discount_value : 0
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        product_id: 'none',
        original_price: 0
      }));
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Image trop lourde", description: "La taille maximale est de 5Mo." });
        return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `promo-banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('promo-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('promo-images')
        .getPublicUrl(filePath);

      handleChange(field, data.publicUrl);
      toast({ title: "Image téléchargée", className: "bg-amber-500 text-white" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'upload",
        description: error.message || "Échec du téléchargement"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.title || formData.title.trim() === '') {
        toast({ variant: "destructive", title: "Titre manquant", description: "Veuillez donner un titre à votre bannière." });
        setLoading(false);
        return;
    }

    if (formData.product_id !== 'none' && formData.product_id) {
       if (formData.discount_value <= 0) {
           toast({
             variant: "destructive",
             title: "Réduction invalide",
             description: "La valeur de la réduction doit être supérieure à 0."
           });
           setLoading(false);
           return;
       }
    }
    
    // Prepare Data
    const dataToSave = {
      ...formData,
      // Ensure product_id is null if 'none'
      product_id: formData.product_id === 'none' ? null : formData.product_id,
      linked_product_id: formData.product_id === 'none' ? null : formData.product_id,
      // Ensure numeric types
      discount_percentage: Number(formData.discount_percentage),
      discount_value: Number(formData.discount_value),
      original_price: Number(formData.original_price),
      display_order: Number(formData.display_order)
    };

    // Remove legacy/redundant fields to keep payload clean
    if (dataToSave.image_url) delete dataToSave.image_url;
    
    try {
      console.log("Submitting banner form:", dataToSave);
      await onSave(dataToSave);
    } catch (error) {
       console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const mockDragHandleProps = {};

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-gray-50/50">
          <DialogTitle className="flex items-center gap-2">
              {banner ? 'Modifier la bannière' : 'Nouvelle bannière'}
              {banner && banner.id && <span className="text-xs font-normal text-muted-foreground bg-gray-200 px-2 py-0.5 rounded">ID: {banner.id.substring(0,8)}...</span>}
          </DialogTitle>
          <DialogDescription>Configurez l'apparence et le contenu de votre bannière promotionnelle.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
            <ScrollArea className="h-[60vh] lg:h-auto border-r">
              <div className="p-6 space-y-6">
                
                {/* General Settings */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Type de bannière</Label>
                        <Select 
                          value={formData.banner_type} 
                          onValueChange={(val) => handleChange('banner_type', val)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image_text">Image + Texte</SelectItem>
                            <SelectItem value="text_only">Texte seul</SelectItem>
                            <SelectItem value="image_only">Image seule</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label>Statut</Label>
                        <div className="flex items-center space-x-2 pt-2 border rounded-md p-2">
                          <Switch 
                            checked={formData.is_active}
                            onCheckedChange={(val) => handleChange('is_active', val)}
                          />
                          <span className={`text-sm font-medium ${formData.is_active ? 'text-amber-600' : 'text-gray-500'}`}>
                              {formData.is_active ? 'Active (Visible)' : 'Inactive (Cachée)'}
                          </span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-primary font-semibold">Titre de la promotion *</Label>
                    <Input 
                      value={formData.title} 
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Ex: -50% sur les burgers"
                      className="font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pourcentage de réduction (Affichage) %</Label>
                    <Input 
                      type="number" 
                      value={formData.discount_percentage} 
                      onChange={(e) => handleChange('discount_percentage', Number(e.target.value))}
                      placeholder="Ex: 50"
                    />
                    <p className="text-xs text-muted-foreground">Sera affiché comme "X% OFF" sur la bannière.</p>
                  </div>

                  {/* Product Linking Section */}
                  <div className="space-y-2 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <Label className="mb-2 block text-blue-900 font-semibold flex items-center gap-2">
                        Lier un produit (Optionnel)
                        {formData.product_id !== 'none' && <span className="text-xs font-normal bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Actif</span>}
                    </Label>
                    <Select 
                      value={formData.product_id || 'none'} 
                      onValueChange={handleProductChange}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choisir un produit..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Aucun produit lié --</SelectItem>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} - {formatPrice(p.price)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {formData.product_id !== 'none' && formData.product_id && (
                      <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="space-y-2">
                           <Label>Type de réduction</Label>
                           <Select 
                              value={formData.discount_type} 
                              onValueChange={(val) => handleChange('discount_type', val)}
                           >
                             <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                               <SelectItem value="fixed_amount">Montant fixe (FCFA)</SelectItem>
                             </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label>Valeur Réduction</Label>
                           <Input 
                             type="number" 
                             min="0"
                             className="bg-white"
                             value={formData.discount_value} 
                             onChange={(e) => {
                               const val = Number(e.target.value);
                               handleChange('discount_value', val);
                               // Automatically update discount_percentage if type is percentage
                               if (formData.discount_type === 'percentage') {
                                   handleChange('discount_percentage', val);
                               }
                             }}
                           />
                        </div>
                        
                        {pricePreview && (
                          <div className="col-span-2 mt-2 p-3 bg-amber-100/50 text-amber-900 text-sm rounded-lg border border-amber-200 flex justify-between items-center shadow-sm">
                             <span className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase">Prix Original</span>
                                <span className="line-through font-medium opacity-60">{pricePreview.original}</span>
                             </span>
                             <div className="h-8 w-[1px] bg-green-300 mx-4"></div>
                             <span className="flex flex-col items-end">
                                <span className="text-xs text-amber-700 uppercase font-bold">Nouveau Prix</span>
                                <span className="font-bold text-xl text-amber-700">{pricePreview.final}</span>
                             </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {(!formData.product_id || formData.product_id === 'none') && (
                    <div className="space-y-2">
                       <Label>Lien externe (Si pas de produit)</Label>
                       <Input 
                         value={formData.link_url || ''} 
                         onChange={(e) => handleChange('link_url', e.target.value)}
                         placeholder="https://..." 
                       />
                       <p className="text-xs text-muted-foreground">Note: Le lien redirige l'utilisateur au clic.</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Ordre d'affichage</Label>
                    <Input 
                      type="number" 
                      value={formData.display_order} 
                      onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <Tabs defaultValue="visual" className="w-full pt-4 border-t">
                  <TabsList className="w-full">
                    <TabsTrigger value="visual" className="flex-1">Apparence</TabsTrigger>
                    <TabsTrigger value="images" className="flex-1">Images</TabsTrigger>
                    <TabsTrigger value="colors" className="flex-1">Couleurs</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="visual" className="space-y-4 pt-4">
                    <div className="flex flex-col gap-3">
                       <div className="flex items-center justify-between border p-3 rounded-lg hover:bg-gray-50 transition-colors">
                         <Label className="cursor-pointer" htmlFor="show-text">Afficher le titre</Label>
                         <Switch id="show-text" checked={formData.show_text} onCheckedChange={(v) => handleChange('show_text', v)} />
                       </div>
                       <div className="flex items-center justify-between border p-3 rounded-lg hover:bg-gray-50 transition-colors">
                         <Label className="cursor-pointer" htmlFor="show-btn">Afficher le bouton d'action</Label>
                         <Switch id="show-btn" checked={formData.show_button} onCheckedChange={(v) => handleChange('show_button', v)} />
                       </div>
                       
                       {formData.show_button && (
                           <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                               <Label>Texte du bouton</Label>
                               <Input 
                                   value={formData.button_text}
                                   onChange={(e) => handleChange('button_text', e.target.value)}
                                   placeholder="Ex: Commande"
                               />
                           </div>
                       )}

                       <div className="flex items-center justify-between border p-3 rounded-lg hover:bg-gray-50 transition-colors">
                         <Label className="cursor-pointer" htmlFor="show-bg">Afficher image de fond</Label>
                         <Switch id="show-bg" checked={formData.show_image} onCheckedChange={(v) => handleChange('show_image', v)} />
                       </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="images" className="space-y-4 pt-4">
                     <div className="space-y-3">
                        <Label>Image de fond (Bannière)</Label>
                        <div className="flex gap-2">
                          <Input value={formData.active_image_url || ''} onChange={(e) => handleChange('active_image_url', e.target.value)} placeholder="https://..." className="flex-1" />
                          <div className="relative">
                            <input 
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'active_image_url')}
                                disabled={uploading}
                            />
                            <Button variant="outline" size="icon" type="button" disabled={uploading}>
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Recommandé: Image large type paysage.</p>
                     </div>

                     <div className="space-y-3 pt-2 border-t">
                        <Label>Image du produit (Avant-plan)</Label>
                        <div className="flex gap-2">
                          <Input value={formData.product_image_url || ''} onChange={(e) => handleChange('product_image_url', e.target.value)} placeholder="https://..." className="flex-1" />
                          <div className="relative">
                            <input 
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'product_image_url')}
                                disabled={uploading}
                            />
                            <Button variant="outline" size="icon" type="button" disabled={uploading}>
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Sera affiché en cercle par dessus le fond.</p>
                     </div>
                  </TabsContent>

                  <TabsContent value="colors" className="space-y-4 pt-4">
                     <div className="space-y-3">
                        <Label>Type de fond</Label>
                        <Select 
                          value={formData.background_color_type} 
                          onValueChange={(val) => handleChange('background_color_type', val)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Couleur unie</SelectItem>
                            <SelectItem value="gradient">Dégradé</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>

                     {formData.background_color_type === 'solid' ? (
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <Label>Couleur de fond</Label>
                             <div className="flex gap-2">
                               <input type="color" className="h-9 w-9 p-0 border rounded cursor-pointer shrink-0" value={formData.background_color_solid} onChange={(e) => handleChange('background_color_solid', e.target.value)} />
                               <Input value={formData.background_color_solid} onChange={(e) => handleChange('background_color_solid', e.target.value)} />
                             </div>
                          </div>
                       </div>
                     ) : (
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label>Couleur 1</Label>
                             <div className="flex gap-2">
                               <input type="color" className="h-9 w-9 p-0 border rounded cursor-pointer shrink-0" value={formData.background_gradient_color1} onChange={(e) => handleChange('background_gradient_color1', e.target.value)} />
                               <Input value={formData.background_gradient_color1} onChange={(e) => handleChange('background_gradient_color1', e.target.value)} />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <Label>Couleur 2</Label>
                             <div className="flex gap-2">
                               <input type="color" className="h-9 w-9 p-0 border rounded cursor-pointer shrink-0" value={formData.background_gradient_color2} onChange={(e) => handleChange('background_gradient_color2', e.target.value)} />
                               <Input value={formData.background_gradient_color2} onChange={(e) => handleChange('background_gradient_color2', e.target.value)} />
                             </div>
                          </div>
                          <div className="col-span-2 space-y-2">
                             <Label>Direction</Label>
                             <Select value={formData.background_gradient_direction} onValueChange={(val) => handleChange('background_gradient_direction', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="to-bottom">Vers le bas</SelectItem>
                                   <SelectItem value="to-right">Vers la droite</SelectItem>
                                   <SelectItem value="to-bottom-right">Diagonale Bas-Droite</SelectItem>
                                   <SelectItem value="to-bottom-left">Diagonale Bas-Gauche</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
                        </div>
                     )}
                     
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
                        <div className="space-y-2">
                             <Label>Couleur Texte</Label>
                             <div className="flex gap-2">
                               <input type="color" className="h-9 w-9 p-0 border rounded cursor-pointer shrink-0" value={formData.text_color} onChange={(e) => handleChange('text_color', e.target.value)} />
                               <Input value={formData.text_color} onChange={(e) => handleChange('text_color', e.target.value)} />
                             </div>
                        </div>
                        <div className="space-y-2">
                             <Label>Couleur Bouton</Label>
                             <div className="flex gap-2">
                               <input 
                                    type="color" 
                                    className="h-9 w-9 p-0 border rounded cursor-pointer shrink-0" 
                                    value={formData.button_color} 
                                    onChange={(e) => handleChange('button_color', e.target.value)} 
                               />
                               <Input value={formData.button_color} onChange={(e) => handleChange('button_color', e.target.value)} />
                             </div>
                        </div>
                        <div className="space-y-2">
                             <Label>Couleur Texte Bouton</Label>
                             <div className="flex gap-2">
                               <input type="color" className="h-9 w-9 p-0 border rounded cursor-pointer shrink-0" value={formData.button_text_color} onChange={(e) => handleChange('button_text_color', e.target.value)} />
                               <Input value={formData.button_text_color} onChange={(e) => handleChange('button_text_color', e.target.value)} />
                             </div>
                        </div>
                     </div>

                  </TabsContent>
                </Tabs>

              </div>
            </ScrollArea>

            <div className="bg-gray-100 flex flex-col p-6 items-center justify-center border-t lg:border-t-0 lg:border-l">
                <div className="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wide">Aperçu en direct</div>
                
                <div className="w-full max-w-sm scale-110 transform transition-transform">
                   <div className="w-full h-40 sm:h-44 rounded-2xl shadow-lg relative overflow-hidden bg-white ring-1 ring-gray-900/5">
                       <BannerPreviewCard 
                         banner={formData} 
                         dragHandleProps={mockDragHandleProps}
                         isFormPreview={true}
                         onEdit={()=>{}}
                         onDelete={()=>{}}
                         onDuplicate={()=>{}}
                       />
                       <div className="absolute inset-0 z-50 cursor-default" title="Aperçu non cliquable" /> 
                   </div>
                </div>

                <div className="mt-8 text-center text-sm text-gray-400 max-w-xs leading-relaxed">
                    Ceci est un aperçu approximatif.<br/>L'apparence réelle peut varier légèrement selon l'appareil du client.
                </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50 flex flex-row justify-end gap-2">
           <Button variant="outline" onClick={onClose} disabled={loading} className="gap-2">
             <X className="w-4 h-4" /> Annuler
           </Button>
           <Button onClick={handleSubmit} disabled={loading} className="gap-2">
             {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="w-4 h-4" />}
             {banner ? 'Enregistrer les modifications' : 'Créer la bannière'}
           </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};