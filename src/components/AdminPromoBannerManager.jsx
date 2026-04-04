import React, { useState, useEffect } from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { BannerPreviewCard } from '@/components/BannerPreviewCard';
import { BannerFormModal } from '@/components/BannerFormModal';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { ensureDefaultBanner } from '@/lib/promoUtils';
import { syncBannerWithProduct, removePromoFromProduct } from '@/lib/bannerSyncUtils';
import { generatePromoQRCode } from '@/lib/qrCodeUtils';
import { Card, CardContent } from '@/components/ui/card';

export const AdminPromoBannerManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const { toast } = useToast();

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*, product:product_id(id, name, price, image_url)')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast({ 
        variant: "destructive", 
        title: "Erreur de chargement", 
        description: "Impossible de charger les bannières. Vérifiez votre connexion." 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('promo_banners_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_banners' }, fetchBanners)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, fetchBanners)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreate = () => {
    setSelectedBanner(null);
    setIsFormOpen(true);
  };

  const handleEdit = (banner) => {
    setSelectedBanner({ ...banner });
    setIsFormOpen(true);
  };

  const handleDuplicate = (banner) => {
    const { id, created_at, updated_at, product, linked_product, qr_code_data, qr_generated_at, ...rest } = banner;
    setSelectedBanner({
      ...rest,
      title: `${rest.title} (Copie)`,
      display_order: banners.length > 0 ? Math.max(...banners.map(b => b.display_order)) + 1 : 1
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (banner) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette bannière ?")) return;
    
    try {
      if (banner.linked_product_id) {
         try {
            await removePromoFromProduct(banner.linked_product_id);
         } catch (e) {
            console.warn("Could not remove legacy promo link", e);
         }
      }

      const { error } = await supabase
        .from('promo_banners')
        .delete()
        .eq('id', banner.id);

      if (error) {
        throw new Error(error.message || "Erreur lors de la suppression");
      }
      
      toast({ title: "Bannière supprimée" });
      fetchBanners();
    } catch (error) {
      console.error("Delete error:", error);
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  };

  const handleSave = async (data) => {
     try {
       const payload = { ...data };
       
       delete payload.product;
       delete payload.linked_product;
       delete payload.qr_code_data; // Don't allow manual overwrite
       delete payload.qr_generated_at;
       
       payload.discount_percentage = Number(payload.discount_percentage) || 0;
       payload.discount_value = Number(payload.discount_value) || 0;
       payload.original_price = Number(payload.original_price) || 0;
       payload.display_order = Number(payload.display_order) || 0;
       
       if (payload.product_id === 'none' || payload.product_id === '') payload.product_id = null;
       if (payload.linked_product_id === 'none' || payload.linked_product_id === '') payload.linked_product_id = null;

       if (payload.product_id && !payload.linked_product_id) {
         payload.linked_product_id = payload.product_id;
       }

       if (payload.image_url) delete payload.image_url;

       let resultId;
       let resultObj;
       
       if (selectedBanner && selectedBanner.id) {
         const { data: updatedData, error } = await supabase
           .from('promo_banners')
           .update({
             ...payload,
             updated_at: new Date().toISOString()
           })
           .eq('id', selectedBanner.id)
           .select()
           .single();
           
         if (error) throw error;
         resultId = updatedData.id;
         resultObj = updatedData;
         
         try {
             await syncBannerWithProduct(payload, selectedBanner);
         } catch (syncErr) {
             console.warn("Product sync warning:", syncErr);
         }

       } else {
         if (!payload.display_order) {
            const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.display_order || 0)) : 0;
            payload.display_order = maxOrder + 1;
         }
         
         const { data: insertedData, error } = await supabase
           .from('promo_banners')
           .insert([{
             ...payload,
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString()
           }])
           .select()
           .single();
           
         if (error) throw error;
         resultId = insertedData.id;
         resultObj = insertedData;

         try {
             await syncBannerWithProduct(payload, null);
         } catch (syncErr) {
             console.warn("Product sync warning:", syncErr);
         }
       }
       
       // Handle QR Code Generation
       if (resultId) {
         try {
           const qrUrl = `${window.location.origin}/promo-popup/${resultId}`;
           const qrDataUrl = await generatePromoQRCode(qrUrl);
           
           if (qrDataUrl) {
             await supabase
               .from('promo_banners')
               .update({ 
                 qr_code_data: qrDataUrl, 
                 qr_generated_at: new Date().toISOString() 
               })
               .eq('id', resultId);
           }
         } catch (qrErr) {
           console.error("Failed to generate QR code:", qrErr);
           toast({ 
             variant: "destructive", 
             title: "Attention", 
             description: "La bannière est sauvegardée mais la génération du QR Code a échoué." 
           });
         }
       }
       
       toast({ title: "Succès", description: "Bannière enregistrée avec succès." });
       setIsFormOpen(false);
       fetchBanners();
       return resultObj;

     } catch (error) {
        console.error("CRITICAL SAVE ERROR:", error);
        let errorMessage = "Impossible d'enregistrer la bannière.";
        if (error.code === '42501') errorMessage = "Erreur de permissions (RLS). Vous n'avez pas les droits d'admin.";
        if (error.code === '23505') errorMessage = "Une bannière avec cet ID existe déjà.";
        if (error.message) errorMessage += ` (${error.message})`;

        toast({ 
            variant: "destructive", 
            title: "Erreur d'enregistrement", 
            description: errorMessage
        });
        throw error;
     }
  };

  const handleReorder = async (newOrder) => {
    setBanners(newOrder); 
    
    try {
      const updates = newOrder.map((banner, index) => ({
        id: banner.id,
        display_order: index + 1
      }));
      
      for (const update of updates) {
         await supabase.from('promo_banners').update({ display_order: update.display_order }).eq('id', update.id);
      }
    } catch (error) {
       console.error("Reorder failed:", error);
       toast({ variant: "destructive", title: "Erreur", description: "Impossible de réorganiser les bannières." });
       fetchBanners(); 
    }
  };

  const handleCreateDefault = async () => {
     setLoading(true);
     try {
        const newBanner = await ensureDefaultBanner();
        if (newBanner && newBanner.id) {
            const qrUrl = `${window.location.origin}/promo-popup/${newBanner.id}`;
            const qrDataUrl = await generatePromoQRCode(qrUrl);
            if (qrDataUrl) {
                await supabase.from('promo_banners').update({ 
                    qr_code_data: qrDataUrl, 
                    qr_generated_at: new Date().toISOString() 
                }).eq('id', newBanner.id);
            }
        }
        toast({ title: "Succès", description: "Bannière par défaut restaurée." });
        fetchBanners();
     } catch (e) {
        toast({ variant: "destructive", title: "Erreur", description: "Échec de la restauration." });
     } finally {
        setLoading(false);
     }
  };

  if (loading && banners.length === 0) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
           <h2 className="text-lg font-semibold flex items-center gap-2">
             Bannières actives 
             <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
               {banners.filter(b => b.is_active).length}
             </span>
           </h2>
           <p className="text-sm text-muted-foreground">Gérez vos promotions et leurs QR codes respectifs.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={handleCreateDefault} className="flex-1 md:flex-none">
               <RefreshCw className="mr-2 h-4 w-4" /> Restaurer défaut
            </Button>
            <Button size="sm" onClick={handleCreate} className="flex-1 md:flex-none">
               <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
        </div>
      </div>

      {banners.length === 0 ? (
        <Card className="border-dashed bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mb-4 opacity-20" />
                <p className="font-medium">Aucune bannière configurée</p>
                <p className="text-sm mt-1">Commencez par créer une nouvelle promotion.</p>
                <Button variant="link" onClick={handleCreateDefault} className="mt-4">
                    Créer une bannière exemple
                </Button>
            </CardContent>
        </Card>
      ) : (
        <Reorder.Group axis="y" values={banners} onReorder={handleReorder} className="space-y-4">
            <AnimatePresence initial={false}>
                {banners.map((banner) => (
                    <Reorder.Item key={banner.id} value={banner} dragListener={true}>
                        <BannerPreviewCard 
                            banner={banner}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onToggleActive={()=>{}}
                            dragHandleProps={{}} 
                        />
                    </Reorder.Item>
                ))}
            </AnimatePresence>
        </Reorder.Group>
      )}

      <BannerFormModal 
         open={isFormOpen} 
         onClose={() => setIsFormOpen(false)} 
         banner={selectedBanner}
         onSave={handleSave}
      />
    </div>
  );
};