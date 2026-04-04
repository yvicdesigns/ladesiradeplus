import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Package, DollarSign, TrendingUp, Grid3x3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

export const ProductStatisticsPanel = ({ products = [] }) => {
  const stats = useMemo(() => {
    let totalStockValue = 0;
    let totalPrice = 0;
    const categoryCounts = {};
    const priceRanges = {
      '0-1000': 0,
      '1001-5000': 0,
      '5001-10000': 0,
      '>10000': 0
    };

    products.forEach(product => {
      const price = Number(product.price) || 0;
      const stock = Number(product.stock_quantity) || 0;
      
      totalStockValue += (price * stock);
      totalPrice += price;

      const catName = product.menu_categories?.name || 'Sans catégorie';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;

      if (price <= 1000) priceRanges['0-1000']++;
      else if (price <= 5000) priceRanges['1001-5000']++;
      else if (price <= 10000) priceRanges['5001-10000']++;
      else priceRanges['>10000']++;
    });

    const averagePrice = products.length > 0 ? totalPrice / products.length : 0;
    
    const categoryData = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 categories

    const priceData = Object.entries(priceRanges).map(([range, count]) => ({ range, count }));

    return {
      totalProducts: products.length,
      totalStockValue,
      averagePrice,
      totalCategories: Object.keys(categoryCounts).length,
      categoryData,
      priceData
    };
  }, [products]);

  const COLORS = ['#4f46e5', '#3b82f6', '#0ea5e9', '#38bdf8', '#7dd3fc'];

  return (
    <div className="space-y-6 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 border-slate-200 shadow-sm hover:shadow-md transition-all bg-white rounded-xl">
          <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Total Produits</p>
            <p className="text-2xl font-bold text-slate-900 truncate">{stats.totalProducts}</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4 border-slate-200 shadow-sm hover:shadow-md transition-all bg-white rounded-xl">
          <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-amber-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Valeur Stock Estimée</p>
            <p className="text-xl font-bold text-slate-900 truncate" title={formatCurrency(stats.totalStockValue)}>
              {formatCurrency(stats.totalStockValue)}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-slate-200 shadow-sm hover:shadow-md transition-all bg-white rounded-xl">
          <div className="bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Prix Moyen</p>
            <p className="text-xl font-bold text-slate-900 truncate">{formatCurrency(stats.averagePrice)}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-slate-200 shadow-sm hover:shadow-md transition-all bg-white rounded-xl">
          <div className="bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Grid3x3 className="w-6 h-6 text-purple-600" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-500">Catégories Représentées</p>
            <p className="text-2xl font-bold text-slate-900 truncate">{stats.totalCategories}</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 border-slate-200 shadow-sm rounded-xl bg-white h-[320px] flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Produits par Catégorie</h3>
          {stats.categoryData.length > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryData} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Aucune donnée disponible</div>
          )}
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm rounded-xl bg-white h-[320px] flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Distribution des Prix</h3>
          {stats.totalProducts > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.priceData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} width={80} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Aucune donnée disponible</div>
          )}
        </Card>
      </div>
    </div>
  );
};