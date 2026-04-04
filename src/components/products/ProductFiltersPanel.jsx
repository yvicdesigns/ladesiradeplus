import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, FilterX, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ProductFiltersPanel = ({ filters, onFilterChange, onReset, categories = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key, value) => {
    onFilterChange(prev => ({ ...prev, [key]: value }));
  };

  const activeCount = 
    (filters?.category && filters.category !== 'all' ? 1 : 0) +
    (filters?.priceMin ? 1 : 0) +
    (filters?.priceMax ? 1 : 0) +
    (filters?.stockMin ? 1 : 0) +
    (filters?.stockMax ? 1 : 0) +
    (filters?.status && filters.status !== 'all' ? 1 : 0);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Settings2 className="w-5 h-5 text-indigo-600" />
          Filtres Avancés
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none">
              {activeCount} actif{activeCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onReset} 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
            >
              <FilterX className="w-4 h-4 mr-2" /> Réinitialiser
            </Button>
          )}
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="pt-4 mt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catégorie</Label>
            <Select 
              value={filters?.category || 'all'} 
              onValueChange={(val) => handleChange('category', val)}
            >
              <SelectTrigger className="w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut / Disponibilité</Label>
            <Select 
              value={filters?.status || 'all'} 
              onValueChange={(val) => handleChange('status', val)}
            >
              <SelectTrigger className="w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actif / Disponible</SelectItem>
                <SelectItem value="inactive">Inactif / Indisponible</SelectItem>
                <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prix (XAF)</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="Min"
                min="0"
                value={filters?.priceMin || ''} 
                onChange={(e) => handleChange('priceMin', e.target.value)}
                className="h-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors text-sm"
              />
              <span className="text-slate-400 text-sm">-</span>
              <Input 
                type="number" 
                placeholder="Max"
                min="0"
                value={filters?.priceMax || ''} 
                onChange={(e) => handleChange('priceMax', e.target.value)}
                className="h-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Stock Range Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantité en stock</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="Min"
                min="0"
                value={filters?.stockMin || ''} 
                onChange={(e) => handleChange('stockMin', e.target.value)}
                className="h-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors text-sm"
              />
              <span className="text-slate-400 text-sm">-</span>
              <Input 
                type="number" 
                placeholder="Max"
                min="0"
                value={filters?.stockMax || ''} 
                onChange={(e) => handleChange('stockMax', e.target.value)}
                className="h-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors text-sm"
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};