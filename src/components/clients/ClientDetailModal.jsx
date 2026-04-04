import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Phone, Mail, MapPin, Calendar, CreditCard, ShoppingBag, PlusCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

export const ClientDetailModal = ({ open, onClose, client, onUpdate, onCreateOrder }) => {
  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl p-0 overflow-hidden border-none shadow-xl">
        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold flex items-center gap-3 text-slate-800">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <User className="h-5 w-5" />
            </div>
            Détails du Client
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Main Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{client.name || 'Sans nom'}</h3>
              <p className="text-sm text-slate-500 flex items-center mt-1">
                <Calendar className="h-4 w-4 mr-1.5" />
                Inscrit le {formatDateTime(client.created_at, true)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{client.phone || 'Non spécifié'}</p>
                  <p className="text-xs text-slate-500">Téléphone</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{client.email || 'Non spécifié'}</p>
                  <p className="text-xs text-slate-500">Email</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {client.address ? `${client.address}${client.city ? `, ${client.city}` : ''}` : 'Non spécifiée'}
                  </p>
                  <p className="text-xs text-slate-500">Adresse</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 flex items-center mb-1"><ShoppingBag className="h-3.5 w-3.5 mr-1" /> Total Commandes</span>
              <span className="text-lg font-bold text-slate-900">{client.total_visits || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 flex items-center mb-1"><CreditCard className="h-3.5 w-3.5 mr-1" /> Total Dépensé</span>
              <span className="text-lg font-bold text-emerald-600">{formatCurrency(client.total_spent || 0)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 flex-col sm:flex-row gap-2 sm:justify-between items-center">
          <Button variant="outline" onClick={onClose} className="bg-white w-full sm:w-auto">
            Fermer
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => onCreateOrder && onCreateOrder(client)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Créer Commande
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};