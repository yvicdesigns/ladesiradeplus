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
import { Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency } from '@/lib/formatters';

export const DeleteOrderModal = ({ open, onClose, order, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(order);
      // onClose is usually handled by parent after success, or automatically if parent removes the item which closes modal
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!order) return null;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md border-red-200 bg-red-50/50">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-6 w-6" />
            <AlertDialogTitle className="text-xl">Supprimer la commande ?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-700">
            Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est <strong>irréversible</strong>.
          </AlertDialogDescription>
          
          <div className="bg-white p-4 rounded-lg border border-red-100 mt-4 space-y-2 text-sm shadow-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ID Commande:</span>
              <span className="font-mono font-medium">#{order.id?.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Client:</span>
              <span className="font-medium">{order.customer_name || 'Client Inconnu'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Montant:</span>
              <span className="font-bold text-red-600">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Articles:</span>
              <span className="font-medium">
                {order.order_items?.length || order.items_count || 0} articles
              </span>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isDeleting} className="bg-white hover:bg-gray-100 border-gray-200">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
          >
            {isDeleting ? (
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