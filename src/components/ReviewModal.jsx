import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateReviewData } from '@/lib/ReviewValidationService';

export const ReviewModal = ({ open, onClose, menuItem, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Pre-fill user info if logged in
  useEffect(() => {
    if (open) {
      setRating(0);
      setHoverRating(0);
      setContent('');
      setTitle('');
      setValidationErrors([]);
      
      if (user) {
        setCustomerName(user.user_metadata?.full_name || '');
        setCustomerEmail(user.email || '');
      } else {
        setCustomerName('');
        setCustomerEmail('');
      }
    }
  }, [open, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors([]);

    try {
      setLoading(true);

      // Explicitly enforce valid restaurant ID
      const validRestaurantId = "7eedf081-0268-4867-af38-61fa5932420a";

      const reviewData = {
        menu_item_id: menuItem?.id || null,
        rating,
        title: title || 'Avis', 
        content,
        customer_name: customerName || 'Anonyme',
        customer_email: customerEmail || null,
        status: 'pending', 
        user_id: user?.id || null, 
        restaurant_id: validRestaurantId, // Injection
        created_at: new Date().toISOString()
      };

      // 1. Pre-submission Validation
      const validation = validateReviewData(reviewData);
      
      console.log("🚀 [ReviewModal] Validation Result:", validation);
      console.log("📦 [ReviewModal] Payload to submit:", JSON.stringify(reviewData, null, 2));

      if (!validation.isValid) {
        console.error("❌ [ReviewModal] Validation failed:", validation.errors);
        setValidationErrors(validation.errors);
        setLoading(false);
        return;
      }

      // 2. Insert into Supabase
      const { error } = await supabase
        .from('reviews')
        .insert(reviewData);

      if (error) {
        console.error("💥 [ReviewModal] Supabase Insert Error:", error);
        throw error;
      }

      toast({
        variant: "success",
        title: "Avis soumis",
        description: "Merci ! Votre avis a été soumis et lié correctement au restaurant.",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('[ReviewModal] Error submitting review:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de soumettre l'avis. Vérifiez la connexion.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Écrire un avis</DialogTitle>
          <DialogDescription>
            Partagez votre expérience avec <strong>{menuItem?.name || "ce produit"}</strong>
          </DialogDescription>
        </DialogHeader>

        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4 mt-1 text-xs">
                {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-transform hover:scale-110"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star 
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-500">
              {rating > 0 ? `${rating} Étoile${rating > 1 ? 's' : ''}` : 'Sélectionnez une note'}
            </span>
          </div>

          <div className="space-y-3">
            {!user && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name">Nom</Label>
                  <Input 
                    id="name" 
                    placeholder="Votre Nom" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email (Optionnel)</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="votre@email.com" 
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="title">Titre (Optionnel)</Label>
              <Input 
                id="title" 
                placeholder="Résumé de votre expérience" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="review">Avis</Label>
              <Textarea 
                id="review" 
                placeholder="Qu'avez-vous aimé ou moins aimé ?" 
                className="min-h-[100px] resize-none bg-white"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-[#D97706] hover:bg-[#D97706]/90 text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Soumettre l'avis
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};