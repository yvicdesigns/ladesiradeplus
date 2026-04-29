import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const APK_URL = 'https://yeljxgewqvjkqgagkrzs.supabase.co/storage/v1/object/public/restaurant-logos/ladesiradeplus.apk';
const DISMISSED_KEY = 'apk_banner_dismissed';

function detectDevice() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

// SVG share icon identical to the Safari share button
const SafariShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline w-4 h-4 mx-0.5 align-middle text-blue-500">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const IOSGuide = () => (
  <div className="space-y-3">
    <p className="text-gray-700 text-sm font-semibold">
      Ajoutez l'app à votre écran d'accueil en 2 étapes :
    </p>

    {/* Steps */}
    <div className="space-y-2">
      {/* Step 1 */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-3">
        <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
        <div>
          <p className="text-gray-800 text-sm">
            Appuyez sur le bouton <strong>Partager</strong> <SafariShareIcon /> en bas de Safari
          </p>
          {/* Arrow pointing down */}
          <div className="flex justify-center mt-2">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-0.5 h-5 bg-blue-400 rounded" />
              <div
                className="w-0 h-0"
                style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #60a5fa' }}
              />
            </div>
          </div>
          <p className="text-center text-blue-400 text-xs mt-0.5 animate-bounce">en bas de l'écran</p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl px-3 py-3">
        <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
        <div className="text-sm text-gray-800">
          Faites défiler et appuyez sur{' '}
          <span className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-gray-700">
            <span className="text-base leading-none">+</span> Sur l'écran d'accueil
          </span>
        </div>
      </div>
    </div>

    <p className="text-gray-400 text-xs text-center">
      Version iOS disponible prochainement sur l'App Store
    </p>
  </div>
);

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
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <p className="text-white font-bold text-base">Installer l'application</p>
          </div>
          <button onClick={dismiss} className="text-white/80 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {isIOS ? (
            <IOSGuide />
          ) : (
            <div className="space-y-3">
              <p className="text-gray-800 text-sm leading-relaxed">
                Installez <strong>La Desirade Plus</strong> sur votre téléphone pour une meilleure expérience et recevoir les notifications de vos commandes.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-amber-800 text-xs leading-relaxed">
                  ⚠️ <strong>Note :</strong> L'application n'est pas encore sur le Play Store. Android peut afficher un avertissement — c'est normal, l'application est sûre. Autorisez l'installation depuis des sources inconnues si demandé.
                </p>
              </div>
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
              Compris ✓
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
