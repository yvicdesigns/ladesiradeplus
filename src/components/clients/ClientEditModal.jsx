import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { getRestaurantIdWithFallback } from '@/lib/restaurantUtils';

export const ClientEditModal = ({ open, onClose, client, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [validatingTenant, setValidatingTenant] = useState(true);
  const [tenantError, setTenantError] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', statut_client: 'normal', notes: ''
  });

  useEffect(() => {
    if (open) {
      setValidatingTenant(true);
      getRestaurantIdWithFallback().then(id => {
        setTenantError(!id);
        setValidatingTenant(false);
      });
    }
  }, [open]);

  useEffect(() => {
    if (client && open) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        statut_client: client.statut_client || 'normal',
        notes: client.notes || '',
      });
    }
  }, [client, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || tenantError) return;
    setLoading(true);
    await onUpdate(client.id, formData);
    setLoading(false);
    onClose();
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
        </DialogHeader>

        {validatingTenant ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : tenantError ? (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de configuration</AlertTitle>
            <AlertDescription>
              Impossible de récupérer l'ID du restaurant. Les modifications ont été désactivées pour des raisons de sécurité.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom / Prénom *</Label>
                <Input id="edit-name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="text-gray-900" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Téléphone *</Label>
                <Input id="edit-phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="text-gray-900" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="text-gray-900" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Adresse</Label>
              <Input id="edit-address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="text-gray-900" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source (Non modifiable)</Label>
                <Input value={client.source_client || 'app'} disabled className="bg-gray-50 text-gray-500" />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formData.statut_client} onValueChange={v => setFormData({...formData, statut_client: v})}>
                  <SelectTrigger className="text-gray-900"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="entreprise">Entreprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes internes</Label>
              <Textarea id="edit-notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} className="text-gray-900" />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
              <Button type="submit" disabled={loading || !formData.name || !formData.phone}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};