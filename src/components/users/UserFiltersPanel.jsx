import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, FilterX, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const UserFiltersPanel = ({ filters, onFilterChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key, value) => {
    onFilterChange(prev => ({ ...prev, [key]: value }));
  };

  const activeCount = 
    (filters?.role && filters.role !== 'all' ? 1 : 0) +
    (filters?.status && filters.status !== 'all' ? 1 : 0) +
    (filters?.dateFrom ? 1 : 0) +
    (filters?.dateTo ? 1 : 0);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Role Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rôle</Label>
            <Select 
              value={filters?.role || 'all'} 
              onValueChange={(val) => handleChange('role', val)}
            >
              <SelectTrigger className="w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="kitchen">Cuisine</SelectItem>
                <SelectItem value="delivery">Livreur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</Label>
            <Select 
              value={filters?.status || 'all'} 
              onValueChange={(val) => handleChange('status', val)}
            >
              <SelectTrigger className="w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date de création</Label>
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                value={filters?.dateFrom || ''} 
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                className="h-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors text-sm"
              />
              <span className="text-slate-400 text-sm">à</span>
              <Input 
                type="date" 
                value={filters?.dateTo || ''} 
                onChange={(e) => handleChange('dateTo', e.target.value)}
                className="h-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 transition-colors text-sm"
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};