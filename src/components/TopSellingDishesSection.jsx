import React, { useState } from 'react';
import { useTopSellingDishes } from '@/hooks/useTopSellingDishes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, Utensils, AlertCircle } from 'lucide-react';

export const TopSellingDishesSection = () => {
  const [period, setPeriod] = useState('month');
  const { dishes, loading, error } = useTopSellingDishes(period);

  const filterOptions = [
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette Semaine' },
    { value: 'month', label: 'Ce Mois' },
    { value: 'all', label: 'Tout le temps' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-amber-500" />
            Top 10 des Plats les Plus Vendus
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Découvrez vos plats les plus populaires et leurs revenus générés.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-gray-100/50 p-1 rounded-lg border">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={period === opt.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(opt.value)}
              className={`rounded-md transition-all ${
                period === opt.value 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200 hover:bg-gray-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl text-red-600 flex flex-col items-center gap-2">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p>Erreur lors du chargement des plats les plus vendus.</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden border-none shadow-sm">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dishes.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 border border-dashed rounded-xl flex flex-col items-center gap-3">
          <div className="p-4 bg-white rounded-full shadow-sm">
            <Utensils className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900">Aucune donnée de vente</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Il n'y a pas assez de commandes finalisées dans cette période pour afficher des statistiques.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dishes.map((dish, index) => (
            <Card 
              key={dish.id} 
              className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group rounded-xl bg-white"
            >
              <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                {dish.image_url ? (
                  <img 
                    src={dish.image_url} 
                    alt={dish.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* Fallback displayed if no image or image fails to load */}
                <div 
                  className={`absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 ${dish.image_url ? 'hidden' : 'flex'}`}
                >
                  <Utensils className="h-10 w-10 opacity-20" />
                </div>
                
                {/* Ranking Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={`
                    font-bold shadow-sm backdrop-blur-sm
                    ${index === 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600' : 
                      index === 1 ? 'bg-slate-300 hover:bg-slate-400 text-slate-800 border-slate-400' : 
                      index === 2 ? 'bg-amber-700 hover:bg-amber-800 text-white border-amber-800' : 
                      'bg-white/90 text-gray-700 border-gray-200'}
                  `}>
                    #{index + 1}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1 mb-3 group-hover:text-primary transition-colors" title={dish.name}>
                  {dish.name}
                </h3>
                
                <div className="flex items-end justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Vendus</span>
                    <span className="text-lg font-bold text-gray-900">
                      {dish.quantity_sold} <span className="text-sm font-normal text-gray-500">unités</span>
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Revenus</span>
                    <span className="text-lg font-bold text-amber-600">
                      {formatCurrency(dish.revenue_generated)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};