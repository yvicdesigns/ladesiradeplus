import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Wifi } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const DownloadAppModal = ({ isOpen, onClose }) => {
  const appUrl = window.location.origin;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl mx-4"
          >
            <div className="bg-[#D97706] rounded-3xl overflow-hidden shadow-2xl flex relative">

              {/* Left: text */}
              <div className="flex-1 p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Smartphone className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">Application mobile</span>
                </div>

                <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
                  Commandez<br />depuis votre<br />téléphone.
                </h2>
                <p className="text-white/75 text-sm leading-relaxed mb-6">
                  Scannez le QR code avec l'appareil photo de votre téléphone pour ouvrir l'application directement dans votre navigateur.
                </p>

                <div className="flex items-start gap-2 bg-white/10 rounded-2xl p-4">
                  <Wifi className="h-4 w-4 text-white/70 mt-0.5 flex-shrink-0" />
                  <p className="text-white/70 text-xs leading-relaxed">
                    Ajoutez l'application à votre écran d'accueil pour un accès rapide — fonctionne comme une vraie app, sans téléchargement.
                  </p>
                </div>
              </div>

              {/* Right: QR code */}
              <div className="flex items-center justify-center p-10 relative">
                <div className="bg-white rounded-2xl p-5 shadow-xl">
                  <QRCodeSVG
                    value={appUrl}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#1A1A1A"
                    level="M"
                    includeMargin={false}
                  />
                  <p className="text-center text-xs text-gray-400 font-medium mt-3">
                    Scanner pour ouvrir
                  </p>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DownloadAppModal;
