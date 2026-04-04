import React from 'react';
import { Camera, XCircle, Keyboard, Settings, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const CameraPermissionModal = ({ 
  isOpen, 
  status, // 'idle', 'requesting', 'denied', 'error'
  onRequestPermission, 
  onManualInput,
  errorDetails 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl z-[60]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className={`p-4 rounded-full ${status === 'denied' || status === 'error' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-[#D97706]'}`}>
             {status === 'denied' || status === 'error' ? (
                <XCircle className="w-10 h-10" />
             ) : (
                <Camera className="w-10 h-10" />
             )}
          </div>
          
          <DialogTitle className="text-xl font-bold text-gray-900">
            {status === 'denied' 
              ? "Accès refusé" 
              : status === 'error'
              ? "Erreur de caméra"
              : "Scanner le QR Code"
            }
          </DialogTitle>
          
          <DialogDescription className="text-gray-500 text-sm max-w-[280px] mx-auto">
            {status === 'idle' && "Pour commander, nous avons besoin d'accéder à votre caméra afin de scanner le code QR de votre table."}
            {status === 'requesting' && "Veuillez autoriser l'accès à la caméra dans la fenêtre qui va s'afficher..."}
            {status === 'denied' && (
              <div className="space-y-2">
                <p>L'accès à la caméra a été bloqué.</p> 
                <p className="text-xs bg-gray-50 p-2 rounded border border-gray-100">
                   Veuillez activer la caméra dans les <strong>paramètres de votre navigateur</strong> ou de votre appareil pour ce site.
                </p>
              </div>
            )}
            {status === 'error' && (
              <span>
                Impossible d'accéder à la caméra. {errorDetails || "Vérifiez que votre appareil dispose d'une caméra fonctionnelle."}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-3 sm:flex-col sm:space-x-0 pt-4">
          {status === 'idle' && (
            <Button 
              onClick={onRequestPermission} 
              className="w-full bg-[#D97706] hover:bg-[#FCD34D] text-white font-bold h-12 rounded-xl text-base"
            >
              Autoriser la caméra
            </Button>
          )}

          {status === 'requesting' && (
             <Button disabled className="w-full bg-gray-100 text-gray-400 font-bold h-12 rounded-xl">
               Demande en cours...
             </Button>
          )}

          {(status === 'denied' || status === 'error') && (
            <Button 
              onClick={onRequestPermission} 
              variant="outline"
              className="w-full border-[#D97706] text-[#D97706] hover:bg-amber-50 font-bold h-12 rounded-xl gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Réessayer
            </Button>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">Ou</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            onClick={onManualInput}
            className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium gap-2 h-12"
          >
            <Keyboard className="w-4 h-4" />
            Entrer le code manuellement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};