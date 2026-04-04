import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, UserCheck, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

export const CustomerDuplicateDetectionModal = ({ open, customer, onUpdate, onCancel, isUpdating }) => {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isUpdating && !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            Client Existant Détecté
          </DialogTitle>
          <DialogDescription>
            Un client avec ces informations existe déjà dans votre base de données pour ce restaurant.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 my-2">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-amber-200">
            <div className="bg-amber-100 p-2 rounded-full">
              <UserCheck className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">{customer.name || 'Client sans nom'}</h4>
              <p className="text-xs text-amber-700 font-medium capitalize">Statut: {customer.statut_client || 'Normal'}</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-amber-800">
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 opacity-70" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 opacity-70" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 opacity-70" />
                <span className="truncate">{customer.address} {customer.city ? `- ${customer.city}` : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Calendar className="h-4 w-4 opacity-70" />
              <span>Inscrit le {formatDateTime(customer.created_at, true)}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-2">
          Voulez-vous mettre à jour les informations de ce client avec les nouvelles données saisies ?
        </p>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isUpdating}>
            Annuler la création
          </Button>
          <Button onClick={onUpdate} disabled={isUpdating} className="bg-amber-600 hover:bg-amber-700 text-white">
            {isUpdating ? "Mise à jour en cours..." : "Mettre à jour ce client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};