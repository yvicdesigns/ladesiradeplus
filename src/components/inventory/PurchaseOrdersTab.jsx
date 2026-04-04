import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getOrderStatusColor } from '@/lib/inventoryUtils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Eye, Trash2, Plus } from 'lucide-react';

export const PurchaseOrdersTab = ({ orders, onDelete, onAdd }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAdd}><Plus className="w-4 h-4 mr-2"/> Create Order</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-bold">{order.order_number}</TableCell>
                  <TableCell>{order.suppliers?.name}</TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell>{order.expected_delivery_date ? formatDate(order.expected_delivery_date) : '-'}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell>
                    <Badge className={getOrderStatusColor(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                     <Button size="icon" variant="ghost"><Eye className="w-4 h-4"/></Button>
                     <Button size="icon" variant="ghost" onClick={() => onDelete(order.id)} className="text-destructive"><Trash2 className="w-4 h-4"/></Button>
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