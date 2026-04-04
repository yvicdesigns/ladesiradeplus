import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus } from 'lucide-react';

export const SuppliersTab = ({ suppliers, onEdit, onDelete, onAdd }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAdd}><Plus className="w-4 h-4 mr-2"/> Add Supplier</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map(sup => (
                <TableRow key={sup.id}>
                  <TableCell className="font-medium">{sup.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{sup.email}</div>
                    <div className="text-xs text-muted-foreground">{sup.phone}</div>
                  </TableCell>
                  <TableCell>{sup.city}, {sup.country}</TableCell>
                  <TableCell>
                    <Badge variant={sup.is_active ? 'default' : 'secondary'}>{sup.is_active ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                     <Button size="icon" variant="ghost" onClick={() => onEdit(sup)}><Edit className="w-4 h-4"/></Button>
                     <Button size="icon" variant="ghost" onClick={() => onDelete(sup.id)} className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};