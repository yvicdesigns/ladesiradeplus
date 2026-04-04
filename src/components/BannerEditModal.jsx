import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { uploadImage } from '@/lib/imageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Upload, FileImage as ImageIcon, Palette, X, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const BannerEditModal = ({ open, onClose, banner, onSave }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const productImageInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [promoProducts, setPromoProducts] = useState([]);
  
  // Form State - strictly adhering to schema
  const [formData, setFormData] = useState({
    banner_type: 'image_text',
    title: '',
    discount_percentage: 0,
    show_text: true,
    show_button: true,
    show_image: true,
    active_image_url: '', // Corrected from image_url
    product_image_url: '', 
    linked_product_id: 'none',
    link_url: '', 
    display_order: 0,
    is_active: true,
    // Color Fields
    background_color_type: 'solid',
    background_color_solid: '#1f2937',
    background_gradient_color1: '#1f2937',
    background_gradient_color2: '#4b5563',
    background_gradient_direction: 'to-right',
    text_color: '#ffffff',
    button_color: '#ffffff',
    button_text_color: '#000000'
  });

  useEffect(() => {
    if (open) {
      fetchPromoProducts();
      if (banner) {
        setFormData({
            banner_type: banner.banner_type || 'image_text',
            title: banner.title || '',
            discount_percentage: banner.discount_percentage || 0,
            show_text: banner.show_text ?? true,
            show_button: banner.show_button ?? true,
            show_image: banner.show_image ?? true,
            active_image_url: banner.active_image_url || banner.image_url || '', // Handle legacy image_url
            product_image_url: banner.product_image_url || '',
            linked_product_id: banner.linked_product_id || 'none',
            link_url: banner.link_url || '',
            display_order: banner.display_order || 0,
            is_active: banner.is_active ?? true,
            // Colors with defaults
            background_color_type: banner.background_color_type || 'solid',
            background_color_solid: banner.background_color_solid || '#1f2937',
            background_gradient_color1: banner.background_gradient_color1 || '#1f2937',
            background_gradient_color2: banner.background_gradient_color2 || '#4b5563',
            background_gradient_direction: banner.background_gradient_direction || 'to-right',
            text_color: banner.text_color || '#ffffff',
            button_color: banner.button_color || '#ffffff',
            button_text_color: banner.button_text_color || '#000000'
        });
      } else {
        // Reset for new banner with default values
        setFormData({
            banner_type: 'image_text',
            title: '',
            discount_percentage: 0,
            show_text: true,
            show_button: true,
            show_image: true,
            active_image_url: '',
            product_image_url: '',
            linked_product_id: 'none',
            link_url: '',
            display_order: 0,
            is_active: true,
            // Default Colors
            background_color_type: 'solid',
            background_color_solid: '#FF6B35', // Default orange
            background_gradient_color1: '#1f2937',
            background_gradient_color2: '#4b5563',
            background_gradient_direction: 'to-right',
            text_color: '#ffffff',
            button_color: '#ffffff',
            button_text_color: '#FF6B35'
        });
      }
    }
  }, [open, banner]);

  const fetchPromoProducts = async () => {
    try {
      const { data: products } = await supabase
        .from('menu_items')
        .select('id, name')
        .eq('is_available', true)
        .order('name');
        
      setPromoProducts(products || []);
    } catch (err) {
      console.error("Error fetching promo products:", err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handler for background image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const publicUrl = await uploadImage(file, 'promo-images');
      setFormData(prev => ({ ...prev, active_image_url: publicUrl }));
      toast({ title: "Image de fond téléchargée", description: "L'image a été ajoutée avec succès." });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Échec du téléchargement." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handler for circular product image upload
  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingProductImage(true);
      const publicUrl = await uploadImage(file, 'promo-images');
      setFormData(prev => ({ ...prev, product_image_url: publicUrl }));
      toast({ title: "Image du plat téléchargée", description: "L'image a été ajoutée avec succès." });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Échec du téléchargement." });
    } finally {
      setUploadingProductImage(false);
      if (productImageInputRef.current) productImageInputRef.current.value = '';
    }
  };

  const removeProductImage = () => {
      setFormData(prev => ({ ...prev, product_image_url: '' }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (formData.banner_type === 'image_only' && !formData.active_image_url) {
        toast({ variant: "destructive", title: "Image requise", description: "Veuillez ajouter une image pour le type 'Image Seule'." });
        return;
    }
    
    try {
      setLoading(true);
      const dataToSave = {
        ...formData,
        linked_product_id: formData.linked_product_id === 'none' ? null : formData.linked_product_id
      };
      
      // Ensure no legacy image_url is sent
      if (dataToSave.image_url) delete dataToSave.image_url;

      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPreviewProductLabel = () => {
    if (!formData.linked_product_id || formData.linked_product_id === 'none') return null;
    const product = promoProducts.find(p => p.id === formData.linked_product_id);
    return product ? product.name : null;
  };

  // Helper to generate background style string for the preview
  const getBackgroundStyle = () => {
    if ((formData.banner_type === 'image_only' || formData.banner_type === 'image_text') && formData.active_image_url && formData.show_image) {
        return { backgroundImage: `url(${formData.active_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    
    if (formData.background_color_type === 'gradient') {
        const directionMap = {
            'to-bottom': 'to bottom',
            'to-right': 'to right',
            'to-bottom-right': 'to bottom right',
            'to-bottom-left': 'to bottom left'
        };
        const dir = directionMap[formData.background_gradient_direction] || 'to right';
        return { background: `linear-gradient(${dir}, ${formData.background_gradient_color1}, ${formData.background_gradient_color2})` };
    } else {
        return { backgroundColor: formData.background_color_solid };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto py-8 px-8 bg-card border-border">
        <DialogHeader>
          <DialogTitle>{banner ? "Modifier la Bannière" : "Ajouter une Bannière"}</DialogTitle>
          <DialogDescription>Configurez l'apparence et le comportement de la bannière promotionnelle.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          {/* LEFT: FORM */}
          <div className="space-y-4">
            <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content">Contenu</TabsTrigger>
                    <TabsTrigger value="style">Couleurs & Style</TabsTrigger>
                </TabsList>
                
                {/* CONTENT TAB */}
                <TabsContent value="content" className="space-y-4 mt-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type de Bannière</Label>
                            <Select value={formData.banner_type} onValueChange={(val) => handleInputChange('banner_type', val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="image_text">Image + Texte</SelectItem>
                                    <SelectItem value="text_only">Texte Seul</SelectItem>
                                    <SelectItem value="image_only">Image Seule</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Ordre d'affichage</Label>
                            <Input 
                                type="number" 
                                value={formData.display_order} 
                                onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)} 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Texte Principal (Titre)</Label>
                        <Input 
                            value={formData.title} 
                            onChange={(e) => handleInputChange('title', e.target.value)} 
                            maxLength={50}
                            placeholder="Ex: Offre Spéciale"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Réduction (%)</Label>
                            <Input 
                                type="number" 
                                min="0" max="100"
                                value={formData.discount_percentage} 
                                onChange={(e) => handleInputChange('discount_percentage', parseInt(e.target.value) || 0)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Produit Lié (Optionnel)</Label>
                            <Select value={formData.linked_product_id} onValueChange={(val) => handleInputChange('linked_product_id', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Aucun produit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Aucun produit</SelectItem>
                                    {promoProducts.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Show Link URL only if no product is selected */}
                    {(!formData.linked_product_id || formData.linked_product_id === 'none') && (
                       <div className="space-y-2">
                           <Label className="flex items-center gap-2"><LinkIcon className="h-3 w-3" /> Lien (URL)</Label>
                           <Input 
                               placeholder="https://... ou /menu/..." 
                               value={formData.link_url} 
                               onChange={(e) => handleInputChange('link_url', e.target.value)}
                           />
                           <p className="text-[10px] text-muted-foreground">Laissez vide si un produit est lié.</p>
                       </div>
                    )}

                    {/* Sync Indicator Message */}
                    {formData.linked_product_id && formData.linked_product_id !== 'none' && (
                        <Alert className="bg-blue-50 border-blue-200 text-blue-800 py-3">
                            <RefreshCw className="h-4 w-4" />
                            <AlertTitle className="text-sm font-semibold ml-2">Synchronisation Automatique</AlertTitle>
                            <AlertDescription className="text-xs ml-2 mt-1">
                                Le produit <strong>{getPreviewProductLabel()}</strong> sera automatiquement marqué en promotion 
                                avec une réduction de <strong>{formData.discount_percentage || 0}%</strong>.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Product Image Upload Section */}
                    <div className="space-y-2">
                        <Label>Image du Plat (Circulaire - Droite)</Label>
                        <div 
                            className="border-2 border-dashed border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer transition-colors relative"
                            onClick={() => !formData.product_image_url && productImageInputRef.current?.click()}
                        >
                             <input 
                                type="file" 
                                ref={productImageInputRef}
                                className="hidden" 
                                accept="image/*"
                                onChange={handleProductImageUpload}
                                disabled={uploadingProductImage}
                            />
                            {uploadingProductImage ? (
                                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            ) : formData.product_image_url ? (
                                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md">
                                    <img src={formData.product_image_url} alt="Product" className="w-full h-full object-cover" />
                                    <div 
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); removeProductImage(); }}
                                    >
                                        <X className="w-6 h-6" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                    <span className="text-xs text-muted-foreground">Cliquez pour ajouter l'image du plat</span>
                                </>
                            )}
                        </div>
                         {formData.product_image_url && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                                onClick={removeProductImage}
                            >
                                <X className="w-3 h-3 mr-1" /> Supprimer l'image du plat
                            </Button>
                        )}
                    </div>

                    {formData.banner_type !== 'text_only' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-1">
                                <Label>Image de fond</Label>
                                <div className="flex items-center gap-2">
                                     <Label htmlFor="show_image_toggle" className="text-xs font-normal text-muted-foreground">Afficher l'image</Label>
                                     <Switch 
                                        id="show_image_toggle"
                                        checked={formData.show_image} 
                                        onCheckedChange={(val) => handleInputChange('show_image', val)} 
                                     />
                                </div>
                            </div>
                            
                            {formData.show_image && (
                                <div 
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center text-center hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                    ) : formData.active_image_url ? (
                                        <div className="relative w-full h-24 bg-gray-100 rounded overflow-hidden">
                                            <img src={formData.active_image_url} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-xs font-medium">
                                                Changer l'image
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                            <span className="text-xs text-muted-foreground">Cliquez pour télécharger</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                     <div className="space-y-3 pt-2 border-t mt-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="is_active">Bannière Active</Label>
                            <Switch 
                                id="is_active" 
                                checked={formData.is_active} 
                                onCheckedChange={(val) => handleInputChange('is_active', val)} 
                            />
                        </div>
                        
                        {formData.banner_type !== 'image_only' && (
                            <>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="show_text">Afficher le texte</Label>
                                    <Switch 
                                        id="show_text" 
                                        checked={formData.show_text} 
                                        onCheckedChange={(val) => handleInputChange('show_text', val)} 
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="show_button">Afficher le bouton</Label>
                                    <Switch 
                                        id="show_button" 
                                        checked={formData.show_button} 
                                        onCheckedChange={(val) => handleInputChange('show_button', val)} 
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </TabsContent>

                {/* STYLE TAB */}
                <TabsContent value="style" className="space-y-3 mt-3">
                     {/* Background Settings */}
                     <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <Label className="flex items-center gap-2 font-bold text-gray-700">
                            <Palette className="w-4 h-4" /> Arrière-plan
                        </Label>
                        
                        <RadioGroup 
                            value={formData.background_color_type} 
                            onValueChange={(val) => handleInputChange('background_color_type', val)}
                            className="flex gap-3"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="solid" id="r1" />
                                <Label htmlFor="r1">Couleur unie</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="gradient" id="r2" />
                                <Label htmlFor="r2">Dégradé</Label>
                            </div>
                        </RadioGroup>

                        {formData.background_color_type === 'solid' ? (
                            <div className="flex items-center gap-3">
                                <input 
                                    type="color" 
                                    value={formData.background_color_solid}
                                    onChange={(e) => handleInputChange('background_color_solid', e.target.value)}
                                    className="h-9 w-20 p-1 rounded cursor-pointer border bg-white"
                                />
                                <span className="text-sm font-mono text-gray-500">{formData.background_color_solid}</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Couleur 1</Label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={formData.background_gradient_color1}
                                            onChange={(e) => handleInputChange('background_gradient_color1', e.target.value)}
                                            className="h-9 w-full p-1 rounded cursor-pointer border bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Couleur 2</Label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={formData.background_gradient_color2}
                                            onChange={(e) => handleInputChange('background_gradient_color2', e.target.value)}
                                            className="h-9 w-full p-1 rounded cursor-pointer border bg-white"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Direction</Label>
                                    <Select 
                                        value={formData.background_gradient_direction} 
                                        onValueChange={(val) => handleInputChange('background_gradient_direction', val)}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="to-bottom">Haut → Bas</SelectItem>
                                            <SelectItem value="to-right">Gauche → Droite</SelectItem>
                                            <SelectItem value="to-bottom-right">Diagonal (Bas-Droit)</SelectItem>
                                            <SelectItem value="to-bottom-left">Diagonal (Bas-Gauche)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                     </div>

                     {/* Text & Button Colors */}
                     <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <Label className="font-bold text-gray-700">Texte & Boutons</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Couleur Texte</Label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="color" 
                                        value={formData.text_color}
                                        onChange={(e) => handleInputChange('text_color', e.target.value)}
                                        className="h-9 w-12 p-1 rounded cursor-pointer border bg-white"
                                    />
                                    <span className="text-xs font-mono text-gray-500">{formData.text_color}</span>
                                </div>
                            </div>
                             <div className="space-y-1">
                                <Label className="text-xs">Couleur Bouton (Fond)</Label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="color" 
                                        value={formData.button_color}
                                        onChange={(e) => handleInputChange('button_color', e.target.value)}
                                        className="h-9 w-12 p-1 rounded cursor-pointer border bg-white"
                                    />
                                    <span className="text-xs font-mono text-gray-500">{formData.button_color}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Couleur Bouton (Texte)</Label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="color" 
                                        value={formData.button_text_color}
                                        onChange={(e) => handleInputChange('button_text_color', e.target.value)}
                                        className="h-9 w-12 p-1 rounded cursor-pointer border bg-white"
                                    />
                                    <span className="text-xs font-mono text-gray-500">{formData.button_text_color}</span>
                                </div>
                            </div>
                        </div>
                     </div>
                </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: PREVIEW */}
          <div className="space-y-4">
             <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Prévisualisation Mobile</Label>
             <div className="bg-gray-100 rounded-[2rem] border-8 border-gray-800 p-4 min-h-[400px] flex items-center justify-center relative overflow-hidden shadow-xl">
                
                {/* Simulated App Header */}
                <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 z-10 flex justify-center">
                    <div className="w-16 h-4 bg-black rounded-b-xl"></div>
                </div>

                {/* Banner Preview Container */}
                <div 
                    className="w-full relative rounded-xl overflow-hidden shadow-lg transform transition-all hover:scale-[1.02]"
                    style={{ minHeight: '160px' }} 
                >
                    
                    {/* Background Layer */}
                    <div 
                        className="absolute inset-0 w-full h-full"
                        style={getBackgroundStyle()}
                    >
                         {!formData.active_image_url && formData.show_image && (
                             <div className="w-full h-full flex items-center justify-center text-white/50">
                                <ImageIcon className="w-8 h-8 opacity-50" />
                             </div>
                         )}
                    </div>

                    {/* Overlay Layer for Image mode to make text readable */}
                    {(formData.active_image_url && formData.show_image) && (
                        <div className="absolute inset-0 bg-black/30"></div>
                    )}

                    {/* Content Layer */}
                    {formData.banner_type !== 'image_only' && (
                         <div className="relative p-4 z-10 w-full h-full min-h-[160px] flex items-center justify-between" style={{ color: formData.text_color }}>
                            {/* LEFT SIDE CONTENT */}
                            <div className="flex flex-col justify-center flex-1 pr-2">
                                {formData.show_text && (
                                    <>
                                        {formData.discount_percentage > 0 && (
                                            <div className="font-bold text-sm uppercase tracking-wider mb-1 opacity-90">
                                                -{formData.discount_percentage}%
                                            </div>
                                        )}
                                        <h3 className="font-extrabold text-2xl leading-tight drop-shadow-sm mb-1">
                                            {formData.title || "Votre texte ici"}
                                        </h3>
                                        {getPreviewProductLabel() && (
                                            <p className="text-xs opacity-80 mt-1 truncate">
                                                Sur: {getPreviewProductLabel()}
                                            </p>
                                        )}
                                    </>
                                )}
                                
                                {formData.show_button && (
                                    <div className="mt-4">
                                        <span 
                                            className="text-xs font-bold px-4 py-2 rounded-full shadow-sm inline-block"
                                            style={{ 
                                                backgroundColor: formData.button_color, 
                                                color: formData.button_text_color,
                                                border: (formData.background_color_type === 'solid' && formData.background_color_solid === formData.button_color && !formData.show_image) 
                                                    ? '1px solid rgba(255,255,255,0.5)' 
                                                    : 'none'
                                            }}
                                        >
                                            Commander
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT SIDE IMAGE */}
                            {formData.product_image_url && (
                                <div className="w-[120px] h-[120px] flex-shrink-0 rounded-full overflow-hidden border-2 border-white shadow-lg bg-white ml-2">
                                    <img 
                                        src={formData.product_image_url} 
                                        alt="Product" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                         </div>
                    )}
                </div>
                
                <div className="absolute bottom-4 left-0 right-0 text-center text-gray-400 text-xs px-4">
                    Ceci est une simulation de l'affichage mobile.
                </div>
             </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || uploading || uploadingProductImage}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BannerEditModal;