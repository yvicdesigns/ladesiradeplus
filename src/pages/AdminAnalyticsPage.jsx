import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { Loader2, TrendingUp, Users, ShoppingBag, DollarSign, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const AdminAnalyticsPage = () => {
  const [period, setPeriod] = useState('30d');
  const { data, loading, error, refresh } = useAnalytics(period);

  const { kpis, charts } = data || { kpis: {}, charts: {} };

  const KPICard = ({ title, value, icon: Icon, trend, isLoading }) => (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-baseline space-x-3 mt-2">
          {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-xl md:text-2xl font-bold">{value || 0}</div>}
          {trend && !isLoading && <span className="text-xs text-amber-500 flex items-center">+{trend}% <TrendingUp className="h-3 w-3 ml-1"/></span>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout
      title="Analytiques"
      subtitle="Suivez les performances de votre activité en temps réel."
      icon={BarChart}
    >
      <div className="space-y-4 md:space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tableau de Bord Analytique</h1>
          <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Tabs value={period} onValueChange={setPeriod} className="w-full">
              <TabsList className="w-full sm:w-auto flex">
                <TabsTrigger value="7d" className="flex-1 sm:flex-none text-xs sm:text-sm">7j</TabsTrigger>
                <TabsTrigger value="30d" className="flex-1 sm:flex-none text-xs sm:text-sm">30j</TabsTrigger>
                <TabsTrigger value="90d" className="flex-1 sm:flex-none text-xs sm:text-sm">3m</TabsTrigger>
                <TabsTrigger value="year" className="flex-1 sm:flex-none text-xs sm:text-sm">1an</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                    <span className="text-sm">{error}</span>
                    <Button variant="outline" size="sm" onClick={refresh} className="sm:ml-auto bg-white/10 hover:bg-white/20 border-white/20 text-white min-h-[44px] sm:min-h-[36px]">Réessayer</Button>
                </AlertDescription>
            </Alert>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <KPICard title="Revenu Total" value={formatCurrency(kpis?.totalRevenue || 0)} icon={DollarSign} trend={12} isLoading={loading} />
            <KPICard title="Commandes" value={kpis?.totalOrders || 0} icon={ShoppingBag} trend={5} isLoading={loading} />
            <KPICard title="Clients Uniques" value={kpis?.totalCustomers || 0} icon={Users} trend={8} isLoading={loading} />
            <KPICard title="Panier Moyen" value={formatCurrency(kpis?.avgOrderValue || 0)} icon={TrendingUp} isLoading={loading} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader className="p-4 md:p-6"><CardTitle className="text-base md:text-lg">Évolution du Revenu</CardTitle></CardHeader>
                <CardContent className="px-2 md:pl-2 pb-4">
                    {loading ? (
                        <div className="space-y-2">
                           <Skeleton className="h-[250px] md:h-[300px] w-full" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280} className="md:h-[350px]">
                            <LineChart data={charts?.revenueTrend || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(value) => value.slice(5)} fontSize={10} md:fontSize={12} />
                                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} fontSize={10} md:fontSize={12} width={50} />
                                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-3">
                <CardHeader className="p-4 md:p-6"><CardTitle className="text-base md:text-lg">Répartition par Statut</CardTitle></CardHeader>
                <CardContent className="p-2 md:p-6">
                     {loading ? (
                        <Skeleton className="h-[250px] md:h-[300px] w-full rounded-full" />
                     ) : (
                        <ResponsiveContainer width="100%" height={280} className="md:h-[350px]">
                            <PieChart>
                                <Pie data={charts?.statusDistribution || []} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                    {(charts?.statusDistribution || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }}/>
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                     )}
                </CardContent>
            </Card>
        </div>
        
         <div className="grid gap-4 md:grid-cols-2">
             <Card>
                <CardHeader className="p-4 md:p-6"><CardTitle className="text-base md:text-lg">Types de Commandes</CardTitle></CardHeader>
                <CardContent className="px-2 md:px-6">
                     {loading ? <Skeleton className="h-[200px] md:h-[250px] w-full" /> : (
                         <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                            <BarChart data={charts?.typeDistribution || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))"/>
                                <XAxis dataKey="name" fontSize={10} md:fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} md:fontSize={12} tickLine={false} axisLine={false} width={30} />
                                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }}/>
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                     )}
                </CardContent>
             </Card>
         </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;