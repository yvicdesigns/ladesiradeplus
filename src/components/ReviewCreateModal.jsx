import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Star, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateReviewData } from '@/lib/ReviewValidationService';

export const ReviewCreateModal = ({ open, onClose, onSuccess }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors: formErrors } } = useForm({
    defaultValues: { rating: '5' }
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const { toast } = useToast();
  
  const ratingValue = watch('rating');

  const onSubmit = async (data) => {
    setValidationErrors([]);
    try {
      setLoading(true);

      // Force explicit VALID restaurant_id
      const validRestaurantId = "7eedf081-0268-4867-af38-61fa5932420a";

      const payload = {
        customer_name: data.customer_name,
        customer_email: data.customer_email || null, // Allow empty string to become null or pass as empty string
        title: data.title || '',
        content: data.content,
        rating: parseInt(data.rating),
        created_at: new Date().toISOString(), // explicitly using created_at which is a valid column
        status: 'pending',
        restaurant_id: validRestaurantId,
        menu_item_id: null, // Explicitly define for validation
        images_urls: [] 
      };

      // 1. Run Pre-submission Validation
      const validation = validateReviewData(payload);
      
      console.log("🚀 [ReviewCreateModal] Validation Result:", validation);
      console.log("📦 [ReviewCreateModal] Payload to submit:", JSON.stringify(payload, null, 2));

      if (!validation.isValid) {
        console.error("❌ [ReviewCreateModal] Validation failed:", validation.errors);
        setValidationErrors(validation.errors);
        setLoading(false);
        return;
      }

      // 2. Submit to Database
      const { error } = await supabase.from('reviews').insert([payload]);

      if (error) {
        console.error("💥 [ReviewCreateModal] Supabase Insert Error:", error);
        throw error;
      }

      toast({
        title: "Avis Ajouté",
        description: "Le nouvel avis a été créé avec succès et lié au restaurant.",
        className: "bg-amber-500 text-white"
      });
      
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('[ReviewCreateModal] Create review exception:', error);
      toast({
        title: "Erreur d'insertion",
        description: error.message || "Échec de la création de l'avis en base de données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un Avis Manuellement</DialogTitle>
          <DialogDescription>Ajoutez manuellement un avis client dans le système.</DialogDescription>
        </DialogHeader>

        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4 mt-1 text-xs">
                {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Nom du Client</Label>
              <Input id="customer_name" {...register('customer_name', { required: 'Le nom est requis' })} />
              {formErrors.customer_name && <span className="text-xs text-red-500">{formErrors.customer_name.message}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_email">Email (Optionnel)</Label>
              <Input id="customer_email" type="email" {...register('customer_email')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note</Label>
            <Select onValueChange={(val) => setValue('rating', val)} defaultValue="5">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une note" />
              </SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{num}</span>
                      <div className="flex">
                        {[...Array(num)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        ))}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Titre (Optionnel)</Label>
            <Input id="title" {...register('title')} placeholder="Résumé de l'expérience" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Contenu de l'avis</Label>
            <Textarea 
              id="content" 
              {...register('content', { required: 'Le contenu est requis' })} 
              className="min-h-[100px]"
              placeholder="Que disait le client ?"
            />
            {formErrors.content && <span className="text-xs text-red-500">{formErrors.content.message}</span>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter l'avis
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};