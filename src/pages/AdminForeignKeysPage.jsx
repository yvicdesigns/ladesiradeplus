import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsList, TabsContent } from '@/components/ui/tabs';
import { SoundTabsTrigger } from '@/components/SoundTabsTrigger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Database, Key, ShieldAlert, Code, CheckCircle, AlertTriangle, Copy, Download } from 'lucide-react';
import { foreignKeyAnalyzer } from '@/lib/foreignKeyAnalyzer';
import { AdminForeignKeysAnalysisTab } from '@/components/AdminForeignKeysAnalysisTab';

export const AdminForeignKeysPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allFks, setAllFks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('analysis');
  const [dependencies, setDependencies] = useState({
    orders: [],
    delivery_orders: [],
    customers: [],
    reservations: [],
    menu_items: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fks, fkIssues, ordDeps, delOrdDeps, custDeps, resDeps, menuDeps] = await Promise.all([
        foreignKeyAnalyzer.getAllForeignKeys(),
        foreignKeyAnalyzer.getForeignKeyIssues(),
        foreignKeyAnalyzer.getTableDependencies('orders'),
        foreignKeyAnalyzer.getTableDependencies('delivery_orders'),
        foreignKeyAnalyzer.getTableDependencies('customers'),
        foreignKeyAnalyzer.getTableDependencies('reservations'),
        foreignKeyAnalyzer.getTableDependencies('menu_items')
      ]);

      setAllFks(fks);
      setIssues(fkIssues);
      setDependencies({
        orders: ordDeps,
        delivery_orders: delOrdDeps,
        customers: custDeps,
        reservations: resDeps,
        menu_items: menuDeps
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de récupérer l'audit des clés étrangères.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyScript = () => {
    const script = foreignKeyAnalyzer.generateMasterFixScript(issues);
    navigator.clipboard.writeText(script);
    toast({
      title: "Script copié",
      description: "Le script SQL global a été copié dans le presse-papiers.",
    });
  };

  const renderDependenciesTable = (deps, tableName) => {
    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>;
    
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/20 border-b pb-4">
          <CardTitle className="text-lg">Dépendances de la table <code className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{tableName}</code></CardTitle>
          <CardDescription>
            Tables enfants qui référencent <b>{tableName}</b> et qui peuvent bloquer sa suppression.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Enfant (Dépendante)</TableHead>
                <TableHead>Colonne</TableHead>
                <TableHead>Contrainte</TableHead>
                <TableHead>Règle de Suppression</TableHead>
                <TableHead className="text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deps.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Aucune dépendance trouvée.</TableCell></TableRow>
              ) : (
                deps.map(dep => (
                  <TableRow key={dep.constraint_name} className={dep.blocks_cascade ? "bg-red-50/30" : ""}>
                    <TableCell className="font-medium">{dep.child_table}</TableCell>
                    <TableCell className="text-muted-foreground">{dep.child_column}</TableCell>
                    <TableCell className="text-xs font-mono">{dep.constraint_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={dep.delete_rule === 'CASCADE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                        {dep.delete_rule}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {dep.blocks_cascade ? (
                        <span className="flex items-center justify-end text-red-600 text-sm font-medium"><ShieldAlert className="h-4 w-4 mr-1" /> Bloque la suppression</span>
                      ) : (
                        <span className="flex items-center justify-end text-emerald-600 text-sm font-medium"><CheckCircle className="h-4 w-4 mr-1" /> OK (Cascade)</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Key className="h-6 w-6" /></div>
              Audit des Clés Étrangères
            </h1>
            <p className="text-muted-foreground mt-1">
              Analysez et corrigez les relations entre les tables pour garantir le bon fonctionnement des suppressions (CASCADE).
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <Database className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </Button>
            <Button onClick={handleCopyScript} disabled={loading || issues.length === 0} className="bg-slate-900 hover:bg-slate-800 text-white">
              <Code className="h-4 w-4 mr-2" /> Copier Script Global
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap items-start justify-start w-full h-auto gap-2 bg-muted p-2 rounded-xl">
            <SoundTabsTrigger value="analysis" className="text-sm"><Database className="h-4 w-4 mr-2" /> Vue d'ensemble</SoundTabsTrigger>
            <SoundTabsTrigger value="orders" className="text-sm">Dépendances Orders</SoundTabsTrigger>
            <SoundTabsTrigger value="delivery_orders" className="text-sm">Dépendances Delivery</SoundTabsTrigger>
            <SoundTabsTrigger value="customers" className="text-sm">Dépendances Customers</SoundTabsTrigger>
            <SoundTabsTrigger value="menu_items" className="text-sm">Dépendances Menu</SoundTabsTrigger>
            <SoundTabsTrigger value="fixes" className="text-sm text-red-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
              <AlertTriangle className="h-4 w-4 mr-2" /> Script Correctif ({issues.length})
            </SoundTabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="m-0 focus-visible:outline-none">
            <AdminForeignKeysAnalysisTab allFks={allFks} issues={issues} isLoading={loading} />
          </TabsContent>

          <TabsContent value="orders" className="m-0 focus-visible:outline-none">
            {renderDependenciesTable(dependencies.orders, 'orders')}
          </TabsContent>

          <TabsContent value="delivery_orders" className="m-0 focus-visible:outline-none">
            {renderDependenciesTable(dependencies.delivery_orders, 'delivery_orders')}
          </TabsContent>

          <TabsContent value="customers" className="m-0 focus-visible:outline-none">
            {renderDependenciesTable(dependencies.customers, 'customers')}
          </TabsContent>

          <TabsContent value="menu_items" className="m-0 focus-visible:outline-none">
            {renderDependenciesTable(dependencies.menu_items, 'menu_items')}
          </TabsContent>

          <TabsContent value="fixes" className="m-0 focus-visible:outline-none">
            <Card className="border-red-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-red-50/50 border-b border-red-100">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Requêtes SQL de Correction
                </CardTitle>
                <CardDescription className="text-red-600/80">
                  Exécutez ce script dans l'éditeur SQL de Supabase pour convertir toutes les clés étrangères restrictives en <code className="bg-red-100 px-1 rounded">ON DELETE CASCADE</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
                ) : issues.length === 0 ? (
                  <div className="p-12 text-center text-emerald-600 flex flex-col items-center">
                    <CheckCircle className="h-12 w-12 mb-3 opacity-50" />
                    <h3 className="text-lg font-bold">Base de données saine !</h3>
                    <p>Aucune clé étrangère ne nécessite de correction. Toutes les suppressions en cascade sont actives.</p>
                  </div>
                ) : (
                  <div className="relative">
                    <Button 
                      className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white border-white/20" 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopyScript}
                    >
                      <Copy className="h-4 w-4 mr-2" /> Copier tout
                    </Button>
                    <pre className="bg-slate-950 text-emerald-400 p-6 overflow-x-auto text-sm font-mono custom-scrollbar rounded-b-xl leading-relaxed">
                      <code>{foreignKeyAnalyzer.generateMasterFixScript(issues)}</code>
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminForeignKeysPage;