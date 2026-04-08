import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Send, Smartphone, CheckCircle, Loader2, Receipt, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { formatCurrency } from '@/lib/formatters';
import { useRealtimeOrderTracking } from '@/hooks/useRealtimeOrderTracking';
import { PAYMENT_STATUSES } from '@/lib/deliveryConstants';

export const PaymentProofPage = () => {
  const { orderId, orderType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const tableName = orderType === 'delivery' ? 'delivery_orders' : 'restaurant_orders';
  const { paymentStatus: realtimePaymentStatus } = useRealtimeOrderTracking(orderId, tableName);

  const [orderTotal, setOrderTotal] = useState(location.state?.total || 0);
  const [orderDetails, setOrderDetails] = useState(location.state?.order || null);
  const [mobileMoneyType, setMobileMoneyType] = useState(location.state?.mobileMoneyType || 'mtn');

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [adminConfig, setAdminConfig] = useState({});
  const [restaurantPhone, setRestaurantPhone] = useState('');
  
  const [formData, setFormData] = useState({
    payerPhone: '',
    transactionRef: '',
    file: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (realtimePaymentStatus === PAYMENT_STATUSES.CONFIRMED || realtimePaymentStatus === 'paid') {
      toast({
        title: "Paiement confirmé !",
        description: "Votre paiement a été validé avec succès.",
        className: "bg-amber-500 text-white"
      });
      // UPDATED: Redirect to Tracking Page
      navigate(orderType === 'delivery' ? `/track-order/${orderId}` : `/track-restaurant-order/${orderId}`);
    }
  }, [realtimePaymentStatus, navigate, orderId, toast]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: configData } = await supabase.from('admin_config').select('*');
        if (configData) {
          const config = configData.reduce((acc, item) => { acc[item.config_key] = item.config_value; return acc; }, {});
          setAdminConfig(config);
        }
        const { data: settingsData } = await supabase.from('admin_settings').select('restaurant_phone').maybeSingle();
        if (settingsData) {
          setRestaurantPhone(settingsData.restaurant_phone);
        }
        if (!orderDetails && orderId) {
          const { data: order, error } = await supabase.from(tableName).select('*').eq('id', orderId).maybeSingle();
          if (error) throw error;
          setOrderDetails(order);
          setOrderTotal(order.total_with_fee || order.total_amount || order.total || 0);
          if (order.mobile_money_type) setMobileMoneyType(order.mobile_money_type);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId, tableName]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAndSend = async () => {
    if (!formData.payerPhone || !formData.transactionRef || !formData.file) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Veuillez tout remplir." });
      return;
    }
    const whatsappTarget = adminConfig.whatsapp_number || restaurantPhone;
    if (!whatsappTarget) {
         toast({ variant: 'destructive', title: 'Erreur', description: "Contact non configuré." });
         return;
    }

    setUploading(true);
    try {
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${orderType}_${orderId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('payment-screenshots').upload(fileName, formData.file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('payment-screenshots').getPublicUrl(fileName);

      const updatePayload = {
        payment_screenshot_url: publicUrl,
        payment_status: orderType === 'delivery' ? PAYMENT_STATUSES.PENDING : 'pending', 
      };
      if (orderType === 'delivery' && (!orderDetails?.status || orderDetails.status === 'pending')) {
           updatePayload.status = 'pending';
      }

      await supabase.from(tableName).update(updatePayload).eq('id', orderId);

      const message = encodeURIComponent(`*PREUVE DE PAIEMENT*\nRef: ${formData.transactionRef}\nPreuve: ${publicUrl}`);
      const waLink = `https://wa.me/${whatsappTarget.replace(/\D/g, '')}?text=${message}`;

      toast({ title: "Preuve envoyée !", description: "Redirection vers le suivi..." });
      window.open(waLink, '_blank');
      
      // UPDATED: Redirect to Tracking Page immediately
      navigate(orderType === 'delivery' ? `/track-order/${orderId}` : `/track-restaurant-order/${orderId}`);

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Erreur", description: "Échec de l'envoi." });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <Helmet><title>Paiement - La Desirade Plus</title></Helmet>
      <div className="min-h-screen bg-gray-50 pb-12">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container max-w-lg mx-auto px-4 h-16 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
            <h1 className="font-bold text-lg">Confirmer le paiement</h1>
          </div>
        </div>
        <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
          <Card className="border-none shadow-sm">
             <CardHeader className="pb-4">
                <CardTitle className="flex justify-between items-center text-lg">
                   <span>Total</span>
                   <span className="text-[#D97706] font-bold text-xl">{formatCurrency(orderTotal)}</span>
                </CardTitle>
             </CardHeader>
          </Card>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
             <Card>
                <CardContent className="space-y-5 pt-6">
                   <div className="space-y-2">
                      <Label>Capture d'écran</Label>
                      <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer relative bg-gray-50">
                         <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                         {previewUrl ? <img src={previewUrl} className="mx-auto h-40 object-contain" alt="Preview"/> : <Upload className="w-8 h-8 mx-auto text-gray-400" />}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label>Réf. Transaction</Label>
                      <Input value={formData.transactionRef} onChange={(e) => setFormData({...formData, transactionRef: e.target.value})} placeholder="ID Transaction" />
                   </div>
                   <div className="space-y-2">
                      <Label>Tél Payeur</Label>
                      <Input value={formData.payerPhone} onChange={(e) => setFormData({...formData, payerPhone: e.target.value})} placeholder="07 XX XX XX XX" />
                   </div>
                </CardContent>
             </Card>
             <Button size="lg" className="w-full h-14 bg-green-600 hover:bg-green-700 text-white" onClick={handleUploadAndSend} disabled={uploading}>
                {uploading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-5 w-5" />}
                Envoyer Preuve
             </Button>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default PaymentProofPage;