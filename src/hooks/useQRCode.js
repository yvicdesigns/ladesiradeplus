import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { 
  generateQRCode as generateQR,
  generateQRCodeSVG,
  downloadQRCode as downloadQR,
  printQRCode as printQR,
  copyToClipboard as copyClip,
  getQRCodeUrl
} from '@/lib/qrCodeUtils';

export const useQRCode = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateAndSaveQRCode = async (tableId, tableName) => {
    setLoading(true);
    try {
      const { qrCodeDataUrl, url } = await generateQR(tableId);
      
      const { error } = await supabase
        .from('tables')
        .update({
          qr_code: qrCodeDataUrl,
          qr_code_url: url,
          qr_generated_at: new Date().toISOString()
        })
        .eq('id', tableId);

      if (error) throw error;

      toast({
        title: "QR Code Generated",
        description: `QR code for Table ${tableName} has been updated.`,
        className: "bg-amber-500 text-white"
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate QR code. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const regenerateQRCode = async (tableId, tableName) => {
    return generateAndSaveQRCode(tableId, tableName);
  };

  const handleDownload = async (qrCodeData, format, tableName, qrCodeUrlText) => {
    try {
      let dataToDownload = qrCodeData;
      // We force PNG even if SVG was requested, to keep consistency
      let finalFormat = 'png';
      
      if (format === 'svg' || format === 'png') {
        if (!qrCodeUrlText) {
             // Fallback if URL is missing
             dataToDownload = qrCodeData;
        } else {
             dataToDownload = await generateQRCodeSVG(qrCodeUrlText);
        }
      }
      
      downloadQR(dataToDownload, finalFormat, tableName);
      toast({
        title: "Downloaded",
        description: `QR code saved to your device.`,
      });
    } catch (error) {
       console.error("Download error:", error);
       toast({
        title: "Download Failed",
        description: "Could not download image.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = (qrCodeData, tableInfo) => {
    try {
      printQR(qrCodeData, tableInfo);
    } catch (error) {
      toast({
        title: "Print Error",
        description: "Could not open print dialog.",
        variant: "destructive"
      });
    }
  };

  const handleCopyUrl = async (url) => {
    if (!url) {
      toast({
        title: "Error",
        description: "No URL available to copy.",
        variant: "destructive"
      });
      return;
    }
    const success = await copyClip(url);
    if (success) {
      toast({
        title: "Copied!",
        description: "Link copied to clipboard.",
        className: "bg-blue-500 text-white"
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to copy link.",
        variant: "destructive"
      });
    }
  };

  return {
    loading,
    generateAndSaveQRCode,
    regenerateQRCode,
    handleDownload,
    handlePrint,
    handleCopyUrl,
    getQRCodeUrl
  };
};