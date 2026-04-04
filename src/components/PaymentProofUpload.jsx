import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '@/lib/imageUpload';
import { cn } from '@/lib/utils';

export const PaymentProofUpload = ({ onUploadSuccess, onRemove, initialUrl, className }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(initialUrl || null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setLoading(true);

    // Client-side validation
    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image (JPG, PNG, WEBP)');
      setLoading(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('L\'image ne doit pas dépasser 5 Mo');
      setLoading(false);
      return;
    }

    try {
      // Create local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Upload
      const publicUrl = await uploadImage(file, 'payment-screenshots');
      onUploadSuccess(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || "Échec de l'envoi de l'image");
      setPreview(null);
    } finally {
      setLoading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onRemove();
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      {!preview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-gray-50",
            error ? "border-red-300 bg-red-50" : "border-gray-300"
          )}
        >
          {loading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
          ) : (
            <Upload className={cn("h-8 w-8 mb-2", error ? "text-red-400" : "text-gray-400")} />
          )}
          
          <div className="space-y-1">
            <p className={cn("text-sm font-medium", error ? "text-red-600" : "text-gray-900")}>
              {loading ? "Envoi en cours..." : "Cliquez pour ajouter la preuve"}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP (Max 5Mo)
            </p>
          </div>
          
          {error && (
            <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border bg-gray-50 group">
          <div className="aspect-video w-full relative flex items-center justify-center bg-black/5">
             <img 
               src={preview} 
               alt="Preuve de paiement" 
               className="h-full w-full object-contain" 
             />
             {loading && (
               <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm">
                 <Loader2 className="w-8 h-8 text-white animate-spin" />
               </div>
             )}
          </div>
          
          <div className="p-3 flex items-center justify-between bg-white border-t">
            <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Image chargée
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        disabled={loading}
      />
    </div>
  );
};