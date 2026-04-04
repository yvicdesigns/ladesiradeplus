import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Plus, MapPin, Truck, Trash2, Edit } from 'lucide-react';
import { DeliveryCreateModal } from '@/components/DeliveryCreateModal';
import { DeliveryZoneEditModal } from '@/components/DeliveryZoneEditModal';
import { ConfirmationDeleteModal } from '@/components/ConfirmationDeleteModal';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const AdminDeliveryPage = () => {
  const { data: zones, loading, refetch } = useRealtimeSubscription('delivery_zones');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { error } = await supabase.from('delivery_zones').delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      toast({ title: "Zone supprimée", description: "La zone de livraison a été supprimée avec succès." });
      setDeleteConfirm(null);
      refetch();
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la zone." });
    }
  };

  const handleUpdateZone = async (updatedData) => {
    if (!editingZone) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('delivery_zones')
        .update(updatedData)
        .eq('id', editingZone.id);
        
      if (error) throw error;
      
      toast({ 
        title: "Zone mise à jour", 
        description: "Les informations de la zone ont été modifiées avec succès." 
      });
      setEditingZone(null); // Close modal on success
      refetch();
    } catch (error) {
      console.error("Error updating zone:", error);
      toast({ 
        variant: "destructive", 
        title: "Erreur de mise à jour", 
        description: error.message || "Impossible de modifier la zone." 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Zones de Livraison</h1>
            <p className="text-sm text-muted-foreground">Configurez les zones, frais et temps estimés.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Ajouter Zone
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10 flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-2 text-muted-foreground">Chargement des zones...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones?.map((zone) => (
              <Card key={zone.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                      {zone.name}
                    </CardTitle>
                    <Badge variant="outline" className="bg-background">
                      {zone.estimated_time || '30-45 min'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Frais de livraison</span>
                      <span className="font-bold text-lg">{zone.delivery_fee} FCFA</span>
                    </div>
                    
                    {/* Fix: Removed opacity-0 group-hover:opacity-100 which makes buttons inaccessible on mobile/touch screens */}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="Modifier la zone"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card clicks if any are added later
                          setEditingZone(zone);
                        }}
                        className="text-primary hover:bg-primary/10 border-primary/20 cursor-pointer transition-all"
                      >
                        <Edit className="h-4 w-4 mr-1.5" />
                        Modifier
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Supprimer la zone"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(zone);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {zones?.length === 0 && (
              <div className="col-span-full text-center py-12 bg-muted/10 rounded-xl border border-dashed">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">Aucune zone configurée</h3>
                <p className="text-muted-foreground text-sm mt-1">Commencez par ajouter votre première zone de livraison.</p>
              </div>
            )}
          </div>
        )}

        <DeliveryCreateModal 
          open={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
          onSuccess={refetch}
        />

        <DeliveryZoneEditModal
          open={!!editingZone}
          zone={editingZone}
          onClose={() => setEditingZone(null)}
          onSave={handleUpdateZone}
          isSubmitting={isUpdating}
        />

        <ConfirmationDeleteModal 
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Supprimer la zone"
          description="Êtes-vous sûr de vouloir supprimer cette zone de livraison ?"
        />
      </div>
    </AdminLayout>
  );
};

export default AdminDeliveryPage;