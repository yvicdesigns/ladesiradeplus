import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateWorker, setUpdateWorker] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if prompt was dismissed
    const dismissed = localStorage.getItem('pwa_prompt_dismissed');
    
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
    
    if (isIosDevice && !isStandalone && !dismissed) {
      setIsIOS(true);
      setShowInstall(true);
    }

    // Handle standard Install Prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed && !isStandalone) {
        setShowInstall(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle Service Worker Updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateWorker(newWorker);
                setShowUpdate(true);
              }
            });
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          window.location.reload();
          refreshing = true;
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // iOS doesn't support programmatic install, just dismiss the tip
      dismissPrompt();
      return;
    }
    
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstall(false);
    } else {
      dismissPrompt();
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setShowInstall(false);
  };

  const handleUpdateClick = () => {
    if (updateWorker) {
      updateWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    if (navigator.serviceWorker.controller) {
       window.location.reload();
    }
  };

  if (!showInstall && !showUpdate) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        
        {showUpdate && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="bg-blue-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <div className="text-sm">
                <p className="font-bold">Mise à jour disponible</p>
                <p className="opacity-90">Nouvelle version de l'application.</p>
              </div>
            </div>
            <Button size="sm" variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50" onClick={handleUpdateClick}>
              Actualiser
            </Button>
          </motion.div>
        )}

        {showInstall && !showUpdate && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="bg-[#1f2937] text-white p-4 rounded-xl shadow-lg flex items-start sm:items-center justify-between pointer-events-auto border border-gray-700"
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary p-2 rounded-lg shrink-0 mt-1 sm:mt-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-bold text-base">Installer La Desirade Plus</p>
                {isIOS ? (
                  <div className="text-gray-300 mt-1 flex flex-col gap-1 text-xs">
                    <p className="flex items-center gap-1">1. Appuyez sur <Share className="w-3 h-3 inline" /></p>
                    <p className="flex items-center gap-1">2. Puis <PlusSquare className="w-3 h-3 inline" /> Sur l'écran d'accueil</p>
                  </div>
                ) : (
                  <p className="text-gray-300 text-xs mt-1">Pour une commande plus rapide</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {!isIOS && (
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white h-8 text-xs px-3" onClick={handleInstallClick}>
                  Installer
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white" onClick={dismissPrompt}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};