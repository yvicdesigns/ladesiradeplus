import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { uploadImage } from '@/lib/imageUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MessageSquare, Trash2, Upload, FileImage as ImageIcon, LocateFixed, MapPin, CheckCircle } from 'lucide-react';
import { isValidAdminSettingsId, DEFAULT_ADMIN_SETTINGS_ID } from '@/lib/adminSettingsUtils';
import { useRestaurant } from '@/contexts/RestaurantContext';

export const AdminRestaurantTab = () => {
  const { user } = useAuth();
  const { refreshSettings } = useRestaurant();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const { toast } = useToast();

  // Restaurant GPS location
  const [restaurantCoords, setRestaurantCoords] = useState({ lat: '', lng: '' });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coordsSaved, setCoordsSaved] = useState(false);

  const currentLogo = watch('logo_url');
  const currentBanner = watch('banner_url');

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      // Ensure user.id is a valid UUID before making the query
      if (!isValidAdminSettingsId(user.id)) {
        console.warn("⚠️ Invalid user UUID detected for admin settings fetch. Aborting.");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('id', DEFAULT_ADMIN_SETTINGS_ID)
          .maybeSingle();
          
        if (error) throw error;

        if (data) {
          reset(data);
        } else {
          reset({
            restaurant_name: '',
            cuisine_type: '',
            restaurant_phone: '',
            restaurant_email: user.email || '',
            whatsapp_number: '',
            restaurant_city: '',
            restaurant_address: '',
            opening_hours: '09:00',
            closing_hours: '22:00',
            description: '',
            logo_url: null,
            banner_url: null
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Error loading settings",
          description: "Could not load restaurant details. Please try again.",
          variant: "destructive",
        });
      }
    };
    fetchSettings();

    // Load saved restaurant coordinates
    const fetchCoords = async () => {
      const { data } = await supabase
        .from('admin_config')
        .select('config_key, config_value')
        .in('config_key', ['restaurant_latitude', 'restaurant_longitude']);
      if (data) {
        const lat = data.find(r => r.config_key === 'restaurant_latitude')?.config_value || '';
        const lng = data.find(r => r.config_key === 'restaurant_longitude')?.config_value || '';
        setRestaurantCoords({ lat, lng });
      }
    };
    fetchCoords();
  }, [user, reset, toast]);

  const handleImageUpload = async (e, field, bucket = 'restaurant-assets') => {
    const file = e.target.files[0];
    if (!file) return;

    const setUploading = field === 'logo_url' ? setUploadingLogo : setUploadingBanner;

    try {
      setUploading(true);
      const url = await uploadImage(file, bucket);
      setValue(field, url);
      toast({ title: "Image uploaded", className: "bg-amber-500 text-white" });
    } catch (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = null; // Reset input
    }
  };

  const handleRemoveImage = (field) => {
    setValue(field, null);
    toast({ title: "Image removed", description: "Don't forget to save changes." });
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Explicitly construct payload to guarantee ALL NOT NULL fields are present
      const payload = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      const { data: savedData, error } = await supabase
        .from('admin_settings')
        .update(payload)
        .eq('id', DEFAULT_ADMIN_SETTINGS_ID)
        .select()
        .single();

      if (error) throw error;

      if (savedData) {
        reset(savedData);
      }

      toast({
        title: "Settings Saved",
        description: "Restaurant information updated.",
        className: "bg-amber-500 text-white"
      });
      await refreshSettings();
    } catch (error) {
      console.error('Save settings error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', description: 'GPS non supporté sur cet appareil.' });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRestaurantCoords({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6)
        });
        setGpsLoading(false);
        toast({ title: 'Position capturée', description: 'Cliquez sur "Sauvegarder la position" pour confirmer.' });
      },
      () => {
        setGpsLoading(false);
        toast({ variant: 'destructive', description: 'Impossible d\'obtenir la position GPS. Vérifiez les permissions.' });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSaveCoords = async () => {
    const { lat, lng } = restaurantCoords;
    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      toast({ variant: 'destructive', description: 'Coordonnées invalides.' });
      return;
    }

    const { error: errLat } = await supabase
      .from('admin_config')
      .upsert({ config_key: 'restaurant_latitude', config_value: String(lat) }, { onConflict: 'config_key' });

    if (errLat) {
      console.error('[GPS Save] Error saving latitude:', errLat);
      toast({ variant: 'destructive', description: `Erreur sauvegarde latitude: ${errLat.message}` });
      return;
    }

    const { error: errLng } = await supabase
      .from('admin_config')
      .upsert({ config_key: 'restaurant_longitude', config_value: String(lng) }, { onConflict: 'config_key' });

    if (errLng) {
      console.error('[GPS Save] Error saving longitude:', errLng);
      toast({ variant: 'destructive', description: `Erreur sauvegarde longitude: ${errLng.message}` });
      return;
    }

    // Verify the save by re-fetching
    const { data: verify, error: verifyErr } = await supabase
      .from('admin_config')
      .select('config_key, config_value')
      .in('config_key', ['restaurant_latitude', 'restaurant_longitude']);

    if (verifyErr || !verify?.length) {
      console.error('[GPS Save] Verification failed:', verifyErr);
      toast({ variant: 'destructive', description: 'Sauvegarde impossible — vérifiez les permissions de la table admin_config.' });
      return;
    }

    const savedLat = verify.find(r => r.config_key === 'restaurant_latitude')?.config_value;
    const savedLng = verify.find(r => r.config_key === 'restaurant_longitude')?.config_value;
    setRestaurantCoords({ lat: savedLat || lat, lng: savedLng || lng });

    setCoordsSaved(true);
    setTimeout(() => setCoordsSaved(false), 3000);
    toast({ title: 'Position sauvegardée ✓', description: `Lat: ${savedLat}, Lng: ${savedLng}` });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Settings</CardTitle>
          <CardDescription>General information about your establishment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* General Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">General Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Restaurant Name</Label>
                  <Input {...register('restaurant_name', { required: 'Name is required' })} placeholder="My Awesome Restaurant" />
                  {errors.restaurant_name && <span className="text-red-500 text-sm">{errors.restaurant_name.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label>Cuisine Type</Label>
                  <Input {...register('cuisine_type')} placeholder="e.g. Italian, Fast Food" />
                </div>
              </div>
            </div>

            {/* Communication Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Communication Channels</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input {...register('restaurant_phone')} placeholder="+1234567890" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input {...register('restaurant_email')} placeholder="contact@restaurant.com" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-600" /> WhatsApp Number
                  </Label>
                  <Input
                    {...register('whatsapp_number')}
                    placeholder="+243812345678"
                  />
                  <p className="text-[10px] text-muted-foreground">Format international (ex: +243812345678)</p>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input {...register('restaurant_city')} placeholder="New York" />
                </div>
                <div className="space-y-2">
                  <Label>Full Address</Label>
                  <Input {...register('restaurant_address')} placeholder="123 Main St, Suite 100" />
                </div>
              </div>
            </div>

            {/* GPS Coordinates Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" /> Position GPS du Restaurant
              </h3>
              <p className="text-sm text-gray-500">
                Rendez-vous à l'adresse de votre restaurant, puis cliquez sur le bouton ci-dessous pour capturer votre position. Elle sera utilisée pour calculer les frais de livraison.
              </p>
              <div className="flex gap-3 flex-wrap">
                <button type="button" onClick={handleCaptureGPS} disabled={gpsLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60">
                  {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                  {gpsLoading ? 'Localisation...' : 'Capturer ma position GPS'}
                </button>
                {restaurantCoords.lat && (
                  <button type="button" onClick={handleSaveCoords}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-all">
                    {coordsSaved ? <CheckCircle className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    {coordsSaved ? 'Sauvegardé !' : 'Sauvegarder la position'}
                  </button>
                )}
              </div>
              {restaurantCoords.lat && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 font-mono flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  Lat: {restaurantCoords.lat} | Lng: {restaurantCoords.lng}
                  {!coordsSaved && <span className="text-xs text-amber-600 font-sans ml-2">(non sauvegardé)</span>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Latitude (manuel)</label>
                  <input type="number" step="any" value={restaurantCoords.lat}
                    onChange={e => setRestaurantCoords(p => ({ ...p, lat: e.target.value }))}
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm"
                    placeholder="-4.206210" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Longitude (manuel)</label>
                  <input type="number" step="any" value={restaurantCoords.lng}
                    onChange={e => setRestaurantCoords(p => ({ ...p, lng: e.target.value }))}
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm"
                    placeholder="15.243300" />
                </div>
              </div>
            </div>

            {/* Hours Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Business Hours</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Opening Time</Label>
                  <Input type="time" {...register('opening_hours')} />
                </div>
                <div className="space-y-2">
                  <Label>Closing Time</Label>
                  <Input type="time" {...register('closing_hours')} />
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} className="min-h-[100px]" placeholder="Tell customers about your restaurant..." />
            </div>

            {/* Branding Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Branding</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label>Logo</Label>
                  <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-gray-50/50">
                    {currentLogo ? (
                        <div className="relative w-24 h-24 bg-white rounded-full shadow-sm border overflow-hidden">
                           <img src={currentLogo} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 bg-white rounded-full shadow-sm border flex items-center justify-center text-gray-300">
                           <ImageIcon className="w-10 h-10" />
                        </div>
                    )}
                    
                    <div className="flex gap-2 w-full">
                         <div className="relative w-full">
                            <Button 
                                type="button"
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                disabled={uploadingLogo}
                            >
                                {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Upload className="w-3 h-3 mr-1"/>}
                                Upload
                            </Button>
                            <Input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleImageUpload(e, 'logo_url', 'restaurant-logos')}
                                disabled={uploadingLogo}
                            />
                         </div>
                         {currentLogo && (
                            <Button 
                                type="button"
                                variant="destructive" 
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => handleRemoveImage('logo_url')}
                            >
                                <Trash2 className="w-4 h-4"/>
                            </Button>
                         )}
                    </div>
                  </div>
                  <Input type="hidden" {...register('logo_url')} />
                </div>

                {/* Banner Upload */}
                <div className="space-y-3">
                  <Label>Banner Image</Label>
                  <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-gray-50/50">
                    {currentBanner ? (
                        <div className="relative w-full h-24 bg-white rounded-md shadow-sm border overflow-hidden">
                           <img src={currentBanner} alt="Banner" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-full h-24 bg-white rounded-md shadow-sm border flex items-center justify-center text-gray-300">
                           <ImageIcon className="w-10 h-10" />
                        </div>
                    )}
                    
                    <div className="flex gap-2 w-full">
                         <div className="relative w-full">
                            <Button 
                                type="button"
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                disabled={uploadingBanner}
                            >
                                {uploadingBanner ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Upload className="w-3 h-3 mr-1"/>}
                                Upload Banner
                            </Button>
                            <Input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleImageUpload(e, 'banner_url', 'menu-images')}
                                disabled={uploadingBanner}
                            />
                         </div>
                         {currentBanner && (
                            <Button 
                                type="button"
                                variant="destructive" 
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => handleRemoveImage('banner_url')}
                            >
                                <Trash2 className="w-4 h-4"/>
                            </Button>
                         )}
                    </div>
                  </div>
                  <Input type="hidden" {...register('banner_url')} />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={loading || uploadingLogo || uploadingBanner} className="w-full md:w-auto min-w-[150px]">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};