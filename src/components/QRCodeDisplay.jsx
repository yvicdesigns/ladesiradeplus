import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, QrCode, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { downloadQRCode } from '@/lib/qrCodeUtils';
import { Skeleton } from '@/components/ui/skeleton';

export const QRCodeDisplay = ({ qrDataUrl, title = "Promo", showDownloadButton = true, isLoading = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-muted/30">
        <Skeleton className="w-32 h-32 rounded-lg mb-4" />
        <Skeleton className="w-24 h-8 rounded-md" />
      </div>
    );
  }

  if (!qrDataUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl bg-muted/20 text-muted-foreground h-full">
        <QrCode className="h-8 w-8 mb-2 opacity-50" />
        <span className="text-xs text-center">QR Code non généré</span>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center justify-center p-4 border rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute top-2 left-2 bg-muted/50 p-1.5 rounded-full z-10">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Outil Admin: Scannez pour tester ou téléchargez pour imprimer</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="relative p-2 bg-white rounded-lg border-2 border-green-100 mb-3 transition-transform duration-300 group-hover:scale-105">
        <img 
          src={qrDataUrl} 
          alt={`QR Code pour ${title}`} 
          className="w-28 h-28 object-contain"
        />
        {isHovered && (
          <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] rounded-lg flex items-center justify-center transition-opacity duration-300">
            <QrCode className="h-8 w-8 text-primary drop-shadow-md" />
          </div>
        )}
      </div>

      {showDownloadButton && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs font-medium border-amber-200 hover:bg-amber-50 hover:text-amber-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            downloadQRCode(qrDataUrl, `QR-Promo-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`);
          }}
        >
          <Download className="h-3.5 w-3.5 mr-1.5" /> Télécharger QR
        </Button>
      )}
    </div>
  );
};