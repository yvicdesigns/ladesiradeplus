import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { uploadImage } from '@/lib/imageUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { SoundButtonWrapper as Button } from '@/components/SoundButtonWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Upload, AlertCircle, GlassWater } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { getValidatedRestaurantId } from '@/lib/restaurantValidation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const CategoryModal = ({ open, onClose, category = null }) => {
  const { t } = useTranslation();
  const { restaurantId } = useRestaurant();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isBeverage, setIsBeverage] = useState(false);
  const [dbError, setDbError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (category) {
      setValue('name', category.name || '');
      setValue('description', category.description || '');
      setPreviewUrl(category.image_url || '');
      setIsBeverage(category.is_beverage || false);
    } else {
      reset();
      setPreviewUrl('');
      setIsBeverage(false);
    }
    setImageFile(null);
    setDbError(null);
  }, [category, open, reset, setValue]);

  const handleImageChange = (e) => {
    const file = e.target?.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    setDbError(null);
    try {
      setLoading(true);
      
      const validRestaurantId = getValidatedRestaurantId(restaurantId);

      let imageUrl = category?.image_url || null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'menu-images', 'categories');
      }

      const payload = {
        name: data.name,
        description: data.description || null,
        image_url: imageUrl,
        is_beverage: isBeverage,
        restaurant_id: validRestaurantId
      };

      let error;
      if (category && category.id) {
        const { error: updateError } = await supabase
          .from('menu_categories')
          .update(payload)
          .eq('id', category.id)
          .eq('restaurant_id', validRestaurantId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('menu_categories')
          .insert([payload]);
        error = insertError;
      }

      if (error) {
        console.error("Supabase Database Error:", error);
        if (error.code === '23503') { // Foreign key violation
           throw new Error("Erreur de contrainte (FK). Le restaurant configuré n'existe pas ou est invalide.");
        }
        if (error.code === '42501') {
           throw new Error("Permission refusée (RLS). Vérifiez que vous êtes bien authentifié.");
        }
        throw error;
      }

      toast({
        title: t('admin.category_modal.success_title', { defaultValue: 'Succès' }),
        description: category ? t('admin.category_modal.success_msg_update', { defaultValue: 'Catégorie mise à jour' }) : t('admin.category_modal.success_msg_create', { defaultValue: 'Catégorie créée' }),
        variant: "default",
        className: "bg-amber-500 text-white"
      });
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      setDbError(error.message);
      toast({
        title: t('admin.category_modal.error_title', { defaultValue: 'Erreur' }),
        description: error.message || t('admin.category_modal.error_msg', { defaultValue: 'Une erreur est survenue' }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle>{category ? t('admin.category_modal.edit_title', { defaultValue: 'Modifier la catégorie' }) : t('admin.category_modal.create_title', { defaultValue: 'Nouvelle catégorie' })}</DialogTitle>
          <DialogDescription>
            {category ? t('admin.category_modal.edit_desc', { defaultValue: 'Modifiez les informations ci-dessous.' }) : t('admin.category_modal.create_desc', { defaultValue: 'Remplissez les informations ci-dessous.' })}
          </DialogDescription>
        </DialogHeader>

        {dbError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de sauvegarde</AlertTitle>
            <AlertDescription className="text-xs break-words">{dbError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t('admin.category_modal.name_label', { defaultValue: 'Nom' })}</Label>
            <Input
              id="name"
              {...register('name', { required: t('common.required', { defaultValue: 'Requis' }) })}
              placeholder={t('admin.category_modal.name_placeholder', { defaultValue: 'Nom de la catégorie' })}
              className="bg-background border-input text-foreground"
            />
            {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('admin.category_modal.desc_label', { defaultValue: 'Description' })}</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('admin.category_modal.desc_placeholder', { defaultValue: 'Description optionnelle' })}
              className="bg-background border-input min-h-[100px] text-foreground"
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50/50 rounded-lg">
            <div className="flex items-center gap-3">
              <GlassWater className="h-5 w-5 text-blue-600" />
              <div>
                <Label className="text-base font-semibold text-blue-900">Catégorie Boisson</Label>
                <p className="text-xs text-blue-700/70 mt-0.5">Les produits de cette catégorie auront un temps de préparation = 0 automatiquement.</p>
              </div>
            </div>
            <Switch checked={isBeverage} onCheckedChange={setIsBeverage} className="data-[state=checked]:bg-blue-500" />
          </div>

          <div className="space-y-2">
            <Label>{t('admin.category_modal.image_label', { defaultValue: 'Image' })}</Label>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted relative">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
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
                <p className="text-xs text-muted-foreground mt-2">
                  {t('admin.category_modal.upload_hint', { defaultValue: 'Formats acceptés : JPG, PNG, WEBP. Max 5MB.' })}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} soundType="click">
              {t('admin.category_modal.cancel', { defaultValue: 'Annuler' })}
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90" isLoading={loading} soundType="success">
              {category ? t('admin.category_modal.save', { defaultValue: 'Enregistrer' }) : t('admin.category_modal.create', { defaultValue: 'Créer' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};