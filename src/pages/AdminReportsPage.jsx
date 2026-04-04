import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReports } from '@/hooks/useReports';
import { exportDataService } from '@/lib/exportDataService';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { FileText, Download, TrendingUp, Users, Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export const AdminReportsPage = () => {
  const { data, loading, error, activeTab, setActiveTab, period, setPeriod, refresh } = useReports();
  const { toast } = useToast();

  const handleExport = (format) => {
    try {
      if (activeTab === 'orders') exportDataService.exportOrders(data, format);
      else exportDataService.exportReservations(data, format);
      toast({ title: "Succès", description: "Rapport exporté avec succès." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'export." });
    }
  };

  const calculateMetrics = () => {
    if (activeTab === 'orders') {
       const totalRevenue = data.reduce((sum, o) => sum + (o.total || 0), 0);
       const totalOrders = data.length;
       const avgValue = totalOrders ? totalRevenue / totalOrders : 0;
       return [
         { label: "Chiffre d'affaires", value: formatCurrency(totalRevenue), icon: TrendingUp },
         { label: "Total Commandes", value: totalOrders, icon: FileText },
         { label: "Panier Moyen", value: formatCurrency(avgValue), icon: TrendingUp },
       ];
    } else {
       const totalGuests = data.reduce((sum, r) => sum + (r.party_size || 0), 0);
       return [
         { label: "Total Réservations", value: data.length, icon: FileText },
         { label: "Total Invités", value: totalGuests, icon: Users },
         { label: "Moyenne par table", value: data.length ? (totalGuests / data.length).toFixed(1) : 0, icon: Users },
       ];
    }
  };

  const prepareChartData = () => {
     const dataMap = {};
     data.forEach(item => {
        dataMap[item.status] = (dataMap[item.status] || 0) + 1;
     });
     return Object.keys(dataMap).map(key => ({ name: key, count: dataMap[key] }));
  };

  const metrics = calculateMetrics();
  const chartData = prepareChartData();

  return (
    <AdminLayout>
       <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl shadow-sm border border-border">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" /> Rapports
              </h1>
              <p className="text-muted-foreground">Génération et export de rapports détaillés</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport('csv')} disabled={loading || data.length === 0}>
                   <Download className="h-4 w-4 mr-2" /> CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('pdf')} disabled={loading || data.length === 0}>
                   <Download className="h-4 w-4 mr-2" /> PDF
                </Button>
            </div>
          </div>
          
          {error && (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription className="flex items-center gap-2">
                    {error} <Button variant="link" className="text-white underline p-0 h-auto" onClick={refresh}>Réessayer</Button>
                </AlertDescription>
             </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <TabsList>
                    <TabsTrigger value="orders">Ventes</TabsTrigger>
                    <TabsTrigger value="reservations">Réservations</TabsTrigger>
                 </TabsList>
                 
                 <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px]">
                       <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="7d">7 derniers jours</SelectItem>
                       <SelectItem value="30d">30 derniers jours</SelectItem>
                       <SelectItem value="90d">3 derniers mois</SelectItem>
                       <SelectItem value="all">Tout l'historique</SelectItem>
                    </SelectContent>
                 </Select>
             </div>

             <div className="grid gap-4 md:grid-cols-3">
                 {metrics.map((metric, idx) => (
                    <Card key={idx}>
                       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                          <metric.icon className="h-4 w-4 text-muted-foreground" />
                       </CardHeader>
                       <CardContent>
                          {loading ? <Skeleton className="h-8 w-24"/> : <div className="text-2xl font-bold">{metric.value}</div>}
                       </CardContent>
                    </Card>
                 ))}
             </div>

             <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                   <CardHeader><CardTitle>Distribution par Statut</CardTitle></CardHeader>
                   <CardContent className="h-[300px]">
                      {loading ? <Skeleton className="h-full w-full"/> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                      )}
                   </CardContent>
                </Card>
                <Card className="col-span-1">
                   <CardHeader><CardTitle>Dernières Données</CardTitle><CardDescription>Aperçu des 5 dernières entrées</CardDescription></CardHeader>
                   <CardContent>
                      <Table>
                         <TableHeader>
                            <TableRow>
                               <TableHead>ID</TableHead>
                               <TableHead>Date</TableHead>
                               <TableHead>Statut</TableHead>
                            </TableRow>
                         </TableHeader>
                         <TableBody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-16"/></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24"/></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12"/></TableCell>
                                    </TableRow>
                                ))
                            ) : data.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center py-4">Aucune donnée</TableCell></TableRow>
                            ) : (
                             data.slice(0, 5).map(item => (
                                <TableRow key={item.id}>
                                   <TableCell className="font-mono text-xs">{item.id.slice(0, 8)}</TableCell>
                                   <TableCell>{item.created_at ? formatDateTime(item.created_at) : item.reservation_date}</TableCell>
                                   <TableCell>{item.status}</TableCell>
                                </TableRow>
                             )))}
                         </TableBody>
                      </Table>
                   </CardContent>
                </Card>
             </div>
          </Tabs>
       </div>
    </AdminLayout>
  );
};

export default AdminReportsPage;