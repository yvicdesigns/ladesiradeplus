import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

export const TableFilters = ({ filters, setFilters, locations }) => {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      capacity: 'all',
      location: 'all'
    });
  };

  return (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col lg:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search table number..." 
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-9 bg-muted/50 border-border"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
        <Select value={filters.status} onValueChange={(val) => handleFilterChange('status', val)}>
          <SelectTrigger className="w-full sm:w-[150px] bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.capacity} onValueChange={(val) => handleFilterChange('capacity', val)}>
          <SelectTrigger className="w-full sm:w-[150px] bg-background">
            <SelectValue placeholder="Capacity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sizes</SelectItem>
            <SelectItem value="small">2-4 Seats</SelectItem>
            <SelectItem value="medium">5-6 Seats</SelectItem>
            <SelectItem value="large">7+ Seats</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.location} onValueChange={(val) => handleFilterChange('location', val)}>
          <SelectTrigger className="w-full sm:w-[150px] bg-background">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(loc => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4 mr-2" /> Clear
      </Button>
    </div>
  );
};