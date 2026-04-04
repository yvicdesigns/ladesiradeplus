import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchBar from '@/components/SearchBar';
import { X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AdminDeliveryOrdersFilters = ({ 
  filters = { status: 'all', search: '', showDeleted: false }, 
  setFilters = () => {}, 
  loading = false, 
  resultCount = 0 
}) => {
  
  // Defensive checks to ensure filters object is never undefined
  const safeFilters = {
    status: filters?.status || 'all',
    search: filters?.search || '',
    showDeleted: filters?.showDeleted || false
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...(prev || {}), [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: 'all', search: '', showDeleted: false });
  };

  const activeCount = (safeFilters.status !== 'all' ? 1 : 0) + (safeFilters.showDeleted ? 1 : 0);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 w-full mb-4">
      <div className="flex items-center gap-2 mr-auto font-medium text-gray-700">
        <Filter className="w-4 h-4" />
        Filtres
        {activeCount > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{activeCount}</Badge>}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <Select 
          value={safeFilters.status} 
          onValueChange={(val) => handleFilterChange('status', val)}
          disabled={loading}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="preparing">En préparation</SelectItem>
            <SelectItem value="ready">Prêt</SelectItem>
            <SelectItem value="in_transit">En route</SelectItem>
            <SelectItem value="delivered">Livré</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
          <Checkbox 
            id="show-deleted" 
            checked={safeFilters.showDeleted} 
            onCheckedChange={(val) => handleFilterChange('showDeleted', val)} 
            disabled={loading}
          />
          <label htmlFor="show-deleted" className="text-sm font-medium leading-none cursor-pointer">
            Corbeille
          </label>
        </div>

        <div className="w-full md:w-64">
           <SearchBar 
             value={safeFilters.search} 
             onChange={(val) => handleFilterChange('search', val)} 
             resultCount={resultCount} 
             placeholder="Rechercher..." 
             loading={loading} 
             className="h-9"
           />
        </div>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 px-2">
            <X className="w-4 h-4 mr-1" /> Effacer
          </Button>
        )}
      </div>
    </div>
  );
};