import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Camera, Upload } from 'lucide-react';
import { uploadImage } from '@/lib/imageUpload';

export const ProfilePhotoUpload = ({ currentPhotoUrl, onPhotoUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setLoading(true);
      
      // Upload using utility (Bucket: profile-pictures, Folder: user.id)
      // Note: uploadImage helper might need adjustment if it doesn't support folders cleanly, 
      // but standard storage implementation usually treats path as key.
      // We'll construct a specific path here to pass to uploadImage if it supports it, 
      // or we use supabase direct call if uploadImage is too restrictive.
      // Looking at provided uploadImage, it accepts 'folder'.
      
      const publicUrl = await uploadImage(file, 'profile-pictures', user.id);

      // Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été modifiée avec succès.",
        className: "bg-amber-500 text-white"
      });

      if (onPhotoUpdate) onPhotoUpdate(publicUrl);

    } catch (error) {
      console.error('Error uploading profile photo:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la photo."
      });
      setPreviewUrl(null); // Reset preview on error
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group cursor-pointer" onClick={triggerFileInput}>
        <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
          <AvatarImage src={previewUrl || currentPhotoUrl} className="object-cover" />
          <AvatarFallback className="text-4xl bg-amber-100 text-amber-600">
            {user?.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-8 h-8 text-white" />
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={triggerFileInput} 
          disabled={loading}
          className="text-xs"
        >
          <Upload className="w-3 h-3 mr-2" />
          Changer la photo
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={loading}
        />
        <p className="text-[10px] text-gray-400 mt-2">
          JPG, PNG ou WebP. Max 5MB.
        </p>
      </div>
    </div>
  );
};