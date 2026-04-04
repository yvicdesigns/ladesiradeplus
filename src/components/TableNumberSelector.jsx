import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTableSelection } from '@/hooks/useTableSelection';
import { Loader2 } from 'lucide-react';

export const TableNumberSelector = ({ value, onValueChange, disabled, restaurantId }) => {
  const { tables, loading, error } = useTableSelection(restaurantId);

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-slate-500">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement des tables...
          </div>
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 p-3 border border-red-200 rounded-lg bg-red-50">
        Erreur de chargement des tables.
      </div>
    );
  }

  return (
    <Select value={value || ''} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="bg-white border-slate-200 text-gray-900 focus:ring-green-500 w-full">
        <SelectValue placeholder="Sélectionner une table..." />
      </SelectTrigger>
      <SelectContent>
        {tables.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground text-center">Aucune table disponible</div>
        ) : (
          tables.map(table => (
            <SelectItem key={table.id} value={table.id}>
              Table {table.table_number} ({table.capacity} pers.)
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};