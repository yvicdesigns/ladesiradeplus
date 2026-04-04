import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, FilterX, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ReservationFilters = ({ filters, onFilterChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAdvancedChange = (key, value) => {
    onFilterChange(prev => ({ ...prev, [key]: value }));
  };

  const activeCount = 
    (filters?.status && filters.status !== 'all' ? 1 : 0) +
    (filters?.dateFrom ? 1 : 0) +
    (filters?.dateTo ? 1 : 0) +
    (filters?.partyMin ? 1 : 0) +
    (filters?.partyMax ? 1 : 0);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <Settings2 className="w-5 h-5 text-blue-600" />
          Filtres Avancés
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100">
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

      <CollapsibleContent className="pt-4 mt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</Label>
            <Select 
              value={filters?.status || 'all'} 
              onValueChange={(val) => handleAdvancedChange('status', val)}
            >
              <SelectTrigger className="w-full h-10 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 transition-colors">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="completed">Complétée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Période (Date de réservation)</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                value={filters?.dateFrom || ''} 
                onChange={(e) => handleAdvancedChange('dateFrom', e.target.value)}
                className="h-10 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 transition-colors text-sm"
              />
              <span className="text-gray-400 text-sm">à</span>
              <Input 
                type="date" 
                value={filters?.dateTo || ''} 
                onChange={(e) => handleAdvancedChange('dateTo', e.target.value)}
                className="h-10 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Party Size Range Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre de personnes</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                placeholder="Min"
                min="1"
                value={filters?.partyMin || ''} 
                onChange={(e) => handleAdvancedChange('partyMin', e.target.value)}
                className="h-10 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 transition-colors text-sm"
              />
              <span className="text-gray-400 text-sm">-</span>
              <Input 
                type="number" 
                placeholder="Max"
                min="1"
                value={filters?.partyMax || ''} 
                onChange={(e) => handleAdvancedChange('partyMax', e.target.value)}
                className="h-10 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};