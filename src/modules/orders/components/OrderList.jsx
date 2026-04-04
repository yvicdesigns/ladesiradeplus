import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from './OrderStatusBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Loader2, PackageX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OrderList = ({ orders = [], loading = false }) => {
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <PackageX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Aucune commande trouvée</h3>
        <p className="text-gray-500 max-w-sm mx-auto mt-2">Vous n'avez pas encore passé de commandes ou aucune ne correspond à vos filtres.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead>Référence</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="cursor-pointer hover:bg-blue-50/50 transition-colors" onClick={() => navigate(`/orders/${order.id}`)}>
              <TableCell className="font-mono text-xs text-gray-600">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
              <TableCell className="text-sm text-gray-900">
                {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
              </TableCell>
              <TableCell className="text-sm capitalize text-gray-700">{order.type === 'delivery' ? 'Livraison' : 'À emporter'}</TableCell>
              <TableCell><OrderStatusBadge status={order.status} /></TableCell>
              <TableCell className="text-right font-bold text-gray-900">{Number(order.total).toFixed(2)} FCFA</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-primary">
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};