import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlayCircle, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRestaurant } from '@/contexts/RestaurantContext';

export const AdminOrderAtomicTransactionTestPage = () => {
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runTest = async () => {
    setLoading(true);
    setResults(null);
    const logs = [];
    let success = false;
    let orderIdCreated = null;

    try {
      logs.push('Début du test de transaction atomique...');
      
      // 1. Fetch valid menu item
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, price')
        .eq('is_deleted', false)
        .limit(1);

      if (menuError || !menuItems || menuItems.length === 0) {
        throw new Error("Impossible de récupérer un article valide pour le test.");
      }
      const validMenuItemId = menuItems[0].id;
      const validPrice = menuItems[0].price;

      // 2. Test Success Path
      logs.push('1. Test d\'insertion VALIDE avec la fonction RPC...');
      const rpcArgsSuccess = {
        p_user_id: null,
        p_restaurant_id: restaurantId,
        p_customer_name: 'Test Atomique Valide',
        p_customer_phone: '123456789',
        p_customer_email: null,
        p_delivery_address: null,
        p_order_type: 'dine_in',
        p_table_id: null,
        p_order_method: 'counter',
        p_items: [
            { menu_item_id: validMenuItemId, quantity: 2, price: validPrice, notes: 'Test RPC' }
        ],
        p_total: validPrice * 2,
        p_discount_breakdown: null,
        p_promo_code_id: null,
        p_delivery_data: null,
        p_restaurant_data: { customer_id: null, payment_status: 'paid', payment_method: 'cash' }
      };

      const { data: successData, error: successError } = await supabase.rpc('create_order_with_items', rpcArgsSuccess);
      
      if (successError) {
          logs.push(`❌ Échec de l'insertion valide: ${successError.message}`);
          throw new Error("L'insertion valide a échoué.");
      }

      orderIdCreated = successData.order_id;
      logs.push(`✅ Commande créée avec succès (ID: ${orderIdCreated}). Transaction atomique validée pour le chemin de réussite.`);

      // Verify order items exist
      const { count: itemCount } = await supabase.from('order_items').select('*', { count: 'exact', head: true }).eq('order_id', orderIdCreated);
      if (itemCount === 1) {
          logs.push(`✅ Vérification des items: 1 ligne trouvée dans order_items.`);
      } else {
          logs.push(`❌ Erreur: nombre d'items inattendu (${itemCount}).`);
      }

      // 3. Test Rollback Path (Invalid item data causing FK error)
      logs.push('\n2. Test d\'insertion INVALIDE (simulation d\'erreur FK) pour vérifier le Rollback...');
      
      const rpcArgsFail = {
        ...rpcArgsSuccess,
        p_customer_name: 'Test Atomique Invalide (Devrait être annulé)',
        p_items: [
            { menu_item_id: validMenuItemId, quantity: 1, price: validPrice, notes: 'Valide' },
            { menu_item_id: '00000000-0000-0000-0000-000000000001', quantity: 1, price: 1000, notes: 'Invalide' } // FK Violation
        ]
      };

      const { data: failData, error: failError } = await supabase.rpc('create_order_with_items', rpcArgsFail);

      if (failError) {
          logs.push(`✅ Erreur correctement interceptée par la base de données: ${failError.message}`);
          
          // Verify nothing was inserted partially
          const { count: orphanOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('customer_name', 'Test Atomique Invalide (Devrait être annulé)');
          if (orphanOrders === 0) {
              logs.push(`✅ Rollback confirmé : aucune commande partielle n'a été insérée.`);
              success = true;
          } else {
              logs.push(`❌ Erreur Critique : Une commande a été créée malgré l'erreur d'items ! Le rollback n'a pas fonctionné.`);
          }
      } else {
          logs.push(`❌ Échec : La base de données a accepté l'insertion invalide (ce qui est anormal).`);
      }

    } catch (err) {
      logs.push(`❌ Exception capturée : ${err.message}`);
      success = false;
    } finally {
        
      // Cleanup the valid order created
      if (orderIdCreated) {
          logs.push(`\nNettoyage : Suppression de la commande de test ${orderIdCreated}...`);
          await supabase.from('restaurant_orders').delete().eq('order_id', orderIdCreated);
          await supabase.from('order_items').delete().eq('order_id', orderIdCreated);
          await supabase.from('orders').delete().eq('id', orderIdCreated);
          logs.push(`✅ Nettoyage terminé.`);
      }

      setResults({ success, logs });
      setLoading(false);
      toast({
          title: success ? "Test Réussi" : "Test Échoué",
          description: success ? "Les transactions atomiques fonctionnent parfaitement." : "Vérifiez les journaux pour plus de détails.",
          variant: success ? "default" : "destructive"
      });
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Test Transactions Atomiques - Administration</title>
      </Helmet>

      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-blue-600" /> Validation RPC Commandes
            </h1>
            <p className="text-muted-foreground mt-1">Exécute un test de création de commande via RPC pour vérifier le rollback automatique en cas d'erreur.</p>
          </div>
          
          <Button onClick={runTest} disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Lancer le test
          </Button>
        </div>

        <Card>
            <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg flex justify-between items-center">
                    Résultats de l'exécution
                    {results && (
                        results.success ? 
                            <Badge className="bg-amber-100 text-amber-800"><CheckCircle className="w-4 h-4 mr-1"/> Succès Total</Badge> : 
                            <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1"/> Échec</Badge>
                    )}
                </CardTitle>
                <CardDescription>Les journaux de test s'afficheront ci-dessous</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {results ? (
                    <div className="bg-slate-950 text-slate-300 font-mono text-sm p-6 min-h-[300px] overflow-y-auto space-y-2">
                        {results.logs.map((log, index) => (
                            <div key={index} className={`${log.includes('❌') ? 'text-red-400 font-bold' : log.includes('✅') ? 'text-green-400' : 'text-slate-400'}`}>
                                {log}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 min-h-[300px] flex items-center justify-center text-slate-400 italic">
                        En attente du lancement...
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderAtomicTransactionTestPage;