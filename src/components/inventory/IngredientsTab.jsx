import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getStockStatus } from '@/lib/inventoryUtils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Edit, Trash2, Search, Plus } from 'lucide-react';

export const IngredientsTab = ({ ingredients, onEdit, onDelete, onAdd }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search ingredients..." className="pl-8" />
        </div>
        <Button onClick={onAdd}><Plus className="w-4 h-4 mr-2"/> Add Ingredient</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map(ing => {
                 const status = getStockStatus(ing.current_stock, ing.min_stock, ing.max_stock, ing.reorder_point);
                 return (
                  <TableRow key={ing.id}>
                    <TableCell className="font-medium">{ing.name}</TableCell>
                    <TableCell className="capitalize">{ing.category?.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold">{ing.current_stock} {ing.unit}</span>
                        <Badge className={`w-fit text-[10px] px-1 py-0 ${status.color}`} variant="outline">{status.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(ing.unit_cost)} / {ing.unit}</TableCell>
                    <TableCell>{ing.suppliers?.name || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button size="icon" variant="ghost" onClick={() => onEdit(ing)}><Edit className="w-4 h-4"/></Button>
                       <Button size="icon" variant="ghost" onClick={() => onDelete(ing.id)} className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
                    </TableCell>
                  </TableRow>
                 );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};