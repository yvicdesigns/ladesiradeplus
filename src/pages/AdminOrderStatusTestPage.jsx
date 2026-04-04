import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, ShieldCheck, DatabaseZap, BugPlay } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

export const AdminOrderStatusTestPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, created_at, customer_name, order_type')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      setOrders(data || []);
      if (data && data.length > 0 && !selectedOrder) {
          setSelectedOrder(data[0].id);
      }
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les commandes' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const runDiagnostics = async () => {
    try {
      const { data, error } = await supabase.rpc('diagnose_admin_order_access');
      if (error) throw error;
      setDiagnostics(data);
      toast({ title: 'Diagnostic terminé', description: 'Les résultats ont été mis à jour.' });
    } catch (err) {
      setDiagnostics({ error: err.message });
      toast({ variant: 'destructive', title: 'Erreur Diagnostic', description: err.message });
    }
  };

  const testUpdate = async () => {
    if (!selectedOrder || !newStatus) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner une commande et un statut cible.' });
        return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.rpc('update_order_status_optimized', {
        p_order_id: selectedOrder,
        p_new_status: newStatus
      });
      
      setTestResult({ data, error });
      
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error);
      
      toast({ title: 'Succès', description: 'Le statut a été mis à jour via RPC.', className: "bg-green-600 text-white" });
      fetchOrders(); // Refresh list
    } catch (err) {
      toast({ variant: 'destructive', title: 'Échec', description: err.message || "Erreur de mise à jour" });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="text-blue-600" /> Testeur de Statut de Commandes</h1>
          <Button onClick={fetchOrders} variant="outline" size="sm" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DatabaseZap className="w-4 h-4 mr-2" />}
            Actualiser
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><BugPlay className="w-5 h-5 text-indigo-500" /> Panneau de Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sélectionner une commande (ID) :</label>
                <Select value={selectedOrder || ''} onValueChange={setSelectedOrder}>
                  <SelectTrigger><SelectValue placeholder="Choisir une commande" /></SelectTrigger>
                  <SelectContent>
                    {orders.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.id.substring(0,8)}... - {o.customer_name} ({o.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nouveau Statut Cible :</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue placeholder="Choisir un statut" /></SelectTrigger>
                  <SelectContent>
                    {['pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'delivered', 'served', 'cancelled'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={testUpdate} disabled={isTesting} className="w-full">
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Tester la mise à jour (RPC: update_order_status_optimized)
              </Button>

              {testResult && (
                <div className={`p-4 rounded-md border text-sm font-mono overflow-auto ${testResult.error || (testResult.data && !testResult.data.success) ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  <p className="font-bold mb-2">Résultat :</p>
                  <pre>{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-amber-500" /> Diagnostics de Permissions</CardTitle>
              <Button onClick={runDiagnostics} size="sm" variant="secondary">Lancer</Button>
            </CardHeader>
            <CardContent>
              {diagnostics ? (
                <div className="bg-slate-900 text-green-400 p-4 rounded-md font-mono text-xs overflow-auto max-h-[400px]">
                  <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground border rounded-md border-dashed">
                  Cliquez sur "Lancer" pour analyser les permissions RLS et l'accès de l'administrateur courant.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderStatusTestPage;