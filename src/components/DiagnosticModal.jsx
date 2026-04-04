import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDeliveryOrderDiagnostics } from '@/hooks/useDeliveryOrderDiagnostics';
import { Loader2, Database, Copy, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const DiagnosticModal = ({ open, onOpenChange }) => {
  const { getTableSchema, getTableFks, getComparison, loading } = useDeliveryOrderDiagnostics();
  const [data, setData] = useState({
    deliverySchema: null,
    restaurantSchema: null,
    deliveryFks: [],
    restaurantFks: [],
    comparison: null
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    const [delSchema, restSchema, delFks, restFks, comp] = await Promise.all([
      getTableSchema('delivery_orders'),
      getTableSchema('restaurant_orders'),
      getTableFks('delivery_orders'),
      getTableFks('restaurant_orders'),
      getComparison()
    ]);
    setData({
      deliverySchema: delSchema,
      restaurantSchema: restSchema,
      deliveryFks: delFks,
      restaurantFks: restFks,
      comparison: comp
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSchemaTable = (schema) => {
    if (!schema) return null;
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Nullable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schema.map((col) => (
            <TableRow key={col.column_name}>
              <TableCell className="font-mono text-sm text-blue-600">{col.column_name}</TableCell>
              <TableCell className="text-xs">{col.data_type}</TableCell>
              <TableCell>
                {col.is_nullable === 'YES' ? <Badge variant="outline">YES</Badge> : <Badge variant="secondary">NO</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderFkTable = (fks) => {
    if (!fks || fks.length === 0) return <p className="text-sm text-gray-500 py-4">No foreign keys found.</p>;
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column</TableHead>
            <TableHead>Foreign Table</TableHead>
            <TableHead>Foreign Column</TableHead>
            <TableHead>On Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fks.map((fk, i) => (
            <TableRow key={i}>
              <TableCell className="font-mono text-xs">{fk.column_name}</TableCell>
              <TableCell className="font-mono text-xs text-purple-600">{fk.foreign_table_name}</TableCell>
              <TableCell className="font-mono text-xs">{fk.foreign_column_name}</TableCell>
              <TableCell><Badge variant="destructive" className="text-[10px]">{fk.delete_rule}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Database Structure Diagnostics
            </DialogTitle>
            <DialogDescription>Schema comparison between delivery_orders and restaurant_orders</DialogDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy} className="mr-4">
            {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-amber-500" /> : <Copy className="w-4 h-4 mr-2" />}
            Copy Info
          </Button>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <Tabs defaultValue="compare" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="compare">Comparison</TabsTrigger>
                <TabsTrigger value="delivery">Delivery Schema</TabsTrigger>
                <TabsTrigger value="restaurant">Restaurant Schema</TabsTrigger>
                <TabsTrigger value="fks">Foreign Keys</TabsTrigger>
              </TabsList>

              <TabsContent value="compare" className="mt-4 space-y-4">
                {data.comparison && (
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-bold mb-4">Unique to delivery_orders</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.comparison.uniqueToTable1.map(c => <Badge key={c} variant="secondary" className="font-mono">{c}</Badge>)}
                          {data.comparison.uniqueToTable1.length === 0 && <span className="text-sm text-gray-500">None</span>}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-bold mb-4">Unique to restaurant_orders</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.comparison.uniqueToTable2.map(c => <Badge key={c} variant="secondary" className="font-mono">{c}</Badge>)}
                          {data.comparison.uniqueToTable2.length === 0 && <span className="text-sm text-gray-500">None</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="delivery" className="mt-4 border rounded-md">
                {renderSchemaTable(data.deliverySchema)}
              </TabsContent>

              <TabsContent value="restaurant" className="mt-4 border rounded-md">
                {renderSchemaTable(data.restaurantSchema)}
              </TabsContent>

              <TabsContent value="fks" className="mt-4 space-y-6">
                <div>
                  <h4 className="font-bold mb-2 text-sm text-gray-500 uppercase tracking-wider">delivery_orders Foreign Keys</h4>
                  <div className="border rounded-md">
                    {renderFkTable(data.deliveryFks)}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-sm text-gray-500 uppercase tracking-wider">restaurant_orders Foreign Keys</h4>
                  <div className="border rounded-md">
                    {renderFkTable(data.restaurantFks)}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};