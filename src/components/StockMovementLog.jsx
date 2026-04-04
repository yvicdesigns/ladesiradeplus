import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/formatters';
import { Loader2, Search, Download } from 'lucide-react';

export const StockMovementLog = ({ menuItemId = null }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          id,
          movement_type,
          quantity_changed,
          order_id,
          notes,
          created_at,
          menu_items ( name )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (menuItemId) {
        query = query.eq('menu_item_id', menuItemId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMovements(data || []);
    } catch (err) {
      console.error("Error fetching stock movements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [menuItemId]);

  const filteredMovements = movements.filter(m => 
    m.menu_items?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.movement_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMovementBadge = (type, qty) => {
    if (type === 'order_confirmed') return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Commande (Déd.)</Badge>;
    if (type === 'order_cancelled') return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Annulation (Rest.)</Badge>;
    if (qty > 0) return <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Ajout Manuel</Badge>;
    return <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Retrait Manuel</Badge>;
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Produit', 'Type', 'Quantité', 'Order ID', 'Notes'];
    const rows = filteredMovements.map(m => [
      new Date(m.created_at).toLocaleString(),
      m.menu_items?.name || 'N/A',
      m.movement_type,
      m.quantity_changed,
      m.order_id || 'N/A',
      m.notes || ''
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "stock_movements.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un mouvement..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Heure</TableHead>
              {!menuItemId && <TableHead>Produit</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Commande ID</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
            ) : filteredMovements.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun mouvement trouvé</TableCell></TableRow>
            ) : (
              filteredMovements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{formatTime(m.created_at)}</TableCell>
                  {!menuItemId && <TableCell className="font-medium">{m.menu_items?.name}</TableCell>}
                  <TableCell>{getMovementBadge(m.movement_type, m.quantity_changed)}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${m.quantity_changed > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                      {m.quantity_changed > 0 ? '+' : ''}{m.quantity_changed}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">{m.order_id ? m.order_id.slice(0,8) : '-'}</TableCell>
                  <TableCell className="text-sm text-gray-600">{m.notes}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};