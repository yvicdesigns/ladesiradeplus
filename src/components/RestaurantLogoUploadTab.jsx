import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { uploadImage } from '@/lib/imageUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { handleRLSError } from '@/lib/rlsErrorHandler';
import { DEFAULT_ADMIN_SETTINGS_ID } from '@/lib/adminSettingsUtils';

export const RestaurantLogoUploadTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    fetchLogo();
  }, [user]);

  const fetchLogo = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetched restaurant_id to satisfy NOT NULL constraints on updates/upserts
      const { data, error } = await supabase
        .from('admin_settings')
        .select('id, logo_url, restaurant_id')
        .eq('admin_id', user.id)
        .maybeSingle();

      if (error) {
        handleRLSError(error, 'SELECT', 'admin_settings');
        throw error;
      }

      if (data) {
        setSettingsId(data.id);
        setCurrentLogo(data.logo_url);
        setRestaurantId(data.restaurant_id);
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le logo actuel."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      if (!settingsId) {
        throw new Error("Veuillez d'abord initialiser les paramètres du restaurant dans l'onglet Profil.");
      }

      // 1. Upload to Storage
      const publicUrl = await uploadImage(file, 'restaurant-logos');
      
      // 2. Update Admin Settings explicitly passing all required NOT NULL columns
      const payload = { 
        logo_url: publicUrl,
        admin_id: user.id, // Explicitly enforce NOT NULL
        restaurant_id: restaurantId || DEFAULT_ADMIN_SETTINGS_ID, // Explicitly enforce NOT NULL
        updated_at: new Date().toISOString() // Explicitly enforce NOT NULL
      };

      const { data, error } = await supabase
        .from('admin_settings')
        .update(payload)
        .eq('id', settingsId)
        .select()
        .single();

      if (error) {
        handleRLSError(error, 'UPDATE', 'admin_settings');
        throw error;
      }

      if (data) {
        setCurrentLogo(data.logo_url);
        toast({
          title: "Succès",
          description: "Le logo a été mis à jour avec succès.",
          className: "bg-amber-500 text-white"
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Échec du téléchargement",
        description: error.message || "Une erreur est survenue lors du téléchargement."
      });
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = null;
    }
  };

  const handleDeleteLogo = async () => {
    if (!settingsId) return;

    try {
      setUploading(true);
      
      const payload = { 
        logo_url: null, 
        admin_id: user.id,
        restaurant_id: restaurantId || DEFAULT_ADMIN_SETTINGS_ID,
        updated_at: new Date().toISOString() 
      };

      const { error } = await supabase
        .from('admin_settings')
        .update(payload)
        .eq('id', settingsId);

      if (error) {
        handleRLSError(error, 'UPDATE', 'admin_settings');
        throw error;
      }

      setCurrentLogo(null);
      toast({
        title: "Logo supprimé",
        description: "Le logo a été retiré. L'icône par défaut sera affichée.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le logo."
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading && !settingsId) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo du Restaurant</CardTitle>
        <CardDescription>
          Ce logo sera affiché sur la page d'accueil de l'application et sur les reçus.
          Format recommandé : PNG ou JPEG transparent, 500x500px.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-gray-200 rounded-lg p-8 bg-gray-50/50">
          {currentLogo ? (
            <div className="relative group">
              <div className="w-40 h-40 bg-white rounded-full shadow-md flex items-center justify-center overflow-hidden border border-gray-200">
                <img 
                  src={currentLogo} 
                  alt="Logo Restaurant" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-xs font-medium">Aperçu</p>
              </div>
            </div>
          ) : (
            <div className="w-40 h-40 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-200">
              <ImageIcon className="h-16 w-16 text-gray-300" />
            </div>
          )}
          
          <div className="text-center space-y-1">
             <h3 className="font-medium text-gray-900">
               {currentLogo ? 'Logo Actuel' : 'Aucun logo défini'}
             </h3>
             <p className="text-sm text-gray-500">
               {currentLogo ? 'Votre marque est visible par les clients.' : 'L\'icône par défaut est affichée.'}
             </p>
          </div>
        </div>

        <div className="grid gap-4 max-w-sm mx-auto w-full">
          <div className="flex flex-col gap-2">
            <Label htmlFor="logo-upload" className="sr-only">Upload Logo</Label>
            <div className="flex gap-2">
               <Button 
                  asChild 
                  variant="outline" 
                  className="w-full cursor-pointer relative overflow-hidden"
                  disabled={uploading}
                >
                 <div>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {uploading ? 'Téléchargement...' : (currentLogo ? 'Changer le logo' : 'Ajouter un logo')}
                    <Input 
                      id="logo-upload" 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                 </div>
               </Button>
               
               {currentLogo && (
                 <Button 
                   variant="destructive" 
                   size="icon"
                   onClick={handleDeleteLogo}
                   disabled={uploading}
                   title="Supprimer le logo"
                 >
                   <Trash2 className="h-4 w-4" />
                 </Button>
               )}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};