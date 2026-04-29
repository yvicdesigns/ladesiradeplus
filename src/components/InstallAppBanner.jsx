import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Apple } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const APK_URL = 'https://yeljxgewqvjkqgagkrzs.supabase.co/storage/v1/object/public/restaurant-logos/ladesiradeplus.apk';
const DISMISSED_KEY = 'apk_banner_dismissed';

function detectDevice() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export const InstallAppBanner = () => {
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState('desktop');

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;
    const d = detectDevice();
    if (d === 'desktop') return;
    setDevice(d);
    setVisible(true);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  const isIOS = device === 'ios';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 flex items-center justify-between ${isIOS ? 'bg-gray-800' : 'bg-[#D97706]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              {isIOS
                ? <Apple className="h-5 w-5 text-white" />
                : <Smartphone className="h-5 w-5 text-white" />
              }
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
            Installez <strong>La Desirade Plus</strong> sur votre téléphone pour une meilleure expérience et recevoir les notifications de vos commandes.
          </p>

          {isIOS ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 space-y-2">
              <p className="text-gray-700 text-xs font-semibold">Version iOS bientôt disponible sur l'App Store.</p>
              <p className="text-gray-500 text-xs leading-relaxed">
                En attendant, vous pouvez ajouter cette page à votre écran d'accueil : appuyez sur <strong>Partager</strong> puis <strong>"Sur l'écran d'accueil"</strong>.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-amber-800 text-xs leading-relaxed">
                ⚠️ <strong>Note :</strong> L'application n'est pas encore sur le Play Store. Android peut afficher un avertissement — c'est normal, l'application est sûre. Autorisez l'installation depuis des sources inconnues si demandé.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-medium"
          >
            Plus tard
          </button>

          {isIOS ? (
            <button
              onClick={dismiss}
              className="flex-1 bg-gray-800 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Apple className="h-4 w-4" />
              Compris
            </button>
          ) : (
            <a
              href={APK_URL}
              download="ladesiradeplus.apk"
              onClick={dismiss}
              className="flex-1 bg-[#D97706] text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 no-underline"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
