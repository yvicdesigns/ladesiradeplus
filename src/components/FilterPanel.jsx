import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Filter, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ORDER_STATUSES } from '@/lib/formatters';

export const FilterPanel = ({ onFilterChange, className, minAmount = 0, maxAmount = 100000 }) => {
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [amountRange, setAmountRange] = useState([minAmount, maxAmount]);
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = Object.values(ORDER_STATUSES);

  const handleApply = () => {
    onFilterChange({
      dateRange,
      statuses: selectedStatuses,
      amountRange
    });
  };

  const handleClear = () => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedStatuses([]);
    setAmountRange([minAmount, maxAmount]);
    onFilterChange({
      dateRange: { from: undefined, to: undefined },
      statuses: [],
      amountRange: [minAmount, maxAmount]
    });
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4 shadow-sm space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtres avancés
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4 rotate-180 transition-transform" /> : <ChevronDown className="h-4 w-4 transition-transform" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
          {/* Date Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Période</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Statuts ({selectedStatuses.length})</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="truncate">
                    {selectedStatuses.length === 0 
                      ? "Tous les statuts" 
                      : `${selectedStatuses.length} sélectionné(s)`}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2">
                <div className="space-y-2">
                  {statusOptions.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`status-${status}`} 
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={() => toggleStatus(status)}
                      />
                      <label 
                        htmlFor={`status-${status}`} 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                      >
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount Range Filter */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label className="text-sm font-medium">Montant</Label>
              <span className="text-xs text-muted-foreground">
                {amountRange[0]} FCFA - {amountRange[1]} FCFA
              </span>
            </div>
            <Slider
              defaultValue={[minAmount, maxAmount]}
              value={amountRange}
              min={minAmount}
              max={maxAmount}
              step={1000}
              onValueChange={setAmountRange}
              className="py-4"
            />
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground">
            <X className="h-4 w-4 mr-2" />
            Effacer
          </Button>
          <Button size="sm" onClick={handleApply}>
            Appliquer les filtres
          </Button>
        </div>
      )}
    </div>
  );
};