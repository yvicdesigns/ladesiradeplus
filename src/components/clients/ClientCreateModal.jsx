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
import { useToast } from '@/components/ui/use-toast';
import { CustomerDuplicateDetectionModal } from './CustomerDuplicateDetectionModal';

export const ClientCreateModal = ({ open, onClose, onSuccess, createClient, updateClient }) => {
  const [loading, setLoading] = useState(false);
  const [validatingTenant, setValidatingTenant] = useState(true);
  const [tenantError, setTenantError] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Duplicate Handling State
  const [duplicateCustomer, setDuplicateCustomer] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  const { toast } = useToast();
  
  const initialFormState = {
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Brazzaville',
    source_client: 'app',
    statut_client: 'normal',
    notes: '',
    user_id: null // Ensure user_id defaults to null
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (open) {
      setFormData(initialFormState);
      setSubmitError(null);
      setDuplicateCustomer(null);
      setShowDuplicateModal(false);
      setValidatingTenant(true);
      getRestaurantIdWithFallback().then(id => {
        setTenantError(!id);
        setValidatingTenant(false);
      });
    }
  }, [open]);

  const handleUpdateExisting = async () => {
    if (!duplicateCustomer || !updateClient) return;
    try {
      setLoading(true);
      const updateData = {
        name: formData.name || duplicateCustomer.name,
        phone: formData.phone || duplicateCustomer.phone,
        email: formData.email || duplicateCustomer.email,
        address: formData.address || duplicateCustomer.address,
        city: formData.city || duplicateCustomer.city,
        notes: formData.notes ? `${duplicateCustomer.notes || ''}\n[Nouveau]: ${formData.notes}` : duplicateCustomer.notes
      };

      const result = await updateClient(duplicateCustomer.id, updateData);
      
      if (result && result.success) {
        setShowDuplicateModal(false);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setSubmitError(result?.error || "La mise à jour a échoué.");
        setShowDuplicateModal(false);
      }
    } catch (err) {
      setSubmitError(err.message || "Erreur lors de la mise à jour.");
      setShowDuplicateModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    if (tenantError) {
      setSubmitError("Configuration du restaurant invalide.");
      return;
    }

    try {
      setLoading(true);
      setSubmitError(null);
      
      const payload = { ...formData };
      
      const result = await createClient(payload);
      
      if (result && result.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else if (result?.isDuplicate && result.existingCustomer) {
        setDuplicateCustomer(result.existingCustomer);
        setShowDuplicateModal(true);
      } else {
        setSubmitError(result?.error || "La création du client a échoué.");
      }
    } catch (err) {
      setSubmitError(err.message || "Une erreur inattendue a bloqué la création.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showDuplicateModal} onOpenChange={(isOpen) => !loading && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau client</DialogTitle>
          </DialogHeader>

          {validatingTenant ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
              <p className="text-sm text-slate-500">Vérification de l'environnement sécurisé...</p>
            </div>
          ) : tenantError ? (
            <Alert variant="destructive" className="my-4 border-red-200 bg-red-50 text-red-900">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Erreur de configuration</AlertTitle>
              <AlertDescription>
                Impossible de récupérer l'ID du restaurant.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {submitError && (
                 <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50 text-red-900">
                   <AlertCircle className="h-4 w-4 text-red-600" />
                   <AlertTitle className="font-bold text-red-800">Erreur</AlertTitle>
                   <AlertDescription>{submitError}</AlertDescription>
                 </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-semibold">Nom / Prénom <span className="text-red-500">*</span></Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required disabled={loading} className="text-gray-900 bg-white" placeholder="Ex: Jean Dupont" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 font-semibold">Téléphone <span className="text-red-500">*</span></Label>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required disabled={loading} className="text-gray-900 bg-white" placeholder="Ex: 06 123 45 67" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={loading} className="text-gray-900 bg-white" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-700 font-semibold">Adresse de livraison par défaut</Label>
                <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={loading} className="text-gray-900 bg-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Source</Label>
                  <Select disabled={loading} value={formData.source_client} onValueChange={v => setFormData({...formData, source_client: v})}>
                    <SelectTrigger className="text-gray-900 bg-white"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app">Application</SelectItem>
                      <SelectItem value="téléphone">Téléphone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sur_place">Sur Place</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Statut</Label>
                  <Select disabled={loading} value={formData.statut_client} onValueChange={v => setFormData({...formData, statut_client: v})}>
                    <SelectTrigger className="text-gray-900 bg-white"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Standard</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="entreprise">Entreprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-700 font-semibold">Notes internes</Label>
                <Textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} disabled={loading} className="text-gray-900 bg-white resize-none" />
              </div>

              <DialogFooter className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
                <Button type="submit" disabled={loading || !formData.name || !formData.phone} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Traitement...</> : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <CustomerDuplicateDetectionModal 
        open={showDuplicateModal}
        customer={duplicateCustomer}
        onUpdate={handleUpdateExisting}
        onCancel={() => {
          setShowDuplicateModal(false);
          setSubmitError("Veuillez utiliser un autre numéro ou annuler.");
        }}
        isUpdating={loading}
      />
    </>
  );
};