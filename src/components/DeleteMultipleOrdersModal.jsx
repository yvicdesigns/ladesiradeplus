import React, { useState } from 'react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { formatCurrency } from '@/lib/formatters';

export const DeleteMultipleOrdersModal = ({ 
  open, 
  onClose, 
  orders = [], 
  onConfirm, 
  loading = false 
}) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md md:max-w-lg border-red-200 bg-red-50/50">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <Trash2 className="h-6 w-6" />
            <AlertDialogTitle className="text-xl">Suppression définitive</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-800">
            <span className="flex items-center gap-2 font-bold text-red-700 mb-2">
               <AlertTriangle className="h-4 w-4" /> Action irréversible
            </span>
            Vous êtes sur le point de supprimer définitivement <strong>{orders.length}</strong> commande(s). Ces données seront perdues à jamais.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <ScrollArea className="h-[200px] w-full rounded-md border border-red-200 bg-white p-2 mt-2">
          {orders.map((order) => (
            <div key={order.id} className="flex justify-between items-center p-2 text-sm border-b last:border-0 border-gray-100">
               <div>
                 <span className="font-semibold block text-red-900">{order.customer_name || 'Client Inconnu'}</span>
                 <span className="text-xs text-muted-foreground">{order.id.slice(0,8)}</span>
               </div>
               <div className="text-right">
                  <span className="font-medium">{formatCurrency(order.total || 0)}</span>
                  <div className="text-[10px] text-muted-foreground uppercase">{order.ui_type || 'Order'}</div>
               </div>
            </div>
          ))}
        </ScrollArea>

        <div className="flex items-center space-x-2 mt-4 p-3 bg-red-100/50 rounded-lg border border-red-200">
          <Checkbox id="confirm-delete" checked={confirmed} onCheckedChange={setConfirmed} className="border-red-400 text-red-600 focus:ring-red-600" />
          <Label htmlFor="confirm-delete" className="text-sm font-medium text-red-900 cursor-pointer">
            Je confirme vouloir supprimer définitivement ces données.
          </Label>
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={loading} className="bg-white hover:bg-gray-100 border-gray-200">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              if (confirmed) onConfirm();
            }}
            disabled={loading || !confirmed}
            className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer définitivement"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};