import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UploadCloud, CheckCircle, Smartphone, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useTranslation } from 'react-i18next';

export const MobileMoneyPaymentPage = () => {
  const { orderId, orderType } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [adminConfig, setAdminConfig] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchOrderAndConfig();
  }, [orderId]);

  const fetchOrderAndConfig = async () => {
    try {
      setLoading(true);
      const table = orderType === 'delivery' ? 'delivery_orders' : 'restaurant_orders';
      // restaurant_orders has no total column — must join orders to get the total
      const selectClause = orderType === 'restaurant' ? '*, orders:order_id(total)' : '*';

      const { data: orderData, error: orderError } = await supabase
        .from(table)
        .select(selectClause)
        .eq('id', orderId)
        .maybeSingle();
        
      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: configRows } = await supabase
        .from('admin_config')
        .select('config_key, config_value');

      if (configRows) {
        const config = configRows.reduce((acc, item) => {
          acc[item.config_key] = item.config_value;
          return acc;
        }, {});
        setAdminConfig(config);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: "Impossible de charger les détails de la commande."
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
        toast({
            variant: "destructive",
            title: "Format invalide",
            description: t('payment.upload_format')
        });
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
            variant: "destructive",
            title: "Fichier trop volumineux",
            description: "La taille maximale autorisée est de 5 MB."
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(filePath);

      // Update Order
      const table = orderType === 'delivery' ? 'delivery_orders' : 'restaurant_orders';
      const { error: updateError } = await supabase
        .from(table)
        .update({
            payment_screenshot_url: publicUrl
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      toast({
        title: t('payment.success_title'),
        description: t('payment.success_desc'),
        className: "bg-amber-50 border-amber-200"
      });

      // Redirect to Confirmation
      // Pass the main order ID if available, or just use the specific ID if that's what we have
      const targetId = order.order_id || order.id; 
      
      navigate(`/order-confirmation/${targetId}`, { 
        replace: true,
        state: { 
            order: { ...order, payment_screenshot_url: publicUrl, total: order.total_amount || order.orders?.total || order.total },
            type: orderType,
            items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items 
        } 
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: "Impossible d'envoyer la preuve de paiement."
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isMtn = order.mobile_money_type === 'mtn';
  const phoneNumber = isMtn ? adminConfig?.mtn_mobile_money : adminConfig?.airtel_mobile_money;
  const operatorColor = isMtn ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-red-600 bg-red-50 border-red-200';
  const amount = order.total_with_fee || order.total_amount || order.orders?.total || order.total || 0;

  return (
    <>
      <Helmet>
        <title>{t('payment.title')} - La Desirade Plus</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{t('payment.title')}</CardTitle>
            <CardDescription>{t('payment.subtitle')}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className={`p-4 rounded-xl border ${operatorColor} flex flex-col items-center text-center space-y-1`}>
               <span className="text-xs uppercase font-bold tracking-wider opacity-70">
                 {t('payment.send_via', { operator: isMtn ? 'MTN' : 'Airtel' })}
               </span>
               <span className="text-3xl font-bold">{formatCurrency(amount)}</span>
               <span className="text-sm">{t('payment.to_number')}</span>
               <span className="text-xl font-mono font-bold tracking-wider">{phoneNumber || 'Non configuré'}</span>
            </div>

            <div className="text-center text-sm text-gray-500 bg-white p-3 rounded border">
                {t('payment.ref_order')} <span className="font-bold text-gray-900">#{order.id.slice(0,8)}</span>
            </div>

            {/* Instructions de paiement */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">?</span>
                Comment procéder
              </p>
              {isMtn ? (
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2"><span className="font-bold text-yellow-600 flex-shrink-0">1.</span> Composez <span className="font-mono font-bold">*165#</span> sur votre téléphone MTN</li>
                  <li className="flex gap-2"><span className="font-bold text-yellow-600 flex-shrink-0">2.</span> Sélectionnez <span className="font-semibold">"Transfert d'argent"</span></li>
                  <li className="flex gap-2"><span className="font-bold text-yellow-600 flex-shrink-0">3.</span> Entrez le numéro : <span className="font-mono font-bold">{phoneNumber}</span></li>
                  <li className="flex gap-2"><span className="font-bold text-yellow-600 flex-shrink-0">4.</span> Entrez le montant : <span className="font-bold">{formatCurrency(amount)}</span></li>
                  <li className="flex gap-2"><span className="font-bold text-yellow-600 flex-shrink-0">5.</span> Confirmez avec votre code PIN MTN</li>
                  <li className="flex gap-2"><span className="font-bold text-yellow-600 flex-shrink-0">6.</span> Prenez une capture d'écran du SMS de confirmation et envoyez-la ci-dessous</li>
                </ol>
              ) : (
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2"><span className="font-bold text-red-600 flex-shrink-0">1.</span> Composez <span className="font-mono font-bold">*555#</span> sur votre téléphone Airtel</li>
                  <li className="flex gap-2"><span className="font-bold text-red-600 flex-shrink-0">2.</span> Sélectionnez <span className="font-semibold">"Envoyer de l'argent"</span></li>
                  <li className="flex gap-2"><span className="font-bold text-red-600 flex-shrink-0">3.</span> Entrez le numéro : <span className="font-mono font-bold">{phoneNumber}</span></li>
                  <li className="flex gap-2"><span className="font-bold text-red-600 flex-shrink-0">4.</span> Entrez le montant : <span className="font-bold">{formatCurrency(amount)}</span></li>
                  <li className="flex gap-2"><span className="font-bold text-red-600 flex-shrink-0">5.</span> Confirmez avec votre code PIN Airtel Money</li>
                  <li className="flex gap-2"><span className="font-bold text-red-600 flex-shrink-0">6.</span> Prenez une capture d'écran du SMS de confirmation et envoyez-la ci-dessous</li>
                </ol>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
                ⚠️ Mentionnez la référence <span className="font-bold">#{order.id.slice(0,8)}</span> dans le motif du transfert si possible.
              </div>
            </div>

            <div className="space-y-3 pt-2">
               <Label className="block text-sm font-medium text-gray-700">{t('payment.proof_label')}</Label>
               <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                  <Input 
                    type="file" 
                    accept="image/png, image/jpeg" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                     {file ? (
                        <>
                           <CheckCircle className="h-8 w-8 text-amber-500" />
                           <span className="text-sm font-medium text-amber-700">{file.name}</span>
                        </>
                     ) : (
                        <>
                           <UploadCloud className="h-8 w-8 text-gray-400" />
                           <span className="text-sm text-gray-500">{t('payment.upload_placeholder')}</span>
                           <span className="text-xs text-gray-400">{t('payment.upload_format')}</span>
                        </>
                     )}
                  </div>
               </div>
            </div>

            <Button 
                onClick={handleUpload} 
                disabled={!file || uploading} 
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90"
            >
                {uploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('payment.uploading')}
                    </>
                ) : (
                    <>
                        {t('payment.confirm_transfer')} <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MobileMoneyPaymentPage;