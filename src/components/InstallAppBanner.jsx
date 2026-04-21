import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const APK_URL = 'https://yeljxgewqvjkqgagkrzs.supabase.co/storage/v1/object/public/restaurant-logos/ladesiradeplus.apk';
const DISMISSED_KEY = 'apk_banner_dismissed';

export const InstallAppBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Ne pas afficher si on est déjà dans l'app native
    if (Capacitor.isNativePlatform()) return;
    // Ne pas afficher si déjà ignoré
    if (sessionStorage.getItem(DISMISSED_KEY)) return;
    // Afficher seulement sur mobile/tablette
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#D97706] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <p className="text-white font-bold text-base">Installer l'application</p>
          </div>
          <button onClick={dismiss} className="text-white/80 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-gray-800 text-sm leading-relaxed">
            Installez l'application <strong>La Desirade Plus</strong> sur votre téléphone pour une meilleure expérience et recevoir les notifications de vos commandes.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-amber-800 text-xs leading-relaxed">
              ⚠️ <strong>Note :</strong> L'application n'est pas encore sur le Play Store. Android peut afficher un avertissement lors de l'installation — c'est normal, l'application est sûre. Autorisez l'installation depuis des sources inconnues si demandé.
            </p>
          </div>
          <p className="text-gray-500 text-xs">
            Cette version sera bientôt disponible sur Google Play Store.
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-medium"
          >
            Plus tard
          </button>
          <a
            href={APK_URL}
            download="ladesiradeplus.apk"
            onClick={dismiss}
            className="flex-1 bg-[#D97706] text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 no-underline"
          >
            <Download className="h-4 w-4" />
            Télécharger
          </a>
        </div>
      </div>
    </div>
  );
};
