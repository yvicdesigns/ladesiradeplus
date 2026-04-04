import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Printer, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  MapPin,
  Users,
  X,
  FileJson
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export const QRCodeModal = ({ 
  open, 
  onClose, 
  table, 
  loading, 
  onRegenerate, 
  onDownload, 
  onPrint, 
  onCopyUrl 
}) => {
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  if (!table) return null;

  const handleRegenerateClick = () => {
    setShowRegenerateConfirm(true);
  };

  const confirmRegenerate = async () => {
    await onRegenerate(table.id, table.table_number);
    setShowRegenerateConfirm(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          className="
            flex flex-col gap-0 p-0
            w-[90%] max-h-[90vh] 
            md:w-[80%] md:max-h-[85vh] 
            lg:w-full lg:max-w-[600px] 
            bg-card/95 backdrop-blur-xl border-border/50
            overflow-hidden rounded-lg shadow-2xl
          "
        >
          {/* Header */}
          <DialogHeader className="p-6 pb-2 text-center md:text-center space-y-2 relative">
            <DialogTitle className="text-2xl font-bold flex flex-col items-center justify-center gap-2">
              <span>Table {table.table_number}</span>
              <Badge variant="outline" className="text-xs font-normal bg-secondary/50">
                 QR Code Management
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-center">
              Scan to view menu and order directly from this table.
            </DialogDescription>
            {/* Standard Close button is handled by DialogPrimitive, but we can add custom if needed. 
                Existing DialogContent has a close button. We will trust it. */}
          </DialogHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
             <div className="flex flex-col items-center space-y-6">
                
                {/* QR Code Display */}
                <div className="relative group mx-auto">
                   <div className="absolute -inset-1 bg-gradient-to-r from-primary to-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                   <div className="relative bg-white p-4 rounded-xl shadow-xl">
                     <AnimatePresence mode="wait">
                       {loading ? (
                         <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                         >
                           <Skeleton className="h-[150px] w-[150px] md:h-[180px] md:w-[180px] lg:h-[200px] lg:w-[200px] rounded-lg" />
                         </motion.div>
                       ) : (
                         <motion.img
                            key="image"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            src={table.qr_code} 
                            alt={`QR Code Table ${table.table_number}`}
                            className="h-[150px] w-[150px] md:h-[180px] md:w-[180px] lg:h-[200px] lg:w-[200px] object-contain"
                         />
                       )}
                     </AnimatePresence>
                   </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4 w-full text-sm">
                   <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border/50">
                      <Users size={20} className="mb-1 text-primary" />
                      <span className="text-xs uppercase font-semibold tracking-wider">Capacity</span>
                      <span className="text-foreground font-bold text-lg">{table.capacity}</span>
                   </div>
                   <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border/50">
                      <MapPin size={20} className="mb-1 text-primary" />
                      <span className="text-xs uppercase font-semibold tracking-wider">Location</span>
                      <span className="text-foreground font-bold text-lg text-center truncate w-full">{table.location || 'N/A'}</span>
                   </div>
                </div>

                {/* URL Bar */}
                <div className="w-full flex items-center gap-2 bg-muted/50 p-2.5 rounded-lg border border-border group hover:border-primary/50 transition-colors">
                   <ExternalLink size={16} className="text-muted-foreground ml-1 shrink-0" />
                   <code className="text-xs text-muted-foreground truncate flex-1 font-mono select-all">
                     {table.qr_code_url || 'https://...'}
                   </code>
                   <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-7 px-2 text-xs" 
                      onClick={() => onCopyUrl(table.qr_code_url)}
                   >
                      <Copy size={12} className="mr-1.5" /> Copy
                   </Button>
                </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-2 bg-muted/10 border-t border-border mt-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                 <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 shadow-sm hover:shadow-md hover:border-primary/50 transition-all" 
                    onClick={() => onDownload(table.qr_code, 'png', table.table_number)}
                 >
                    <Download size={16} className="text-blue-500" /> 
                    <span>Download PNG</span>
                 </Button>

                 <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 shadow-sm hover:shadow-md hover:border-primary/50 transition-all" 
                    onClick={() => onDownload(table.qr_code, 'svg', table.table_number, table.qr_code_url)}
                 >
                    <FileJson size={16} className="text-amber-500" /> 
                    <span>Download SVG</span>
                 </Button>

                 <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 shadow-sm hover:shadow-md hover:border-primary/50 transition-all" 
                    onClick={() => onPrint(table.qr_code, table)}
                 >
                    <Printer size={16} className="text-amber-500" /> 
                    <span>Print QR</span>
                 </Button>

                 <Button 
                    variant="destructive" 
                    className="w-full justify-start gap-2 shadow-sm hover:shadow-md transition-all lg:col-span-2"
                    onClick={handleRegenerateClick}
                    disabled={loading}
                 >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    {loading ? "Generating..." : "Regenerate New Code"}
                 </Button>

                 <Button 
                    variant="ghost" 
                    className="w-full justify-center gap-2"
                    onClick={onClose}
                 >
                    Close
                 </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert */}
      <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate QR Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new QR code for Table {table.table_number}. 
              The actual URL usually stays the same if the table ID hasn't changed, but the pattern might look different.
              If the URL structure has changed, old QR codes will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRegenerate} className="bg-destructive hover:bg-destructive/90">
              {loading ? "Regenerating..." : "Yes, Regenerate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};