import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { SINGLE_RESTAURANT_ID } from '@/lib/singleRestaurantSetup';

export default function AdminSingleRestaurantDiagnosticPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDiagnostic() {
      const { data, error } = await supabase.rpc('verify_single_restaurant_setup');
      if (!error) {
        setData(data);
      }
      setLoading(false);
    }
    fetchDiagnostic();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Diagnostic Single Restaurant</h1>
        <p className="text-muted-foreground">Vérification de la configuration pour le restaurant unique: <span className="font-mono bg-muted px-2 py-1 rounded">{SINGLE_RESTAURANT_ID}</span></p>

        {loading ? (
          <div className="flex justify-center p-10">
             <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.results?.map((res, idx) => (
              <Card key={idx} className={res.invalid_count > 0 ? "border-red-500 bg-red-50" : "border-green-500 bg-amber-50"}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {res.invalid_count > 0 ? <AlertTriangle className="text-red-500 w-5 h-5" /> : <CheckCircle className="text-amber-500 w-5 h-5" />}
                    {res.table}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-muted-foreground">Total records:</span>
                    <span>{res.total_count}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium mt-1">
                    <span className="text-muted-foreground">Enregistrements invalides:</span>
                    <span className={res.invalid_count > 0 ? "text-red-600 font-bold" : "text-amber-600"}>{res.invalid_count}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}