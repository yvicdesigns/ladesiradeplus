import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Terminal, Copy, CheckCircle2, Info } from 'lucide-react';

const SQL_SCRIPT = `-- MASTER FOREIGN KEY FIX SCRIPT
-- Copy this entire block and paste it into the Supabase SQL Editor

ALTER TABLE order_items DROP CONSTRAINT order_items_menu_item_id_fkey, ADD CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE;
ALTER TABLE order_items DROP CONSTRAINT order_items_order_id_fkey, ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE delivery_orders DROP CONSTRAINT delivery_orders_order_id_fkey, ADD CONSTRAINT delivery_orders_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE delivery_orders DROP CONSTRAINT delivery_orders_customer_id_fkey, ADD CONSTRAINT delivery_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE restaurant_orders DROP CONSTRAINT restaurant_orders_order_id_fkey, ADD CONSTRAINT restaurant_orders_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE restaurant_orders DROP CONSTRAINT restaurant_orders_customer_id_fkey, ADD CONSTRAINT restaurant_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE delivery_tracking DROP CONSTRAINT delivery_tracking_delivery_id_fkey, ADD CONSTRAINT delivery_tracking_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE;
ALTER TABLE menu_items DROP CONSTRAINT menu_items_category_id_fkey, ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL;
ALTER TABLE reservations DROP CONSTRAINT reservations_table_id_fkey, ADD CONSTRAINT reservations_table_id_fkey FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL;
ALTER TABLE ingredients DROP CONSTRAINT ingredients_supplier_id_fkey, ADD CONSTRAINT ingredients_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;
ALTER TABLE purchase_orders DROP CONSTRAINT purchase_orders_supplier_id_fkey, ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE;
ALTER TABLE purchase_order_items DROP CONSTRAINT purchase_order_items_purchase_order_id_fkey, ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE;
ALTER TABLE purchase_order_items DROP CONSTRAINT purchase_order_items_ingredient_id_fkey, ADD CONSTRAINT purchase_order_items_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE;
ALTER TABLE stock_movements DROP CONSTRAINT stock_movements_ingredient_id_fkey, ADD CONSTRAINT stock_movements_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE;
`;

export const AdminSQLFixScriptPage = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    toast({
      title: "Script copié",
      description: "Le script SQL a été copié dans le presse-papiers.",
      className: "bg-green-600 text-white border-none",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12 max-w-5xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Terminal className="h-6 w-6" /></div>
              Script Correctif SQL (Clés Étrangères)
            </h1>
            <p className="text-muted-foreground mt-1">
              Code SQL prêt à l'emploi pour corriger toutes les suppressions en cascade bloquantes.
            </p>
          </div>
          <Button onClick={handleCopyScript} className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white">
            {copied ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copié !' : 'Copier le script'}
          </Button>
        </div>

        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="font-bold text-blue-900">Instructions d'exécution</AlertTitle>
          <AlertDescription className="mt-2 text-blue-800/90 leading-relaxed">
            <ol className="list-decimal list-inside space-y-2 mt-2 font-medium">
              <li>Cliquez sur le bouton <strong>Copier le script</strong> ci-dessus ou en haut à droite du bloc de code.</li>
              <li>Ouvrez votre tableau de bord <strong>Supabase</strong>.</li>
              <li>Naviguez vers la section <strong>SQL Editor</strong> (icône de terminal dans le menu latéral).</li>
              <li>Créez une nouvelle requête (New Query).</li>
              <li>Collez le script copié dans l'éditeur.</li>
              <li>Cliquez sur <strong>RUN</strong> pour appliquer toutes les modifications d'un coup.</li>
            </ol>
          </AlertDescription>
        </Alert>

        <Card className="border-border/50 shadow-sm overflow-hidden bg-slate-950">
          <CardHeader className="border-b border-slate-800 bg-slate-900 flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-purple-400" /> code.sql
              </CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopyScript}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white"
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <pre className="p-6 overflow-x-auto text-sm font-mono text-purple-300 custom-scrollbar leading-relaxed whitespace-pre-wrap">
              <code>{SQL_SCRIPT}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSQLFixScriptPage;