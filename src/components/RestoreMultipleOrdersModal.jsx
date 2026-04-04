import React from 'react';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw } from "lucide-react";
import { formatCurrency } from '@/lib/formatters';

export const RestoreMultipleOrdersModal = ({ 
  open, 
  onClose, 
  orders = [], 
  onConfirm, 
  loading = false 
}) => {
  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md md:max-w-lg border-amber-200 bg-amber-50/50">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <RefreshCw className="h-6 w-6" />
            <AlertDialogTitle className="text-xl">Restaurer {orders.length} commande(s) ?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-700">
            Les commandes suivantes seront restaurées et réapparaîtront dans leur liste respective :
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <ScrollArea className="h-[200px] w-full rounded-md border border-amber-200 bg-white p-2 mt-2">
          {orders.map((order) => (
            <div key={order.id} className="flex justify-between items-center p-2 text-sm border-b last:border-0 border-gray-100">
               <div>
                 <span className="font-semibold block">{order.customer_name || 'Client Inconnu'}</span>
                 <span className="text-xs text-muted-foreground">{order.id.slice(0,8)}</span>
               </div>
               <div className="text-right">
                  <span className="font-medium">{formatCurrency(order.total || 0)}</span>
                  <div className="text-[10px] text-muted-foreground uppercase">{order.ui_type || 'Order'}</div>
               </div>
            </div>
          ))}
        </ScrollArea>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={loading} className="bg-white hover:bg-gray-100 border-gray-200">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white border-none shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restauration...
              </>
            ) : (
              "Confirmer la restauration"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};